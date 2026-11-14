import { describe, it, expect } from "vitest";
import { COMMERCIAL_PLANS, SUBSCRIPTION_PLANS, SUBSCRIPTION_WHATSAPP, commercialPlanLabel, professionalCapacity, subscriptionState, subscriptionDateRange, subscriptionEndDate, savedCommercialPlan } from "./subscriptions";
describe("Plano salvo", () => {
  it.each(["start", "pro", "business"])("mantém %s ao recarregar", (plan) => expect(savedCommercialPlan(plan)).toBe(plan));
});
describe("Datas escolhidas na liberação", () => {
  it("usa o início escolhido em America/Maceio e inclui todo o dia do vencimento", () => {
    expect(subscriptionDateRange("2026-11-13", "2026-12-13")).toEqual({ starts_at: "2026-11-13T03:00:00.000Z", expires_at: "2026-12-14T03:00:00.000Z" });
    expect(subscriptionEndDate("2026-12-14T03:00:00.000Z")).toBe("2026-12-13");
  });
  it("rejeita vencimento anterior ao início e datas inválidas", () => {
    expect(() => subscriptionDateRange("2026-11-13", "2026-11-12")).toThrow();
    expect(() => subscriptionDateRange("2026-02-30", "2026-12-13")).toThrow();
  });
  it("não libera antes da data de início", () => {
    expect(subscriptionState({ status: "active", plan: "start", ...subscriptionDateRange("2026-11-13", "2026-12-13") }, Date.parse("2026-11-13T02:59:59Z"))).toBe("pending");
    expect(subscriptionState({ status: "active", plan: "start", ...subscriptionDateRange("2026-11-13", "2026-12-13") }, Date.parse("2026-11-13T03:00:00Z"))).toBe("active");
  });
});
describe("Limites de cadastro de profissionais", () => {
  it("Start permite 3 profissionais e oferece Pro ao atingir o limite", () => {
    expect(professionalCapacity("start", 2).reached).toBe(false);
    expect(professionalCapacity("start", 3).reached).toBe(true);
    expect(professionalCapacity("start", 4).reached).toBe(true);
    expect(professionalCapacity("start", 3).nextPlan?.value).toBe("pro");
  });
  it("Pro permite 6 profissionais e oferece Business ao atingir o limite", () => {
    expect(professionalCapacity("pro", 5).reached).toBe(false);
    expect(professionalCapacity("pro", 6).reached).toBe(true);
    expect(professionalCapacity("pro", 7).reached).toBe(true);
    expect(professionalCapacity("pro", 6).nextPlan?.value).toBe("business");
  });
  it("Business não limita o cadastro", () => {
    expect(professionalCapacity("business", 100000).reached).toBe(false);
    expect(professionalCapacity("business", 100000).nextPlan).toBeNull();
  });
  it("preserva a capacidade de liberações antigas sem plano comercial", () => {
    expect(professionalCapacity("lifetime", 10).reached).toBe(false);
    expect(professionalCapacity("monthly", 10).reached).toBe(false);
  });
});
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