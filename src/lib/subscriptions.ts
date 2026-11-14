export const SUBSCRIPTION_WHATSAPP = "https://wa.me/message/FX6QFQ52JMXBB1";
// Commercial tiers are distinct from the manual access durations below.
export const COMMERCIAL_PLANS = [
  { value: "start", name: "Vyntra Start", monthlyPriceCents: 3990, professionalLimit: 3 },
  { value: "pro", name: "Vyntra Pro", monthlyPriceCents: 6990, professionalLimit: 6 },
  { value: "business", name: "Vyntra Business", monthlyPriceCents: 11990, professionalLimit: null },
] as const;
export type CommercialPlan = typeof COMMERCIAL_PLANS[number]["value"];
export const savedCommercialPlan = (value: string | null | undefined): CommercialPlan => COMMERCIAL_PLANS.find((p) => p.value === value)?.value ?? "start";
export const commercialPlanLabel = (value: string | null | undefined) => COMMERCIAL_PLANS.find((p) => p.value === value)?.name;
export function professionalCapacity(plan: string | null | undefined, count: number) {
  const current = COMMERCIAL_PLANS.find((p) => p.value === plan);
  const limit = current?.professionalLimit ?? null;
  return {
    limit,
    reached: limit !== null && count >= limit,
    nextPlan: plan === "start" ? COMMERCIAL_PLANS[1] : plan === "pro" ? COMMERCIAL_PLANS[2] : null,
  };
}
export const PLAN_FEATURES = [
  "Dashboard completo",
  "Relatórios de agendamentos",
  "Gestão de clientes",
  "Controle financeiro",
  "Cadastro de profissionais",
  "Gestão de serviços",
  "Cadastro de produtos",
  "Avaliações de clientes",
  "Notificações pelo celular",
  "Site próprio de agendamento",
  "Personalização da página",
] as const;
export const SUBSCRIPTION_PLANS = [
  { value: "monthly", label: "Mensal", months: 1 },
  { value: "quarterly", label: "Trimestral", months: 3 },
  { value: "semiannual", label: "6 meses", months: 6 },
  { value: "annual", label: "1 ano", months: 12 },
  { value: "lifetime", label: "Definitiva", months: null },
] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number]["value"];
import { addDaysKey, shopDayStartIso, toShopDateKey } from "./format";

export function subscriptionDateRange(start: string, end: string) {
  const valid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!valid(start) || !valid(end) || end < start) throw new Error("Informe início e vencimento válidos. O vencimento não pode ser anterior ao início.");
  return { starts_at: shopDayStartIso(start), expires_at: shopDayStartIso(addDaysKey(end, 1)) };
}
export const subscriptionEndDate = (expiresAt: string) => toShopDateKey(new Date(Date.parse(expiresAt) - 1));
export type Subscription = { status: string; plan: string | null; starts_at?: string | null; expires_at: string | null };
export function subscriptionState(value: Subscription | null | undefined, now = Date.now()) {
  if (!value || value.status === "pending") return "pending";
  if (value.status === "suspended") return "suspended";
  if (value.status !== "active") return "pending";
  if (value.starts_at && new Date(value.starts_at).getTime() > now) return "pending";
  if (value.plan === "lifetime") return "active";
  return value.expires_at && new Date(value.expires_at).getTime() > now ? "active" : "expired";
}
export const SUBSCRIPTION_STATUS = { active: "Liberada", pending: "Aguardando liberação", suspended: "Suspensa", expired: "Vencida" };