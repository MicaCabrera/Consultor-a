"use server";

import { publicClient } from "@/lib/supabase/clients";
import { env, type PaymentInfo } from "@/lib/env";
import { sendBookingReceived } from "@/lib/email/send";
import { addDays, bookableDates, todayISO, type Slot } from "@/lib/booking/schedule";
import { validateBooking, type FieldErrors } from "@/lib/booking/validation";
import { bookingEnabled } from "@/lib/booking/feature";

export type TakenSlot = { date: string; slot: Slot };

/** Taken slots (booked or blocked) between two dates. No personal data. */
export async function getTakenSlots(from: string, to: string): Promise<TakenSlot[]> {
  if (!bookingEnabled()) return [];
  const today = todayISO();
  // Only ever look at the bookable window.
  const start = from > today ? from : addDays(today, 1);
  const end = to < addDays(today, 35) ? to : addDays(today, 35);
  if (end < start) return [];

  const { data, error } = await publicClient().rpc("get_taken_slots", { p_from: start, p_to: end });
  if (error) {
    console.error("get_taken_slots", error);
    throw new Error("No pudimos consultar la disponibilidad.");
  }
  return (data ?? []) as TakenSlot[];
}

export type CreateBookingResult =
  | {
      ok: true;
      booking: { date: string; slot: Slot; name: string; email: string };
      payment: PaymentInfo;
      emailSent: boolean;
    }
  | {
      ok: false;
      code: "invalid" | "slot_taken" | "day_unavailable" | "too_many_pending" | "error";
      message: string;
      fieldErrors?: FieldErrors;
    };

export async function createBooking(input: Record<string, unknown>): Promise<CreateBookingResult> {
  if (!bookingEnabled()) {
    return { ok: false, code: "error", message: "Las reservas online no están disponibles por ahora." };
  }
  const parsed = validateBooking(input);
  if (!parsed.ok) {
    return { ok: false, code: "invalid", message: "Revisá los datos marcados.", fieldErrors: parsed.errors };
  }
  const b = parsed.data;
  if (!bookableDates().includes(b.date)) {
    return { ok: false, code: "day_unavailable", message: "Ese día ya no está disponible. Elegí otro." };
  }

  const { error } = await publicClient().rpc("create_booking", {
    p_date: b.date,
    p_slot: b.slot,
    p_name: b.name,
    p_email: b.email,
    p_occupation: b.occupation,
    p_topic: b.topic,
  });

  if (error) {
    // The unique index rejected it: someone took this slot a moment earlier.
    if (error.code === "23505") {
      return {
        ok: false,
        code: "slot_taken",
        message: "Alguien acaba de reservar ese horario. Elegí otro turno, por favor.",
      };
    }
    if (/day_blocked|out_of_window|not_a_weekday|invalid_slot/.test(error.message)) {
      return { ok: false, code: "day_unavailable", message: "Ese turno ya no está disponible. Elegí otro." };
    }
    if (/too_many_pending/.test(error.message)) {
      return {
        ok: false,
        code: "too_many_pending",
        message: "Ya tenés reservas pendientes de pago con este email. Completá esas transferencias o escribinos.",
      };
    }
    console.error("create_booking", error);
    return { ok: false, code: "error", message: "No pudimos registrar la reserva. Intentá de nuevo en unos minutos." };
  }

  const payment = env.payment();
  // The booking is saved; a failed email must not undo it. The screen shows
  // the same instructions either way.
  let emailSent = true;
  try {
    await sendBookingReceived(b, payment);
  } catch (e) {
    emailSent = false;
    console.error("sendBookingReceived", e);
  }

  return {
    ok: true,
    booking: { date: b.date, slot: b.slot, name: b.name, email: b.email },
    payment,
    emailSent,
  };
}
