/**
 * Master switch for the whole booking system (/reservar, /admin, the cron
 * job and their server actions). Off unless BOOKING_ENABLED is exactly "true",
 * so a deploy without the variable keeps everything hidden.
 *
 * Kept free of "server-only" so the proxy can import it too. It reads a plain
 * server env var (no NEXT_PUBLIC_ prefix), so it is never sent to the browser.
 */
export function bookingEnabled(): boolean {
  return process.env.BOOKING_ENABLED === "true";
}
