import type { MetadataRoute } from "next";
import { LOCALE_LANG, LOCALE_PATH, LOCALES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

// The landing in each language, each pointing to the other (hreflang).
// (Booking and admin pages are paused/private.)
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_LANG[l], url(LOCALE_PATH[l])]));
  return LOCALES.map((l) => ({
    url: url(LOCALE_PATH[l]),
    changeFrequency: "monthly" as const,
    priority: l === "es" ? 1 : 0.9,
    alternates: { languages },
  }));
}
