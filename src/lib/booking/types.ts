import type { Slot } from "./schedule";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  date: string;
  slot: Slot;
  status: BookingStatus;
  name: string;
  email: string;
  occupation: string;
  topic: string;
  meeting_url: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  reminder_sent_at: string | null;
};

export type BlockedDay = { date: string; reason: string | null };
