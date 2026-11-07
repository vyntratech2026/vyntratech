import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildBookingNotification, isPushcutUrl } from "./pushcut";
import { requestOrigin, sendPushcut } from "./pushcut.server";

function adminLink(): { url: string } | undefined {
  const origin = requestOrigin();
  return origin ? { url: `${origin}/admin/agendamentos` } : undefined;
}

/**
 * Public: called right after an online booking. Keyed by the private manage_token,
 * only fires once per appointment (notified_at) and only for fresh bookings.
 */
export const notifyNewBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: appt, error } = await supabaseAdmin
        .from("appointments")
        .update({ notified_at: new Date().toISOString() })
        .eq("manage_token", data.token)
        .eq("source", "online")
        .is("notified_at", null)
        .gte("created_at", since)
        .select("id, start_at, service_name, price, barbers(name), customers!appointments_customer_id_fkey(full_name, phone)")
        .maybeSingle();
      if (error || !appt) return { sent: false };

      const { data: cfg } = await supabaseAdmin
        .from("notification_settings")
        .select("pushcut_enabled, pushcut_url")
        .eq("id", 1)
        .maybeSingle();
      if (!cfg?.pushcut_enabled || !cfg.pushcut_url || !isPushcutUrl(cfg.pushcut_url)) return { sent: false };

      const msg = buildBookingNotification({
        customerName: appt.customers?.full_name ?? "Cliente",
        customerPhone: appt.customers?.phone ?? null,
        serviceName: appt.service_name,
        barberName: appt.barbers?.name ?? "Barbeiro",
        startAt: appt.start_at,
        price: appt.price,
      });
      const link = adminLink();
      const res = await sendPushcut(cfg.pushcut_url, link ? { ...msg, defaultAction: link } : msg);
      return { sent: res.ok };
    } catch (err) {
      console.error("notifyNewBooking failed", err);
      return { sent: false };
    }
  });

/** Admin only: sends a test notification to the given Pushcut URL. */
export const sendPushcutTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().trim().max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas o administrador pode testar as notificações.");
    if (!isPushcutUrl(data.url)) throw new Error("Link do Pushcut inválido. Ele começa com https://api.pushcut.io/");
    const link = adminLink();
    const res = await sendPushcut(data.url, {
      title: "Teste — Studio Cleison Cortes",
      text: "Se você recebeu isto, os avisos de novos agendamentos estão funcionando.",
      ...(link ? { defaultAction: link } : {}),
    }).catch(() => ({ ok: false, status: 0 }));
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? "O Pushcut não encontrou essa notificação. Confira o link."
          : "O Pushcut não respondeu. Confira o link e tente de novo.",
      );
    }
    return { ok: true };
  });
