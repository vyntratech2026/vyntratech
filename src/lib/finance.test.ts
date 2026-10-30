import { describe, expect, it } from "vitest";
import { commissionFor, sumBy } from "./finance";

describe("barber commission", () => {
  const payments = [
    { amount: 50, kind: "service", barber_id: "b1" },
    { amount: "30.00", kind: "service", barber_id: "b1" },
    { amount: 40, kind: "product", barber_id: "b1" },
    { amount: 100, kind: "service", barber_id: "b2" },
  ];

  it("applies the owner's % only to the barber's cuts, not product sales", () => {
    expect(commissionFor(payments, "b1", 40)).toBe(32);
  });

  it("product sales count toward shop revenue", () => {
    expect(sumBy(payments, "product")).toBe(40);
    expect(sumBy(payments)).toBe(220);
  });
});
