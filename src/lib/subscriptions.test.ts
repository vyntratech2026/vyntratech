import { describe, it, expect } from "vitest";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_WHATSAPP, subscriptionState } from "./subscriptions";
describe("Assinaturas manuais", () => {
  it.each([["monthly", 1], ["quarterly", 3], ["semiannual", 6], ["annual", 12], ["lifetime", null]])("prazo %s corresponde a %s meses", (plan, months) => {
    expect(SUBSCRIPTION_PLANS.find((p) => p.value === plan)?.months).toBe(months);
  });
  it("assinatura definitiva não vence", () => expect(subscriptionState({ status: "active", plan: "lifetime", expires_at: null }, Date.parse("2099-01-01"))).toBe("active"));
  it("prazo vencido bloqueia exatamente no vencimento", () => expect(subscriptionState({status:"active",plan:"monthly",expires_at:"2026-12-11T03:00:00Z"},Date.parse("2026-12-11T03:00:00Z"))).toBe("expired"));
  it("novo cadastro aguarda liberação", () => expect(subscriptionState(null)).toBe("pending"));
  it("suspensão bloqueia até assinatura definitiva", () => expect(subscriptionState({status:"suspended",plan:"lifetime",expires_at:null})).toBe("suspended"));
  it("assinar leva ao WhatsApp informado", () => expect(SUBSCRIPTION_WHATSAPP).toBe("https://wa.me/message/FX6QFQ52JMXBB1"));
});