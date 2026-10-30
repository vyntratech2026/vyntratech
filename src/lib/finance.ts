export interface PaymentRow {
  amount: number | string;
  kind: string;
  barber_id: string | null;
}

/** Barber commission: only service (cut) payments count; product sales stay with the shop. */
export function commissionFor(payments: PaymentRow[], barberId: string, percent: number): number {
  const base = payments
    .filter((p) => p.kind === "service" && p.barber_id === barberId)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return Math.round(base * percent) / 100;
}

export function sumBy(payments: PaymentRow[], kind?: "service" | "product"): number {
  return payments.filter((p) => !kind || p.kind === kind).reduce((s, p) => s + Number(p.amount), 0);
}

export const PAYMENT_METHODS = {
  cash: "Dinheiro",
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  other: "Outro",
} as const;
