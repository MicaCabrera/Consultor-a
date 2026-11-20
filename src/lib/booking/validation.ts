import { isSlot, isWeekday, type Slot } from "./schedule";

/**
 * Booking form validation, shared by the form (instant feedback) and the
 * server action (the real check). The database enforces the same limits.
 */

export type BookingInput = {
  date: string;
  slot: Slot;
  name: string;
  email: string;
  occupation: string;
  topic: string;
};

export type BookingField = keyof BookingInput;
export type FieldErrors = Partial<Record<BookingField, string>>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LIMITS = {
  name: { min: 2, max: 120 },
  occupation: { min: 2, max: 300 },
  topic: { min: 10, max: 2000 },
} as const;

export function validateBooking(raw: Record<string, unknown>):
  | { ok: true; data: BookingInput }
  | { ok: false; errors: FieldErrors } {
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  const data = {
    date: text("date"),
    slot: text("slot"),
    name: text("name"),
    email: text("email").toLowerCase(),
    occupation: text("occupation"),
    topic: text("topic"),
  };
  const errors: FieldErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !isWeekday(data.date)) {
    errors.date = "Elegí un día disponible.";
  }
  if (!isSlot(data.slot)) errors.slot = "Elegí un horario.";

  const length = (key: "name" | "occupation" | "topic", label: string) => {
    const { min, max } = LIMITS[key];
    if (data[key].length < min) errors[key] = `${label} es demasiado corto.`;
    else if (data[key].length > max) errors[key] = `${label} supera los ${max} caracteres.`;
  };
  length("name", "El nombre");
  length("occupation", "Este campo");
  length("topic", "Este campo");
  if (!data.topic) errors.topic = "Contanos qué querés trabajar en la sesión.";
  if (!data.name) errors.name = "Ingresá tu nombre.";
  if (!data.occupation) errors.occupation = "Contanos a qué te dedicás.";

  if (!EMAIL.test(data.email) || data.email.length > 254) {
    errors.email = "Ingresá un email válido.";
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, data: data as BookingInput };
}
