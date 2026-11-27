import { describe, expect, it } from "vitest";
import { addMonthsKey, buildCustomerSubscriptionUpdate, formatDateKeyBr, parseSubscriptionMonths, subscriptionMonthsLabel } from "./customer-subscription";

describe("customer subscription helpers", () => {
  it("validates months between 1 and 120", () => {
    expect(parseSubscriptionMonths("1")).toBe(1);
    expect(parseSubscriptionMonths("6")).toBe(6);
    expect(parseSubscriptionMonths("120")).toBe(120);
    expect(parseSubscriptionMonths("")).toBeNull();
    expect(parseSubscriptionMonths("0")).toBeNull();
    expect(parseSubscriptionMonths("-3")).toBeNull();
    expect(parseSubscriptionMonths("2.5")).toBeNull();
    expect(parseSubscriptionMonths("121")).toBeNull();
    expect(parseSubscriptionMonths("abc")).toBeNull();
  });

  it("clamps month-end dates like Postgres make_interval", () => {
    expect(addMonthsKey("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsKey("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsKey("2026-11-27", 3)).toBe("2027-02-27");
  });

  it("clears all fields when customer is not a subscriber", () => {
    expect(buildCustomerSubscriptionUpdate({ isSubscriber: false, offerId: "offer-1", monthsRaw: "3", todayKey: "2026-11-27" })).toEqual({
      is_subscriber: false,
      subscription_offer_id: null,
      subscription_package_name: null,
      subscription_months: null,
      subscription_started_at: null,
      subscription_ends_at: null,
    });
  });

  it("builds a valid subscriber update with package and months", () => {
    expect(buildCustomerSubscriptionUpdate({ isSubscriber: true, offerId: "offer-1", monthsRaw: "6", todayKey: "2026-11-27" })).toEqual({
      is_subscriber: true,
      subscription_offer_id: "offer-1",
      subscription_package_name: null,
      subscription_months: 6,
      subscription_started_at: "2026-11-27",
      subscription_ends_at: "2027-05-27",
    });
  });

  it("rejects subscriber without a package or with invalid months", () => {
    expect(() => buildCustomerSubscriptionUpdate({ isSubscriber: true, offerId: "", monthsRaw: "3", todayKey: "2026-11-27" })).toThrow("pacote");
    expect(() => buildCustomerSubscriptionUpdate({ isSubscriber: true, offerId: "offer-1", monthsRaw: "0", todayKey: "2026-11-27" })).toThrow("meses");
  });

  it("formats dates and labels in pt-BR", () => {
    expect(formatDateKeyBr("2026-11-27")).toBe("27/11/2026");
    expect(subscriptionMonthsLabel(1)).toBe("1 mês");
    expect(subscriptionMonthsLabel(3)).toBe("3 meses");
  });
});