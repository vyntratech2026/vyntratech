import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND, readableOn, themeCss, themeVars } from "./theme";
import { splitBrandName } from "./brand";

describe("brand colors", () => {
  it("keeps the original look (black, blue, white) without overrides", () => {
    expect(themeCss({ primary: "#0047ef", background: "#080808", text: "#ffffff" })).toBe("");
  });

  it("starts every new company with the blue highlight", () => {
    expect(DEFAULT_BRAND.primary).toBe("#0047ef");
  });

  it("applies the owner's chosen highlight color across the site", () => {
    const vars = themeVars({ primary: "#e23b3b", background: "#080808", text: "#ffffff" });
    expect(vars["--primary"]).toBe("#e23b3b");
    expect(vars["--ring"]).toBe("#e23b3b");
    expect(themeCss({ primary: "#e23b3b", background: "#080808", text: "#ffffff" })).toContain("--primary:#e23b3b");
  });

  it("puts dark text on light buttons and white text on dark buttons", () => {
    expect(readableOn("#aff608")).toBe("#080808");
    expect(readableOn("#1e3a8a")).toBe("#ffffff");
  });

  it("ignores invalid colors so nothing unsafe reaches the page", () => {
    expect(themeVars({ primary: "red;}body{display:none", background: "#080808", text: "#ffffff" })["--primary"]).toBe("#0047ef");
  });
});

describe("brand name", () => {
  it("highlights the last word of the name", () => {
    expect(splitBrandName("Studio Cleison Cortes")).toEqual(["Studio Cleison", "Cortes"]);
    expect(splitBrandName("Cleison")).toEqual(["", "Cleison"]);
  });
});
