import { describe, expect, it } from "vitest";
import { bookingProducts, productsTotal } from "./booking-products";
import { bookingWhatsappMessage } from "./format";
import { buildBookingNotification } from "./pushcut";

describe("products included with a booking", () => {
  const items = [{ product_id: "p1", name: "Pomada", quantity: 2, unit_price: 25 }];
  const booking = { customerName: "Cliente", serviceName: "Corte", barberName: "Profissional", startAt: "2026-11-12T12:00:00Z", price: 40, productItems: items };
  it("totals product quantities independently from service price", () => {
    expect(productsTotal(items)).toBe(50);
    expect(booking.price).toBe(40);
  });
  it("keeps selected product details in WhatsApp and push notices", () => {
    expect(bookingWhatsappMessage(booking)).toContain("2× Pomada");
    expect(buildBookingNotification(booking).text).toContain("2× Pomada");
  });
  it("handles bookings without products", () => {
    expect(bookingProducts(null)).toEqual([]);
    expect(productsTotal([])).toBe(0);
  });
});