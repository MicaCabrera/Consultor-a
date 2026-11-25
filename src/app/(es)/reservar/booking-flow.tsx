"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import {
  SLOTS,
  bookableDates,
  formatDate,
  formatSlot,
  isoWeekday,
  type Slot,
} from "@/lib/booking/schedule";
import { LIMITS, validateBooking, type FieldErrors } from "@/lib/booking/validation";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-reduced-motion";
import { createBooking, getTakenSlots, type CreateBookingResult } from "./actions";

type Success = Extract<CreateBookingResult, { ok: true }>;

const EASE = [0.16, 1, 0.3, 1] as const;
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

const key = (date: string, slot: string) => `${date}|${slot}`;

function StepTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 text-2xl font-medium tracking-tight md:text-3xl">
      <span className="text-sm tabular-nums text-accent">{n}</span>
      {children}
    </h2>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1.5 block text-sm text-[#c2410c]">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full border border-current/20 bg-transparent px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-accent";

/** Calendar: weekdays only, one row per week. */
function Calendar({
  dates,
  fullDays,
  selected,
  loading,
  onSelect,
}: {
  dates: string[];
  fullDays: Set<string>;
  selected: string | null;
  loading: boolean;
  onSelect: (date: string) => void;
}) {
  // Pad the first week so each date sits under its weekday.
  const cells: (string | null)[] = [...Array(isoWeekday(dates[0]) - 1).fill(null), ...dates];
  return (
    <div>
      <div className="grid grid-cols-5 gap-2 pb-2 text-center text-xs uppercase tracking-wider text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {cells.map((date, i) => {
          if (!date) return <span key={`pad-${i}`} />;
          const [, m, d] = date.split("-").map(Number);
          const full = fullDays.has(date);
          const isSelected = selected === date;
          const showMonth = d === 1 || date === dates[0];
          return (
            <button
              key={date}
              type="button"
              data-cursor="link"
              disabled={full || loading}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${formatDate(date)}${full ? ", sin turnos" : ""}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center border text-sm transition-colors md:aspect-[4/3]",
                isSelected
                  ? "border-fg-light bg-fg-light text-bg-light"
                  : full
                    ? "cursor-not-allowed border-current/5 text-current/25 line-through"
                    : "border-current/15 hover:border-accent",
                loading && !isSelected && "animate-pulse"
              )}
            >
              <span className="text-base font-medium tabular-nums md:text-lg">{d}</span>
              {showMonth ? (
                <span className="text-[10px] uppercase tracking-wider opacity-60">
                  {new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" })
                    .format(new Date(Date.UTC(2000, m - 1, 1)))
                    .replace(".", "")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-current/10 py-3 last:border-b-0">
      <div className="min-w-0">
        <span className="block text-xs uppercase tracking-wider text-muted">{label}</span>
        <span className="block break-all font-medium tabular-nums">{value}</span>
      </div>
      <button
        type="button"
        data-cursor="link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // Clipboard unavailable: the value stays visible to copy by hand.
          }
        }}
        className="flex shrink-0 items-center gap-1.5 border border-current/15 px-3 py-2 text-xs"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function PaymentInstructions({ result }: { result: Success }) {
  const { booking, payment } = result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mx-auto max-w-2xl"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-accent">Reserva registrada</p>
      <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
        Falta un paso: la transferencia.
      </h1>
      <p className="mt-6 text-lg text-muted">
        Reservaste el <strong className="font-medium text-fg-light">{formatDate(booking.date)}</strong> a
        las <strong className="font-medium text-fg-light">{formatSlot(booking.slot)}</strong> (hora de
        Buenos Aires). El turno queda pendiente hasta que verifiquemos la acreditación.
      </p>

      <div className="mt-10 border border-current/15 p-6 md:p-8">
        <p className="text-sm text-muted">Monto</p>
        <p className="mt-1 text-3xl font-medium tracking-tight">USD {payment.priceUsd}</p>
        <p className="mt-1 text-sm text-muted">
          {payment.priceArs
            ? `ARS ${payment.priceArs}`
            : "El equivalente en pesos te lo confirmamos por email."}
        </p>
        <div className="mt-6">
          <CopyValue label="CVU" value={payment.cvu} />
          {payment.alias ? <CopyValue label="Alias" value={payment.alias} /> : null}
          <div className="py-3">
            <span className="block text-xs uppercase tracking-wider text-muted">Titular</span>
            <span className="block font-medium">{payment.holder}</span>
          </div>
        </div>
      </div>

      <ul className="mt-8 space-y-3 text-muted">
        <li>
          {result.emailSent
            ? `Te enviamos estas instrucciones a ${booking.email}.`
            : "No pudimos enviarte el email con estas instrucciones: guardalas desde esta pantalla."}
        </li>
        <li>Si la transferencia no se acredita dentro de las próximas 24 horas, el turno se libera.</li>
        <li>Cuando verifiquemos el pago, vas a recibir la confirmación y el link de la reunión.</li>
      </ul>

      <Link href="/" data-cursor="link" className="mt-10 inline-block text-sm underline underline-offset-4">
        Volver al inicio
      </Link>
    </motion.div>
  );
}

export function BookingFlow() {
  // Dates depend on "today": compute them in the browser only, never in the
  // prerendered shell (it would freeze the build day and mismatch on hydration).
  const isClient = useIsClient();
  const dates = useMemo(() => (isClient ? bookableDates() : []), [isClient]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", occupation: "", topic: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<Success | null>(null);
  const [submitting, startSubmit] = useTransition();

  const slotRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Replace what we know about [from, to] with fresh data, keep the rest.
  const merge = useCallback((from: string, to: string, rows: { date: string; slot: string }[]) => {
    setTaken((prev) => {
      const next = new Set([...prev].filter((k) => {
        const d = k.split("|")[0];
        return d < from || d > to;
      }));
      rows.forEach((r) => next.add(key(r.date, r.slot)));
      return next;
    });
  }, []);

  const load = useCallback(
    async (from: string, to: string) => merge(from, to, await getTakenSlots(from, to)),
    [merge]
  );

  // Whole window once, to grey out full days.
  useEffect(() => {
    if (!dates.length) return;
    let alive = true;
    const from = dates[0];
    const to = dates[dates.length - 1];
    getTakenSlots(from, to)
      .then((rows) => {
        if (!alive) return;
        merge(from, to, rows);
        setLoadError(null);
      })
      .catch(() => alive && setLoadError("No pudimos cargar la disponibilidad. Recargá la página."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dates, merge]);

  const fullDays = useMemo(
    () => new Set(dates.filter((d) => SLOTS.every((s) => taken.has(key(d, s))))),
    [dates, taken]
  );

  const chooseDate = (d: string) => {
    setDate(d);
    setSlot(null);
    setNotice(null);
    // Re-check that day right away: it may have changed since the page loaded.
    load(d, d).catch(() => {});
    requestAnimationFrame(() => slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const chooseSlot = (s: Slot) => {
    setSlot(s);
    setNotice(null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = { ...form, date: date ?? "", slot: slot ?? "" };
    const check = validateBooking(input);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setNotice(null);
    startSubmit(async () => {
      const res = await createBooking(input);
      if (res.ok) {
        setResult(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setNotice(res.message);
      if (res.fieldErrors) setErrors(res.fieldErrors);
      if (res.code === "slot_taken" || res.code === "day_unavailable") {
        // Show the latest availability and send them back to pick a time.
        if (date) await load(date, date).catch(() => {});
        setSlot(null);
        requestAnimationFrame(() => slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      }
    });
  };

  if (result) return <PaymentInstructions result={result} />;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="text-[clamp(2.25rem,9vw,3rem)] font-medium leading-[1.02] tracking-tight md:text-6xl">
          Reservá tu consultoría
        </h1>
        <ul className="mt-8 space-y-2 text-muted">
          <li>Consultoría individual de 60 minutos, virtual.</li>
          <li>Lunes a viernes · 09:00 y 10:30 (hora de Buenos Aires).</li>
          <li>Inversión: USD 120. Pago por transferencia.</li>
        </ul>
        {date && slot ? (
          <p className="mt-8 border-l-2 border-accent pl-4">
            <span className="block text-sm text-muted">Tu turno</span>
            <span className="font-medium first-letter:uppercase">{formatDate(date)}</span> ·{" "}
            {formatSlot(slot)}
          </p>
        ) : null}
      </div>

      <div className="space-y-16">
        <section>
          <StepTitle n="01">Elegí el día</StepTitle>
          <div className="mt-6">
            {loadError ? (
              <p className="text-[#c2410c]">{loadError}</p>
            ) : !dates.length ? (
              <div className="h-72 animate-pulse bg-current/5" aria-label="Cargando calendario" />
            ) : (
              <Calendar
                dates={dates}
                fullDays={fullDays}
                selected={date}
                loading={loading}
                onSelect={chooseDate}
              />
            )}
          </div>
        </section>

        <AnimatePresence initial={false}>
          {date ? (
            <motion.section
              key="slot"
              ref={slotRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <StepTitle n="02">Elegí el horario</StepTitle>
              <p className="mt-2 text-muted first-letter:uppercase">{formatDate(date)}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {SLOTS.map((s) => {
                  const isTaken = taken.has(key(date, s));
                  const isSelected = slot === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      data-cursor="link"
                      disabled={isTaken}
                      onClick={() => chooseSlot(s)}
                      aria-pressed={isSelected}
                      className={cn(
                        "border px-4 py-5 text-left transition-colors",
                        isSelected
                          ? "border-fg-light bg-fg-light text-bg-light"
                          : isTaken
                            ? "cursor-not-allowed border-current/5 text-current/30"
                            : "border-current/15 hover:border-accent"
                      )}
                    >
                      <span className="block text-2xl font-medium tabular-nums">{s}</span>
                      <span className="mt-1 block text-sm opacity-70">{isTaken ? "Ocupado" : "60 minutos"}</span>
                    </button>
                  );
                })}
              </div>
              {notice && !slot ? <p className="mt-4 text-[#c2410c]">{notice}</p> : null}
            </motion.section>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {date && slot ? (
            <motion.section
              key="form"
              ref={formRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="scroll-mt-28"
            >
              <StepTitle n="03">Tus datos</StepTitle>
              <form onSubmit={submit} noValidate className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Nombre y apellido" error={errors.name}>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={set("name")}
                      autoComplete="name"
                      maxLength={LIMITS.name.max}
                      required
                    />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input
                      className={inputClass}
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                  </Field>
                </div>
                <Field label="¿A qué te dedicás?" error={errors.occupation}>
                  <input
                    className={inputClass}
                    value={form.occupation}
                    onChange={set("occupation")}
                    placeholder="Empresa, rol o actividad"
                    maxLength={LIMITS.occupation.max}
                    required
                  />
                </Field>
                <Field label="¿Qué querés trabajar en la sesión?" error={errors.topic}>
                  <textarea
                    className={cn(inputClass, "min-h-36 resize-y")}
                    value={form.topic}
                    onChange={set("topic")}
                    placeholder="Contanos brevemente el desafío, la idea o la pregunta que querés explorar."
                    maxLength={LIMITS.topic.max}
                    required
                  />
                </Field>

                {notice ? <p className="text-[#c2410c]">{notice}</p> : null}

                <button
                  type="submit"
                  data-cursor="link"
                  disabled={submitting}
                  className="btn inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-tight disabled:opacity-60"
                >
                  {submitting ? "Reservando…" : "Confirmar reserva"}
                </button>
                <p className="text-sm text-muted">
                  Al confirmar vas a ver las instrucciones de pago. El turno queda reservado por 24 horas
                  mientras se acredita la transferencia.
                </p>
              </form>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
