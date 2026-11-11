import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isRealEmail } from "./staff-auth";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => isRealEmail(v), "Informe um e-mail válido.");
const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72);

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function friendlyAuthError(message: string): string {
  if (/already been registered|already exists/i.test(message)) {
    return "Este e-mail já tem um acesso cadastrado.";
  }
  if (/already registered|email.*exists|duplicate/i.test(message)) {
    return "Este e-mail já está sendo usado por outro acesso.";
  }
  if (/weak|easy to guess|pwned/i.test(message)) {
    return "Essa senha é muito fácil de adivinhar. Use uma mais forte, misturando letras, números e símbolos.";
  }
  return message;
}

/** The caller must be an administrator of the company that owns this barber. */
async function assertBarberAdmin(context: { supabase: any }, barberId: string) {
  const admin = await getAdminClient();
  const { data: barber } = await admin.from("barbers").select("id, name, user_id, company_id").eq("id", barberId).single();
  if (!barber) throw new Error("Profissional não encontrado.");
  const { data: ok, error } = await context.supabase.rpc("is_company_admin", { _cid: barber.company_id });
  if (error || !ok) throw new Error("Apenas o administrador pode fazer isso.");
  return { admin, barber };
}

/** Admin creates (or replaces) the login of a barber: e-mail + password. */
export const createBarberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ barberId: z.string().uuid(), email: emailSchema, password: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { admin, barber } = await assertBarberAdmin(context, data.barberId);
    if (barber.user_id) throw new Error("Este profissional já tem acesso. Use 'Trocar senha'.");

    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: barber.name },
    });
    if (error || !created.user) throw new Error(friendlyAuthError(error?.message ?? "Erro ao criar acesso."));

    const uid = created.user.id;
    const { error: roleErr } = await admin.from("company_members").insert({ user_id: uid, role: "barber", company_id: barber.company_id });
    const { error: linkErr } = await admin.from("barbers").update({ user_id: uid }).eq("id", barber.id);
    if (roleErr || linkErr) {
      await admin.auth.admin.deleteUser(uid);
      throw new Error("Não foi possível vincular o acesso ao profissional.");
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
    const { admin, barber } = await assertBarberAdmin(context, data.barberId);
    if (!barber?.user_id) throw new Error("Este profissional ainda não tem acesso.");
    const { error } = await admin.auth.admin.updateUserById(barber.user_id, { password: data.password });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { ok: true };
  });

/** Admin removes a barber's login (the barber profile and history stay). */
export const revokeBarberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ barberId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { admin, barber } = await assertBarberAdmin(context, data.barberId);
    if (!barber?.user_id) return { ok: true };
    await admin.from("barbers").update({ user_id: null }).eq("id", data.barberId);
    await admin.from("company_members").delete().eq("user_id", barber.user_id);
    await admin.auth.admin.deleteUser(barber.user_id);
    return { ok: true };
  });

/**
 * A team member sets the e-mail used to sign in (and to recover the password / use Google).
 * Done server-side because older accounts have an internal address that cannot confirm a change.
 */
export const updateMyLoginEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ email: emailSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isBarber }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "barber" }),
    ]);
    if (!isAdmin && !isBarber) throw new Error("Apenas a equipe pode fazer isso.");
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(context.userId, {
      email: data.email,
      email_confirm: true,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    return { ok: true, email: data.email };
  });
