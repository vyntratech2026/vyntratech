import { describe, expect, it } from "vitest";
import {
  bookingWhatsappMessage,
  formatTime,
  isValidPhone,
  normalizePhone,
  toShopDateKey,
  whatsappLink,
} from "./format";

describe("phone normalization", () => {
  it("strips mask and country code so the same customer is not duplicated", () => {
    expect(normalizePhone("+55 (79) 99689-1622")).toBe("79996891622");
    expect(normalizePhone("79 99689 1622")).toBe("79996891622");
  });

  it("rejects numbers without DDD", () => {
    expect(isValidPhone("99689-1622")).toBe(false);
    expect(isValidPhone("(79) 99689-1622")).toBe(true);
  });
});

describe("timezone America/Maceio", () => {
  it("shows times in Aracaju local time (UTC-3)", () => {
    expect(formatTime("2026-11-02T12:00:00Z")).toBe("09:00");
  });

  it("uses the Aracaju calendar day near midnight UTC", () => {
    expect(toShopDateKey("2026-11-03T02:00:00Z")).toBe("2026-11-02");
  });
});

describe("WhatsApp message", () => {
  it("opens the shop number 5579996891622 with the filled template", () => {
    const msg = bookingWhatsappMessage({
      customerName: "João Silva",
      serviceName: "Corte",
      barberName: "Cleison",
      startAt: "2026-11-02T12:00:00Z",
      price: 40,
    });
    expect(msg).toContain("Gostaria de confirmar meu agendamento no Studio Cleison Cortes.");
    expect(msg).toContain("Horário: 09:00");
    expect(msg).toContain("Data: 02/11/2026");
    expect(whatsappLink("5579996891622", msg)).toMatch(/^https:\/\/wa\.me\/5579996891622\?text=/);
  });
});
