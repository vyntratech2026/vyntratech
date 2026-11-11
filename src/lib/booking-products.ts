export interface BookingProduct {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export function bookingProducts(value: unknown): BookingProduct[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BookingProduct =>
    !!item && typeof item === "object" && typeof item.product_id === "string" &&
    typeof item.name === "string" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    typeof item.unit_price === "number" && Number.isFinite(item.unit_price));
}

export function productsTotal(items: BookingProduct[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) * 100) / 100;
}