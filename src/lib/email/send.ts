import "server-only";

import { Resend } from "resend";
import { env, type PaymentInfo } from "@/lib/env";
import { formatDate, formatSlot, type Slot } from "@/lib/booking/schedule";

/*
 * Transactional emails (Resend). Plain, brand-consistent HTML: dark text on
 * white, the accent green for the one key line. Every value coming from a
 * visitor is escaped.
 */

type Recipient = { name: string; email: string; date: string; slot: Slot };

const ACCENT = "#1fae84"; // accent green, darkened for contrast on white

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f4f2;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#0a0b0a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e2">
    <tr><td style="padding:28px 32px 8px;font-size:15px;font-weight:600">⊹ César Vidal Scasso</td></tr>
    <tr><td style="padding:8px 32px 0"><h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:600">${title}</h1></td></tr>
    <tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.6;color:#2b2d2a">${body}</td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b6e68">Consultoría estratégica en tecnología, inteligencia artificial e innovación.</p>
  </td></tr></table></body></html>`;
}

const sessionLine = (r: Recipient) =>
  `<p style="margin:16px 0;padding:14px 16px;border-left:3px solid ${ACCENT};background:#f6faf8">
    <strong>${esc(formatDate(r.date))}</strong><br/>${formatSlot(r.slot)} (hora de Buenos Aires) · 60 minutos · virtual
  </p>`;

const meetingLine = (url: string | null | undefined) =>
  url
    ? `<p style="margin:16px 0">Link de la reunión: <a href="${esc(url)}" style="color:${ACCENT}">${esc(url)}</a></p>`
    : `<p style="margin:16px 0">Te vamos a enviar el link de la reunión antes del encuentro.</p>`;

async function send(to: string, subject: string, html: string) {
  const resend = new Resend(env.resendApiKey());
  const { error } = await resend.emails.send({
    from: env.emailFrom(),
    to,
    subject,
    html,
    replyTo: env.emailReplyTo(),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** Right after booking: details + transfer instructions. */
export async function sendBookingReceived(r: Recipient, payment: PaymentInfo) {
  const amount = payment.priceArs
    ? `USD ${esc(payment.priceUsd)} (ARS ${esc(payment.priceArs)})`
    : `USD ${esc(payment.priceUsd)}. El equivalente en pesos te lo confirmamos por este medio.`;
  const html = layout(
    "Recibimos tu reserva",
    `<p style="margin:0">Hola ${esc(r.name)}, gracias por reservar tu consultoría.</p>
     ${sessionLine(r)}
     <p style="margin:16px 0 8px"><strong>Para confirmar el turno, realizá la transferencia:</strong></p>
     <p style="margin:0">Monto: ${amount}<br/>CVU: <strong>${esc(payment.cvu)}</strong>${
       payment.alias ? `<br/>Alias: <strong>${esc(payment.alias)}</strong>` : ""
     }<br/>Titular: ${esc(payment.holder)}</p>
     <p style="margin:16px 0 0">La reserva queda pendiente hasta que verifiquemos la acreditación. Si no se acredita dentro de las próximas 24 horas, el turno se libera.</p>`
  );
  await send(r.email, "Recibimos tu reserva — instrucciones de pago", html);
}

/** After the payment is verified. */
export async function sendBookingConfirmed(r: Recipient, meetingUrl: string | null) {
  const html = layout(
    "Tu consultoría está confirmada",
    `<p style="margin:0">Hola ${esc(r.name)}, verificamos tu pago. Tu turno quedó confirmado.</p>
     ${sessionLine(r)}
     ${meetingLine(meetingUrl)}
     <p style="margin:16px 0 0">Si necesitás reprogramar, respondé este email.</p>`
  );
  await send(r.email, "Tu consultoría está confirmada", html);
}

/** About 24 hours before the session. */
export async function sendReminder(r: Recipient, meetingUrl: string | null) {
  const html = layout(
    "Mañana es tu consultoría",
    `<p style="margin:0">Hola ${esc(r.name)}, te recordamos tu sesión.</p>
     ${sessionLine(r)}
     ${meetingLine(meetingUrl)}`
  );
  await send(r.email, "Recordatorio: tu consultoría es mañana", html);
}
