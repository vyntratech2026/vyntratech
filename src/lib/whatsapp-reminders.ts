import { shopDayStartIso, toShopDateKey } from "./format";

export const WHATSAPP_REMINDER_TIMES = [
  { kind: "day_start", label: "00:00 no dia do agendamento" },
  { kind: "two_hours", label: "2 horas antes" },
  { kind: "one_hour", label: "1 hora antes" },
] as const;

export type ReminderKind = (typeof WHATSAPP_REMINDER_TIMES)[number]["kind"];

/** Planned instants only; this module does not send or imply delivery. */
export function appointmentReminderTimes(startAt: string): { kind: ReminderKind; dueAt: string }[] {
  const start = new Date(startAt).getTime();
  if (!Number.isFinite(start)) throw new Error("Data de agendamento inválida.");
  return [
    { kind: "day_start", dueAt: shopDayStartIso(toShopDateKey(startAt)) },
    { kind: "two_hours", dueAt: new Date(start - 2 * 60 * 60 * 1000).toISOString() },
    { kind: "one_hour", dueAt: new Date(start - 60 * 60 * 1000).toISOString() },
  ];
}