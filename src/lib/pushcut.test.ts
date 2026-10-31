import { describe, expect, it } from "vitest";
import { buildBookingNotification, isPushcutUrl } from "./pushcut";

describe("pushcut url", () => {
  it("accepts the owner's Pushcut notification webhook", () => {
    expect(isPushcutUrl("https://api.pushcut.io/ED0YW0nXfIfqsLxYViDqb/notifications/Novo%20agendamento!")).toBe(true);
  });

  it("rejects links that are not Pushcut notifications", () => {
    expect(isPushcutUrl("https://evil.example.com/notifications/x")).toBe(false);
    expect(isPushcutUrl("http://api.pushcut.io/abc/notifications/x")).toBe(false);
    expect(isPushcutUrl("https://api.pushcut.io/abc/execute")).toBe(false);
  });
});

describe("booking notification", () => {
  it("shows customer, service, Aracaju time, barber and price", () => {
    const msg = buildBookingNotification({
      customerName: "João",
      customerPhone: "79996891622",
      serviceName: "Corte",
      barberName: "Cleison",
      startAt: "2026-11-02T17:30:00.000Z",
      price: 40,
    });
    expect(msg.title).toBe("Novo agendamento");
    expect(msg.text).toContain("João • Corte");
    expect(msg.text).toContain("14:30");
    expect(msg.text).toContain("Com Cleison");
    expect(msg.text).toContain("R$");
  });
});
