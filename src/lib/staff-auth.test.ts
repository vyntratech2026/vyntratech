import { describe, expect, it } from "vitest";
import { isRealEmail, loginEmail } from "./staff-auth";

describe("staff login identifier", () => {
  it("uses the typed e-mail, lowercased", () => {
    expect(loginEmail("  Cleison@Gmail.com ")).toBe("cleison@gmail.com");
  });

  it("still lets old phone-based accounts sign in with the number", () => {
    expect(loginEmail("(79) 99689-1622")).toBe("79996891622@equipe.studiocleison.local");
  });
});

describe("password recovery needs a real e-mail", () => {
  it("rejects the internal phone address", () => {
    expect(isRealEmail("79996891622@equipe.studiocleison.local")).toBe(false);
  });

  it("accepts a gmail address", () => {
    expect(isRealEmail("cleison@gmail.com")).toBe(true);
  });
});
