import { describe, expect, it } from "vitest";
import { appointmentReminderTimes } from "./whatsapp-reminders";

describe("requested WhatsApp reminder instants", () => {
  const times = appointmentReminderTimes("2026-11-12T17:00:00Z"); // 14:00 Maceió

  it("plans the first reminder at 00:00 on the appointment day in America/Maceio", () => {
    expect(times.find((r) => r.kind === "day_start")?.dueAt).toBe("2026-11-12T03:00:00.000Z");
  });

  it("plans the second reminder exactly 2 hours before the appointment", () => {
    expect(times.find((r) => r.kind === "two_hours")?.dueAt).toBe("2026-11-12T15:00:00.000Z");
  });

  it("plans the final reminder exactly 1 hour before the appointment", () => {
    expect(times.find((r) => r.kind === "one_hour")?.dueAt).toBe("2026-11-12T16:00:00.000Z");
  });

  it("uses the local appointment date when the UTC date is the following day", () => {
    expect(appointmentReminderTimes("2026-11-13T02:00:00Z")[0]?.dueAt).toBe("2026-11-12T03:00:00.000Z");
  });
});