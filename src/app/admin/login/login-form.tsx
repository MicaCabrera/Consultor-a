"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const inputClass =
  "w-full border border-current/20 bg-transparent px-4 py-3 text-base outline-none transition-colors focus:border-accent";

export function LoginForm({ forbidden }: { forbidden: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {
    error: forbidden ? "Esta cuenta no tiene acceso al panel." : null,
  });

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" autoComplete="email" required className={`${inputClass} mt-2`} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputClass} mt-2`}
        />
      </label>
      {state.error ? <p className="text-sm text-[#c2410c]">{state.error}</p> : null}
      <button
        type="submit"
        data-cursor="link"
        disabled={pending}
        className="btn inline-flex w-full items-center justify-center px-5 py-3 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
