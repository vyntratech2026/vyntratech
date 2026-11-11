import { type BookingProduct, productsTotal } from "./booking-products";

export const TIMEZONE = "America/Maceio";

export const STATUS_LABELS = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
} as const;

export type AppointmentStatus = keyof typeof STATUS_LABELS;

export const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function formatLongDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(iso));
}

export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Today's date (YYYY-MM-DD) in Aracaju. */
export function todayInShop(now: Date = new Date()): string {
  return toShopDateKey(now);
}

/** YYYY-MM-DD of an instant, as seen in Aracaju. */
export function toShopDateKey(d: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(d));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Add days to a YYYY-MM-DD key (calendar math, timezone independent). */
export function addDaysKey(key: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function dayOfWeekFromKey(key: string): number {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Start instant (UTC ISO) of a local Aracaju date. Aracaju is fixed UTC-3 (no DST). */
export function shopDayStartIso(key: string): string {
  return new Date(`${key}T00:00:00-03:00`).toISOString();
}

/** Keep only digits; drop leading 55 country code. Returns DDD + number. */
export function normalizePhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (/^55\d{10,11}$/.test(d)) return d.slice(2);
  return d;
}

export function isValidPhone(input: string): boolean {
  return /^\d{10,11}$/.test(normalizePhone(input));
}

export function formatPhone(input: string): string {
  const d = normalizePhone(input);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return input;
}

export const SHOP_WHATSAPP = "5579996891622";

export function whatsappLink(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export interface BookingMessageInput {
  customerName: string;
  serviceName: string;
  barberName: string;
  startAt: string;
  price: number | string;
  businessName?: string;
  productItems?: BookingProduct[];
}

export function bookingWhatsappMessage(b: BookingMessageInput): string {
  return [
    `Olá! Gostaria de confirmar meu agendamento no ${b.businessName || "Studio Cleison Cortes"}.`,
    "",
    `Nome: ${b.customerName}`,
    `Serviço: ${b.serviceName}`,
    `Barbeiro: ${b.barberName}`,
    `Data: ${formatDate(b.startAt)}`,
    `Horário: ${formatTime(b.startAt)}`,
    `Valor: ${formatPrice(b.price)}`,
    ...(b.productItems?.length ? [
      "Produtos:",
      ...b.productItems.map((p) => `${p.quantity}× ${p.name} — ${formatPrice(p.quantity * p.unit_price)}`),
      `Total com produtos: ${formatPrice(Number(b.price) + productsTotal(b.productItems))}`,
    ] : []),
  ].join("\n");
}

export function errorMessage(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message || fallback;
  }
  return fallback;
}
