import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Cursor } from "@/components/cursor";
import { RollTextController } from "@/components/roll-text-controller";
import { ChatLauncher } from "@/components/chat-launcher";
import { SkipLink } from "@/components/skip-link";
import { StructuredData } from "@/components/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  // Only the weights the site uses (400 text, 500 titles, 600 labels).
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-dark text-fg-dark">
        {/* Keyboard users: first Tab stop, jumps past the menu to the content */}
        <SkipLink />
        <StructuredData />
        <Cursor />
        <RollTextController />
        {children}
        <ChatLauncher />
      </body>
    </html>
  );
}
