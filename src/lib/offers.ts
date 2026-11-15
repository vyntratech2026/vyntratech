export interface OfferPrice { kind: string; service_id: string | null; price: number; start_date: string | null; end_date: string | null; is_active: boolean }
export function promotionalPrice(serviceId: string, price: number, offers: readonly OfferPrice[], day: string) {
  return offers.reduce((best, o) => o.kind === "promotion" && o.is_active && o.service_id === serviceId && o.start_date && o.end_date && o.start_date <= day && day <= o.end_date ? Math.min(best, Number(o.price)) : best, price);
}
export const packagePeriod = (months: number) => months === 1 ? "mês" : `${months} meses`;