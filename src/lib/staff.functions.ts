import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizePhone } from "./format";
import { staffEmailFromPhone } from "./staff-auth";

const phoneSchema = z
  .string()
  .transform((v) => normalizePhone(v))
  .refine((v) => /^\d{10,11}$/.test(v), "Número de celular inválido. Use DDD + número.");
const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72);

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function friendlyAuthError(message: string): string {
  if (/already been registered|already exists/i.test(message)) {
    return "Este número de celular já tem um acesso cadastrado.";
  }
  return message;
}

/** Creates the very first administrator. Refuses once any admin exists. */
export const setupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2, "Informe seu nome.").max(120),
        phone: phoneSchema,
        password: passwordSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const admin = await getAdminClient();
    const { count, error: countError } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error("Não foi possível verificar o sistema.");
    if ((count ?? 0) > 0) throw new Error("O administrador já foi criado. Faça login.");

    const { data: created, error } = await admin.auth.admin.createUser({
      email: staffEmailFromPhone(data.phone),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, phone: data.phone },
    });
    if (error || !created.user) throw new Error(friendlyAuthError(error?.message ?? "Erro ao criar acesso."));

    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error("Não foi possível concluir o cadastro do administrador.");
    }
    await admin.from("profiles").update({ full_name: data.name }).eq("id", created.user.id);
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Apenas o administrador pode fazer isso.");
}

/** Admin creates (or replaces) the login of a barber: phone + password. */
export const createBarberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ barberId: z.string().uuid(), phone: phoneSchema, password: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();

    const { data: barber, error: bErr } = await admin
      .from("barbers")
      .select("id, name, user_id")
      .eq("id", data.barberId)
      .single();
    if (bErr || !barber) throw new Error("Barbeiro não encontrado.");
    if (barber.user_id) throw new Error("Este barbeiro já tem acesso. Use 'Trocar senha'.");

    const { data: created, error } = await admin.auth.admin.createUser({
      email: staffEmailFromPhone(data.phone),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: barber.name, phone: data.phone },
    });
    if (error || !created.user) throw new Error(friendlyAuthError(error?.message ?? "Erro ao criar acesso."));

    const uid = created.user.id;
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: uid, role: "barber" });
    const { error: linkErr } = await admin.from("barbers").update({ user_id: uid }).eq("id", barber.id);
    if (roleErr || linkErr) {
      await admin.auth.admin.deleteUser(uid);
      throw new Error("Não foi possível vincular o acesso ao barbeiro.");
    }
    await admin.from("profiles").update({ full_name: barber.name, barber_id: barber.id }).eq("id", uid);
    return { ok: true };
  });

/** Admin sets a new password for a barber's login. */
export const resetBarberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ barberId: z.string().uuid(), password: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: barber } = await admin.from("barbers").select("user_id").eq("id", data.barberId).single();
    if (!barber?.user_id) throw new Error("Este barbeiro ainda não tem acesso.");
    const { error } = await admin.auth.admin.updateUserById(barber.user_id, { password: data.password });
    if (error) throw new Error("Não foi possível trocar a senha.");
    return { ok: true };
  });

/** Admin removes a barber's login (the barber profile and history stay). */
export const revokeBarberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ barberId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: barber } = await admin.from("barbers").select("user_id").eq("id", data.barberId).single();
    if (!barber?.user_id) return { ok: true };
    await admin.from("barbers").update({ user_id: null }).eq("id", data.barberId);
    await admin.auth.admin.deleteUser(barber.user_id);
    return { ok: true };
  });
