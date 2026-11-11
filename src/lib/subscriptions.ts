export const SUBSCRIPTION_WHATSAPP = "https://wa.me/message/FX6QFQ52JMXBB1";
// Commercial tiers are distinct from the manual access durations below.
export const COMMERCIAL_PLANS = [
  { value: "start", name: "Vyntra Start", monthlyPriceCents: 3990, professionalLimit: 3 },
  { value: "pro", name: "Vyntra Pro", monthlyPriceCents: 6990, professionalLimit: 6 },
  { value: "business", name: "Vyntra Business", monthlyPriceCents: 11990, professionalLimit: null },
] as const;
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
export type Subscription = { status: string; plan: string | null; expires_at: string | null };
export function subscriptionState(value: Subscription | null | undefined, now = Date.now()) {
  if (!value || value.status === "pending") return "pending";
  if (value.status === "suspended") return "suspended";
  if (value.status !== "active") return "pending";
  if (value.plan === "lifetime") return "active";
  return value.expires_at && new Date(value.expires_at).getTime() > now ? "active" : "expired";
}
export const SUBSCRIPTION_STATUS = { active: "Liberada", pending: "Aguardando liberação", suspended: "Suspensa", expired: "Vencida" };