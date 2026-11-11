import { bookingProducts, productsTotal } from "@/lib/booking-products";
import { formatPrice } from "@/lib/format";

export function BookingProductSummary({ items, servicePrice }: { items: unknown; servicePrice: number | string }) {
  const products = bookingProducts(items);
  if (!products.length) return null;
  return <div className="space-y-2 p-4 text-sm">
    <p className="font-semibold">Produtos</p>
    {products.map((p) => <div key={p.product_id} className="flex items-start justify-between gap-3">
      <span className="min-w-0 break-words">{p.quantity}× {p.name}</span>
      <span className="shrink-0">{formatPrice(p.quantity * p.unit_price)}</span>
    </div>)}
    <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold"><span>Total com produtos</span><span>{formatPrice(Number(servicePrice) + productsTotal(products))}</span></div>
  </div>;
}