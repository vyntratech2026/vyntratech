import { describe, expect, it } from "vitest";
import { slugify, slugProblem } from "./company-slug";

describe("company link", () => {
  it("suggests a link from the business name", () => {
    expect(slugify("Barbearia do João")).toBe("barbearia-do-joao");
  });

  it("refuses paths the platform uses", () => {
    expect(slugProblem("admin")).toBe("reserved");
    expect(slugProblem("agendar")).toBe("reserved");
  });

  it("refuses too short or malformed links", () => {
    expect(slugProblem("ab")).toBe("invalid");
    expect(slugProblem("loja--x")).toBe("invalid");
    expect(slugProblem("-loja")).toBe("invalid");
  });

  it("accepts a normal link", () => {
    expect(slugProblem("studio-cleison-cortes")).toBe(null);
  });
});
