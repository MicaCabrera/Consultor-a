/**
 * Booking schedule rules. Shared by client and server.
 *
 * Sessions run Monday to Friday at two fixed times, Buenos Aires time.
 * There is no table of available slots: availability is derived from this rule
 * and compared with what is already booked (see `get_taken_slots` in SQL).
 */

export const TIMEZONE = "America/Argentina/Buenos_Aires";
/** Argentina has had no daylight saving time since 2009: always UTC−3. */
const UTC_OFFSET = "-03:00";

export const SLOTS = ["09:00", "10:30"] as const;
export type Slot = (typeof SLOTS)[number];

/** How far ahead the calendar shows (the database accepts up to 35 days). */
export const CALENDAR_DAYS = 28;
/** A pending booking stops holding its slot after this long (matches SQL). */
export const PENDING_TTL_HOURS = 24;

export const isSlot = (value: string): value is Slot => (SLOTS as readonly string[]).includes(value);

/** Today's date in Buenos Aires, as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Date arithmetic on YYYY-MM-DD strings, free of local timezone effects. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export const isWeekday = (iso: string) => isoWeekday(iso) <= 5;

/** Weekdays from tomorrow up to CALENDAR_DAYS ahead. */
export function bookableDates(now = new Date()): string[] {
  const today = todayISO(now);
  const dates: string[] = [];
  for (let i = 1; i <= CALENDAR_DAYS; i++) {
    const date = addDays(today, i);
    if (isWeekday(date)) dates.push(date);
  }
  return dates;
}

/** The exact moment a session starts. */
export function startsAt(date: string, slot: Slot): Date {
  return new Date(`${date}T${slot}:00${UTC_OFFSET}`);
}

/** "lunes 24 de noviembre" */
export function formatDate(iso: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: opts.weekday === false ? undefined : "long",
    day: "numeric",
    month: "long",
    year: opts.year ? "numeric" : undefined,
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Current time. Request-time only: call it after reading request data. */
export const nowMs = () => Date.now();

export const formatSlot = (slot: Slot) => `${slot} h`;
