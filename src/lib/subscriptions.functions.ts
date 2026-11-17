import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { subscriptionDateRange } from "./subscriptions";

export const listPlatformCompanies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error } = await context.supabase.rpc("claim_platform_admin");
    if (error || !allowed) throw new Error("Acesso exclusivo do administrador da plataforma.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: companies, error: readError } = await supabaseAdmin.from("companies")
      .select("id, name, slug, created_by, created_at, company_subscriptions(status, plan, starts_at, expires_at, trial_ends_at), company_members(user_id, role)")
      .order("created_at", { ascending: false });
    if (readError) throw readError;
    return Promise.all((companies ?? []).map(async (company) => {
      const ownerId = company.created_by ?? company.company_members.find((m) => m.role === "admin")?.user_id;
      let ownerEmail: string | null = null;
      if (ownerId) {
        const { data: owner, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(ownerId);
        if (ownerError) throw ownerError;
        ownerEmail = owner.user?.email ?? null;
      }
      return { id: company.id, name: company.name, slug: company.slug, created_at: company.created_at, subscription: company.company_subscriptions, ownerEmail };
    }));
  });

export const changeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const data = z.object({ companyId: z.string().uuid(), plan: z.enum(["start", "pro", "business"]), suspend: z.boolean().default(false), startDate: z.string().optional(), endDate: z.string().optional() }).parse(input);
    if (!data.suspend) subscriptionDateRange(data.startDate ?? "", data.endDate ?? "");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { error } = data.suspend
      ? await context.supabase.rpc("set_company_subscription", { p_company_id: data.companyId, p_plan: data.plan, p_suspend: true })
      : await context.supabase.rpc("set_company_subscription_dates", { p_company_id: data.companyId, p_plan: data.plan, p_start_date: data.startDate ?? "", p_end_date: data.endDate ?? "" });
    if (error) throw error;
    return { ok: true };
  });