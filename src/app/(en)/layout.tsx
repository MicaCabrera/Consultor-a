import "../globals.css";
import { SiteShell } from "@/components/site-shell";
import { buildMetadata } from "@/lib/metadata";

// English: "/en".
export const metadata = buildMetadata("en");

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
