import { describe, expect, it } from "vitest";
import { bookingProfessionals } from "./booking-professionals";

describe("Escolha do profissional", () => {
  it("mostra todos os ativos mesmo sem serviço vinculado ou sem horário livre", () => {
    const professionals = [
      { id: "lucas", is_active: true, services: ["corte"], slots: [] },
      { id: "matheus", is_active: true, services: [], slots: [] },
    ];
    expect(bookingProfessionals(professionals).map((p) => p.id)).toEqual(["lucas", "matheus"]);
  });
  it("não oferece profissionais inativos ou removidos", () => {
    expect(bookingProfessionals([
      { id: "ativo", is_active: true, deleted_at: null },
      { id: "inativo", is_active: false, deleted_at: null },
      { id: "removido", is_active: true, deleted_at: "2026-11-13T03:00:00Z" },
    ]).map((p) => p.id)).toEqual(["ativo"]);
  });
});