"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addBlockedDay, cancelBooking, confirmBooking, type ActionState } from "./actions";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full border border-current/20 bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent";

function Submit({ children, pendingLabel, className }: { children: React.ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-cursor="link"
      disabled={pending}
      className={cn("px-4 py-2.5 text-sm font-medium disabled:opacity-60", className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p className={cn("mt-2 text-sm", state.ok ? "text-[#15803d]" : "text-[#c2410c]")}>{state.message}</p>
  );
}

export function ConfirmForm({ id, defaultMeetingUrl }: { id: string; defaultMeetingUrl: string }) {
  const [state, action] = useActionState<ActionState, FormData>(confirmBooking, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="block text-sm">
        <span className="text-muted">Link de la reunión (va en el email de confirmación)</span>
        <input
          name="meeting_url"
          type="url"
          defaultValue={defaultMeetingUrl}
          placeholder="https://meet.google.com/…"
          className={cn(inputClass, "mt-1.5")}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Submit pendingLabel="Confirmando…" className="btn">
          Pago verificado · confirmar
        </Submit>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function CancelForm({ id, label = "Cancelar reserva" }: { id: string; label?: string }) {
  return (
    <form
      action={cancelBooking}
      onSubmit={(e) => {
        if (!window.confirm("¿Cancelar esta reserva? El turno queda libre para otra persona.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit pendingLabel="Cancelando…" className="border border-current/20 hover:border-[#c2410c] hover:text-[#c2410c]">
        {label}
      </Submit>
    </form>
  );
}

export function BlockDayForm({ min }: { min: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addBlockedDay, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
      <label className="block text-sm">
        <span className="text-muted">Fecha</span>
        <input name="date" type="date" min={min} required className={cn(inputClass, "mt-1.5")} />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Motivo (opcional)</span>
        <input name="reason" maxLength={200} placeholder="Feriado, vacaciones…" className={cn(inputClass, "mt-1.5")} />
      </label>
      <Submit pendingLabel="Bloqueando…" className="btn">
        Bloquear día
      </Submit>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}
