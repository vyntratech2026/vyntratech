import { describe, expect, it } from "vitest";
import { promotionalPrice, packagePeriod } from "./offers";
const offer = { kind: "promotion", service_id: "corte", price: 25, start_date: "2026-11-14", end_date: "2026-11-20", is_active: true };
describe("Promoções com prazo", () => {
  it("aplica preço no primeiro e último dia", () => {
    expect(promotionalPrice("corte", 40, [offer], "2026-11-14")).toBe(25);
    expect(promotionalPrice("corte", 40, [offer], "2026-11-20")).toBe(25);
  });
  it("mantém preço fora do prazo, em outro serviço ou desativada", () => {
    expect(promotionalPrice("corte", 40, [offer], "2026-11-21")).toBe(40);
    expect(promotionalPrice("barba", 40, [offer], "2026-11-14")).toBe(40);
    expect(promotionalPrice("corte", 40, [{ ...offer, is_active: false }], "2026-11-14")).toBe(40);
  });
  it("não aumenta o preço normal e escolhe a melhor promoção", () => expect(promotionalPrice("corte", 20, [offer], "2026-11-14")).toBe(20));
});
it("pacotes indicam o período da assinatura", () => { expect(packagePeriod(1)).toBe("mês"); expect(packagePeriod(3)).toBe("3 meses"); });