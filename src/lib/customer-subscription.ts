export const CUSTOMER_SUBSCRIPTION_MIN_MONTHS = 1;
export const CUSTOMER_SUBSCRIPTION_MAX_MONTHS = 120;

export function parseSubscriptionMonths(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < CUSTOMER_SUBSCRIPTION_MIN_MONTHS || value > CUSTOMER_SUBSCRIPTION_MAX_MONTHS) {
    return null;
  }
  return value;
}

export function subscriptionMonthsLabel(months: number): string {
  return months === 1 ? "1 mês" : `${months} meses`;
}

export function formatDateKeyBr(dateKey: string | null | undefined): string {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-");
  if (!y || !m || !d) return dateKey;
  return `${d}/${m}/${y}`;
}

/** Calendar-safe month addition matching PostgreSQL `date + make_interval(months => n)`. */
export function addMonthsKey(dateKey: string, months: number): string {
  const [y = 1970, m = 1, d = 1] = dateKey.split("-").map(Number);
  const totalMonths = m - 1 + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(d, lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay)).toISOString().slice(0, 10);
}

export interface CustomerSubscriptionFormInput {
  isSubscriber: boolean;
  offerId: string;
  fallbackPackageName?: string | null;
  monthsRaw: string;
  startedAt?: string | null;
  todayKey: string;
}

export interface CustomerSubscriptionUpdate {
  is_subscriber: boolean;
  subscription_offer_id: string | null;
  subscription_package_name: string | null;
  subscription_months: number | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
}

export function buildCustomerSubscriptionUpdate(input: CustomerSubscriptionFormInput): CustomerSubscriptionUpdate {
  if (!input.isSubscriber) {
    return {
      is_subscriber: false,
      subscription_offer_id: null,
      subscription_package_name: null,
      subscription_months: null,
      subscription_started_at: null,
      subscription_ends_at: null,
    };
  }

  const offerId = input.offerId.trim();
  const fallbackName = input.fallbackPackageName?.trim() || null;
  if (!offerId && !fallbackName) {
    throw new Error("Escolha um pacote de assinatura para o cliente.");
  }

  const months = parseSubscriptionMonths(input.monthsRaw);
  if (months === null) {
    throw new Error(`Informe uma quantidade válida de meses (entre ${CUSTOMER_SUBSCRIPTION_MIN_MONTHS} e ${CUSTOMER_SUBSCRIPTION_MAX_MONTHS}).`);
  }

  const startedAt = input.startedAt?.trim() || input.todayKey;
  const endsAt = addMonthsKey(startedAt, months);

  return {
    is_subscriber: true,
    subscription_offer_id: offerId || null,
    subscription_package_name: offerId ? null : fallbackName,
    subscription_months: months,
    subscription_started_at: startedAt,
    subscription_ends_at: endsAt,
  };
}