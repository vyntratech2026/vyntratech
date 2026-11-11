import { describe, it, expect } from "vitest";
import { COMMERCIAL_PLANS, SUBSCRIPTION_PLANS, SUBSCRIPTION_WHATSAPP, commercialPlanLabel, subscriptionState } from "./subscriptions";
describe("Planos comerciais", () => {
  it.each([["start", 3990], ["pro", 6990], ["business", 11990]])("preço mensal de %s é %s centavos", (tier, price) => {
    expect(COMMERCIAL_PLANS.find((plan) => plan.value === tier)?.monthlyPriceCents).toBe(price);
  });
  it.each([["start", 3], ["pro", 6], ["business", null]])("capacidade de %s é %s", (tier, limit) => {
    expect(COMMERCIAL_PLANS.find((plan) => plan.value === tier)?.professionalLimit).toBe(limit);
  });
  it("liberação da plataforma oferece exatamente start, pro e business", () => {
    expect(COMMERCIAL_PLANS.map((plan) => plan.value)).toEqual(["start", "pro", "business"]);
  });
  it("nome do plano aparece na administração", () => {
    expect(commercialPlanLabel("pro")).toBe("Vyntra Pro");
    expect(commercialPlanLabel("lifetime")).toBeUndefined();
  });
});
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