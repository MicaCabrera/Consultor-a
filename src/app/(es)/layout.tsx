import "../globals.css";
import { SiteShell } from "@/components/site-shell";
import { buildMetadata } from "@/lib/metadata";

// Spanish (default): "/" plus the paused booking and admin pages.
export const metadata = buildMetadata("es");

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="es">{children}</SiteShell>;
}
