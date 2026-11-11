export const SUBSCRIPTION_WHATSAPP = "https://wa.me/message/FX6QFQ52JMXBB1";
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