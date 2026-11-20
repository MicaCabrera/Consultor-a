import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Cursor } from "@/components/cursor";
import { RollTextController } from "@/components/roll-text-controller";
import { MicaChat } from "@/components/mica-chat";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-accent-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "César Vidal Scasso — Consultoría estratégica en tecnología e IA",
  description:
    "Consultorías individuales de 60 minutos sobre tecnología, inteligencia artificial, innovación y desarrollo de negocios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-dark text-fg-dark">
        <Cursor />
        <RollTextController />
        {children}
        <MicaChat />
      </body>
    </html>
  );
}
