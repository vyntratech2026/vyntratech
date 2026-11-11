import { formatLongDate, formatPhone, formatPrice, formatTime } from "./format";
import { type BookingProduct, productsTotal } from "./booking-products";

/** Only real Pushcut notification webhooks are accepted (prevents sending data to arbitrary hosts). */
export function isPushcutUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "api.pushcut.io" && /^\/[^/]+\/notifications\/[^/]+/.test(url.pathname);
  } catch {
    return false;
  }
}

export interface BookingNotificationInput {
  customerName: string;
  customerPhone?: string | null;
  serviceName: string;
  barberName: string;
  startAt: string;
  price: number | string;
  productItems?: BookingProduct[];
}

export interface PushcutPayload {
  title: string;
  text: string;
  defaultAction?: { url: string };
}

export function buildBookingNotification(b: BookingNotificationInput): Pick<PushcutPayload, "title" | "text"> {
  const lines = [
    `${b.customerName} • ${b.serviceName}`,
    `${formatLongDate(b.startAt)} às ${formatTime(b.startAt)}`,
    `Com ${b.barberName} • ${formatPrice(b.price)}`,
  ];
  if (b.customerPhone) lines.push(`Tel: ${formatPhone(b.customerPhone)}`);
  if (b.productItems?.length) {
    lines.push(...b.productItems.map((p) => `${p.quantity}× ${p.name} • ${formatPrice(p.quantity * p.unit_price)}`));
    lines.push(`Total com produtos: ${formatPrice(Number(b.price) + productsTotal(b.productItems))}`);
  }
  return { title: "Novo agendamento", text: lines.join("\n") };
}
