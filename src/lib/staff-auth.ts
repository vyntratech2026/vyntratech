import { isValidPhone, normalizePhone } from "./format";

/**
 * Staff (admin + barbers) sign in with a real e-mail + password (or Google with the same e-mail).
 * Older accounts were created with a mobile number mapped to an internal address that never
 * receives mail; those keep working by typing the number until the person sets a real e-mail.
 */
export const STAFF_EMAIL_DOMAIN = "equipe.studiocleison.local";

export function staffEmailFromPhone(phone: string): string {
  return `${normalizePhone(phone)}@${STAFF_EMAIL_DOMAIN}`;
}

export function isRealEmail(value: string): boolean {
  const v = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !v.endsWith(`@${STAFF_EMAIL_DOMAIN}`);
}

/** Turns what the person typed in the login box into the address used to sign in. */
export function loginEmail(input: string): string {
  const v = input.trim();
  if (v.includes("@")) return v.toLowerCase();
  if (isValidPhone(v)) return staffEmailFromPhone(v);
  return v.toLowerCase();
}

export function isValidStaffPassword(pw: string): boolean {
  return pw.length >= 8;
}
