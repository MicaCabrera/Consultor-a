import type { Metadata } from "next";
import Link from "next/link";
import { BookingFlow } from "./booking-flow";

export const metadata: Metadata = {
  title: "Reservar consultoría — César Vidal Scasso",
  description:
    "Elegí día y horario para tu consultoría individual de 60 minutos sobre tecnología, IA, innovación y desarrollo de negocios.",
};

export default function ReservarPage() {
  return (
    <div data-theme="light" className="min-h-svh bg-bg-light text-fg-light">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" data-cursor="link" className="-my-2 py-2 text-lg font-semibold tracking-tight">
          <span className="mr-[0.3em] text-accent">⊹</span>CVS
        </Link>
        <Link
          href="/"
          data-cursor="link"
          className="-my-3 py-3 text-[13px] font-semibold uppercase tracking-wider"
        >
          Volver
        </Link>
      </header>
      <main className="px-6 pb-28 pt-10 md:px-10 md:pt-16">
        <BookingFlow />
      </main>
    </div>
  );
}
