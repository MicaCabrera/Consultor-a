"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { sendBookingConfirmed } from "@/lib/email/send";
import type { Booking } from "@/lib/booking/types";

/*
 * Admin actions. Each one checks the admin role first and then uses the
 * visitor's own session, so RLS has the final word in the database.
 */

export type ActionState = { ok: boolean; message: string } | null;

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function confirmBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const meetingUrl = String(formData.get("meeting_url") ?? "").trim();
  if (!UUID.test(id)) return { ok: false, message: "Reserva inválida." };
  if (meetingUrl && !/^https?:\/\/\S+$/i.test(meetingUrl)) {
    return { ok: false, message: "El link de la reunión debe empezar con https://" };
  }

  // Only a pending booking can be confirmed (a cancelled one may have lost its
  // slot to someone else in the meantime).
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString(), meeting_url: meetingUrl || null })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle<Booking>();

  if (error) {
    console.error("confirmBooking", error);
    return { ok: false, message: "No se pudo confirmar. Probá de nuevo." };
  }
  if (!data) return { ok: false, message: "Esta reserva ya no está pendiente." };

  revalidatePath("/admin");
  try {
    await sendBookingConfirmed(data, data.meeting_url);
    return { ok: true, message: `Confirmada. Enviamos el email a ${data.email}.` };
  } catch (e) {
    console.error("sendBookingConfirmed", e);
    return {
      ok: true,
      message: `Confirmada, pero el email a ${data.email} no se pudo enviar. Avisale por otro medio.`,
    };
  }
}

export async function cancelBooking(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "confirmed"]);
  if (error) console.error("cancelBooking", error);
  revalidatePath("/admin");
}

export async function addBlockedDay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200);
  if (!DATE.test(date)) return { ok: false, message: "Elegí una fecha." };

  const { error } = await supabase
    .from("blocked_days")
    .upsert({ date, reason: reason || null }, { onConflict: "date" });
  if (error) {
    console.error("addBlockedDay", error);
    return { ok: false, message: "No se pudo bloquear el día." };
  }
  revalidatePath("/admin");
  return { ok: true, message: "Día bloqueado." };
}

export async function removeBlockedDay(formData: FormData) {
  const { supabase } = await requireAdmin();
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date)) return;
  const { error } = await supabase.from("blocked_days").delete().eq("date", date);
  if (error) console.error("removeBlockedDay", error);
  revalidatePath("/admin");
}
