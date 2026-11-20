import { startsAt, type Slot } from "./schedule";

/** Send the reminder once a session is less than this far away. */
export const REMINDER_WINDOW_HOURS = 24;

type Candidate = { date: string; slot: Slot; status: string; reminder_sent_at: string | null };

/**
 * Confirmed sessions starting within the next REMINDER_WINDOW_HOURS that have
 * not been reminded yet. With the cron running once a day at 12:00 (Buenos
 * Aires), every session gets its reminder the day before, about 21–22 h ahead.
 */
export function dueForReminder<T extends Candidate>(bookings: T[], now: Date): T[] {
  const until = now.getTime() + REMINDER_WINDOW_HOURS * 3_600_000;
  return bookings.filter((b) => {
    if (b.status !== "confirmed" || b.reminder_sent_at) return false;
    const start = startsAt(b.date, b.slot).getTime();
    return start > now.getTime() && start <= until;
  });
}
