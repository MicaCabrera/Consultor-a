import "server-only";

/**
 * Server-side configuration. None of these use the NEXT_PUBLIC_ prefix: the
 * browser never talks to Supabase or Resend directly, so no key ever reaches it.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  /** Public (anon / publishable) key: RLS applies. */
  supabaseAnonKey: () => required("SUPABASE_ANON_KEY"),
  /** Bypasses RLS. Only for the cron job. */
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  resendApiKey: () => required("RESEND_API_KEY"),
  /** e.g. "César Vidal Scasso <reservas@tudominio.com>" (verified in Resend). */
  emailFrom: () => required("EMAIL_FROM"),
  emailReplyTo: () => process.env.EMAIL_REPLY_TO || undefined,

  cronSecret: () => required("CRON_SECRET"),

  /** Default video call link offered when confirming a booking. */
  meetingUrl: () => process.env.MEETING_URL || "",

  payment: () => ({
    cvu: required("PAYMENT_CVU"),
    alias: process.env.PAYMENT_ALIAS || "",
    holder: required("PAYMENT_HOLDER"),
    priceUsd: process.env.PRICE_USD || "120",
    /** Optional fixed amount in pesos; if empty, the email says it will be informed. */
    priceArs: process.env.PRICE_ARS || "",
  }),
};

export type PaymentInfo = ReturnType<typeof env.payment>;
