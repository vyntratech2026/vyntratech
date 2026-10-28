import { normalizePhone } from "./format";

/**
 * Staff (admin + barbers) sign in with mobile number + password.
 * Auth requires an email, so each phone maps to a deterministic internal address
 * that never receives mail.
 */
export const STAFF_EMAIL_DOMAIN = "equipe.studiocleison.local";

export function staffEmailFromPhone(phone: string): string {
  return `${normalizePhone(phone)}@${STAFF_EMAIL_DOMAIN}`;
}

export function isValidStaffPassword(pw: string): boolean {
  return pw.length >= 8;
}
