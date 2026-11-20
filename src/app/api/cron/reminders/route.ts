import { NextResponse, connection, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serviceClient } from "@/lib/supabase/clients";
import { env } from "@/lib/env";
import { sendReminder } from "@/lib/email/send";
import { PENDING_TTL_HOURS, addDays, todayISO } from "@/lib/booking/schedule";
import { dueForReminder } from "@/lib/booking/reminders";
import type { Booking } from "@/lib/booking/types";
import { bookingEnabled } from "@/lib/booking/feature";

const REQUIRED_ENV = [
  "CRON_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

/*
 * The one scheduled job (vercel.json). Each run:
 *   1. cancels pending bookings whose 24 h payment window has passed;
 *   2. sends the reminder for confirmed sessions starting within 24 h.
 * Each reminder is claimed in the database (reminder_sent_at) before sending,
 * so overlapping or repeated runs never send it twice.
 */

function authorized(request: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  const expected = Buffer.from(`Bearer ${env.cronSecret()}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: NextRequest) {
  // Always run at request time: with Cache Components a GET handler would
  // otherwise be prerendered at build and never touch the database.
  await connection();

  // Booking system switched off, or not configured yet: exit quietly with 200
  // so the scheduled run neither errors nor touches anything.
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (!bookingEnabled() || missing.length > 0) {
    return NextResponse.json({ skipped: true });
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const now = new Date();

  // 1. Expire unpaid bookings.
  const cutoff = new Date(now.getTime() - PENDING_TTL_HOURS * 3_600_000).toISOString();
  const { data: expired, error: expireError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: now.toISOString() })
    .eq("status", "pending")
    .lte("created_at", cutoff)
    .select("id");
  if (expireError) console.error("cron expire", expireError);

  // 2. Reminders.
  const today = todayISO(now);
  const { data: candidates, error: listError } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("date", today)
    .lte("date", addDays(today, 2))
    .returns<Booking[]>();
  if (listError) {
    console.error("cron list", listError);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }

  const results = { expired: expired?.length ?? 0, reminded: 0, failed: 0 };

  for (const booking of dueForReminder(candidates ?? [], now)) {
    // Claim it first: only the run that flips reminder_sent_at sends the email.
    const { data: claimed } = await supabase
      .from("bookings")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", booking.id)
      .is("reminder_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      await sendReminder(booking, booking.meeting_url);
      results.reminded++;
    } catch (e) {
      console.error("cron reminder", booking.id, e);
      results.failed++;
      // Release the claim so the next run retries it.
      await supabase.from("bookings").update({ reminder_sent_at: null }).eq("id", booking.id);
    }
  }

  return NextResponse.json(results);
}
