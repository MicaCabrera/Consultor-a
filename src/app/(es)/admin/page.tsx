import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import {
  PENDING_TTL_HOURS,
  addDays,
  formatDate,
  formatSlot,
  nowMs,
  startsAt,
  todayISO,
} from "@/lib/booking/schedule";
import type { BlockedDay, Booking } from "@/lib/booking/types";
import { signOut } from "./login/actions";
import { removeBlockedDay } from "./actions";
import { BlockDayForm, CancelForm, ConfirmForm } from "./forms";

const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function Badge({ tone, children }: { tone: "pending" | "ok" | "muted" | "warn"; children: React.ReactNode }) {
  const tones = {
    pending: "border-[#b45309]/40 text-[#b45309]",
    ok: "border-[#15803d]/40 text-[#15803d]",
    warn: "border-[#c2410c]/40 text-[#c2410c]",
    muted: "border-current/20 text-muted",
  };
  return <span className={`inline-block border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

function Client({ b }: { b: Booking }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-base font-medium">{b.name}</p>
      <p>
        <a href={`mailto:${b.email}`} className="underline underline-offset-2">
          {b.email}
        </a>
      </p>
      <p className="text-muted">{b.occupation}</p>
      <details className="pt-1">
        <summary className="cursor-pointer text-muted">Qué quiere trabajar</summary>
        <p className="mt-2 whitespace-pre-line">{b.topic}</p>
      </details>
    </div>
  );
}

function When({ b }: { b: Booking }) {
  return (
    <p className="text-lg font-medium first-letter:uppercase">
      {formatDate(b.date)} · {formatSlot(b.slot)}
    </p>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="flex items-baseline gap-3 text-2xl font-medium tracking-tight">
        {title}
        {typeof count === "number" ? <span className="text-sm text-muted">{count}</span> : null}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="border border-dashed border-current/15 p-6 text-sm text-muted">{children}</p>
);

async function Dashboard() {
  const { supabase, user } = await requireAdmin();
  const today = todayISO();
  // Rendered per request, after the session read above.
  const now = nowMs();

  const [{ data: bookings, error }, { data: blocked }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .gte("date", addDays(today, -30))
      .order("date", { ascending: true })
      .order("slot", { ascending: true })
      .returns<Booking[]>(),
    supabase
      .from("blocked_days")
      .select("date, reason")
      .gte("date", today)
      .order("date", { ascending: true })
      .returns<BlockedDay[]>(),
  ]);

  if (error) {
    return <p className="mt-10 text-[#c2410c]">No se pudieron cargar las reservas: {error.message}</p>;
  }

  const all = bookings ?? [];
  const expiresAt = (b: Booking) => new Date(b.created_at).getTime() + PENDING_TTL_HOURS * 3_600_000;
  const upcoming = (b: Booking) => startsAt(b.date, b.slot).getTime() > now;

  const pending = all.filter((b) => b.status === "pending" && upcoming(b));
  const confirmed = all.filter((b) => b.status === "confirmed" && upcoming(b));
  const history = all
    .filter((b) => !pending.includes(b) && !confirmed.includes(b))
    .reverse()
    .slice(0, 20);
  const meetingDefault = env.meetingUrl();
  const bookedDates = new Set(all.filter((b) => b.status !== "cancelled").map((b) => b.date));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <span>{user.email}</span>
        <form action={signOut}>
          <button type="submit" data-cursor="link" className="underline underline-offset-4">
            Cerrar sesión
          </button>
        </form>
      </div>

      <Section title="Pendientes de pago" count={pending.length}>
        {pending.length ? (
          <ul className="divide-y divide-current/10 border-y border-current/10">
            {pending.map((b) => {
              const expired = expiresAt(b) <= now;
              return (
                <li key={b.id} className="grid gap-6 py-6 lg:grid-cols-[1fr_1fr_1.2fr]">
                  <div className="space-y-2">
                    <When b={b} />
                    {expired ? (
                      <Badge tone="warn">Vencida: el turno ya no está retenido</Badge>
                    ) : (
                      <Badge tone="pending">Vence {timeFmt.format(new Date(expiresAt(b)))}</Badge>
                    )}
                    <p className="text-xs text-muted">Reservó {timeFmt.format(new Date(b.created_at))}</p>
                  </div>
                  <Client b={b} />
                  <div className="space-y-3">
                    <ConfirmForm id={b.id} defaultMeetingUrl={meetingDefault} />
                    <CancelForm id={b.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No hay reservas esperando la verificación del pago.</Empty>
        )}
      </Section>

      <Section title="Próximas confirmadas" count={confirmed.length}>
        {confirmed.length ? (
          <ul className="divide-y divide-current/10 border-y border-current/10">
            {confirmed.map((b) => (
              <li key={b.id} className="grid gap-6 py-6 lg:grid-cols-[1fr_1fr_1.2fr]">
                <div className="space-y-2">
                  <When b={b} />
                  <Badge tone="ok">Confirmada</Badge>
                  <p className="text-xs text-muted">
                    {b.reminder_sent_at
                      ? `Recordatorio enviado ${timeFmt.format(new Date(b.reminder_sent_at))}`
                      : "Recordatorio pendiente (24 h antes)"}
                  </p>
                </div>
                <Client b={b} />
                <div className="space-y-3 text-sm">
                  {b.meeting_url ? (
                    <p className="break-all">
                      <span className="text-muted">Reunión: </span>
                      <a href={b.meeting_url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                        {b.meeting_url}
                      </a>
                    </p>
                  ) : (
                    <p className="text-muted">Sin link de reunión cargado.</p>
                  )}
                  <CancelForm id={b.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Todavía no hay consultorías confirmadas.</Empty>
        )}
      </Section>

      <Section title="Días bloqueados">
        <BlockDayForm min={addDays(today, 1)} />
        {blocked?.length ? (
          <ul className="mt-6 divide-y divide-current/10 border-y border-current/10">
            {blocked.map((d) => (
              <li key={d.date} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium first-letter:uppercase">{formatDate(d.date, { year: true })}</p>
                  {d.reason ? <p className="text-sm text-muted">{d.reason}</p> : null}
                  {bookedDates.has(d.date) ? (
                    <p className="text-sm text-[#c2410c]">Hay reservas activas ese día: revisalas arriba.</p>
                  ) : null}
                </div>
                <form action={removeBlockedDay}>
                  <input type="hidden" name="date" value={d.date} />
                  <button type="submit" data-cursor="link" className="text-sm underline underline-offset-4">
                    Desbloquear
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No hay días bloqueados.</p>
        )}
      </Section>

      <Section title="Historial reciente">
        {history.length ? (
          <ul className="divide-y divide-current/10 border-y border-current/10 text-sm">
            {history.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="first-letter:uppercase">
                  {formatDate(b.date)} · {formatSlot(b.slot)} — {b.name}
                </span>
                <Badge tone={b.status === "confirmed" ? "ok" : "muted"}>
                  {b.status === "cancelled" ? "Cancelada" : b.status === "confirmed" ? "Realizada" : "Sin pago"}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Sin movimientos en los últimos 30 días.</p>
        )}
      </Section>
    </>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <p className="text-lg font-semibold tracking-tight">
        <span className="mr-[0.3em] text-accent">⊹</span>CVS
      </p>
      <h1 className="mt-8 text-4xl font-medium tracking-tight md:text-5xl">Reservas</h1>
      {/* Reads the session: request-time data, streamed behind a boundary. */}
      <Suspense fallback={<div className="mt-14 h-96 animate-pulse bg-current/5" />}>
        <div className="mt-6">
          <Dashboard />
        </div>
      </Suspense>
    </main>
  );
}
