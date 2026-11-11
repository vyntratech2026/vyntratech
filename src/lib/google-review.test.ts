import { describe, expect, it } from "vitest";
import { bookingGoogleReviewUrl, googleReviewUrl } from "./google-review";

describe("Google review links", () => {
  it("accepts the Google review link and trims surrounding spaces", () => {
    expect(googleReviewUrl(" https://g.page/r/example/review ")).toBe("https://g.page/r/example/review");
    expect(googleReviewUrl("https://search.google.com/local/writereview?placeid=example")).toBe("https://search.google.com/local/writereview?placeid=example");
  });
  it("does not offer an empty or unsafe destination", () => {
    for (const value of [null, "", "javascript:alert(1)", "http://g.page/r/example/review", "https://google.com.evil.test/review", "https://evil.test", "https://user@g.page/review"])
      expect(googleReviewUrl(value)).toBeNull();
  });
  it("offers Google reviews after a completed appointment only", () => {
    const link = "https://g.page/r/example/review";
    expect(bookingGoogleReviewUrl("completed", link)).toBe(link);
    for (const status of ["pending", "confirmed", "cancelled", "no_show"])
      expect(bookingGoogleReviewUrl(status, link)).toBeNull();
  });
});