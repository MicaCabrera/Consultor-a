import type { Metadata } from "next";
import { getContent, LOCALE_LANG, LOCALE_PATH, type Locale } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Metadata of each language's page, with links to the other language. */
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getContent(locale);
  const path = LOCALE_PATH[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      languages: {
        [LOCALE_LANG.es]: LOCALE_PATH.es,
        [LOCALE_LANG.en]: LOCALE_PATH.en,
        "x-default": LOCALE_PATH.es,
      },
    },
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      alternateLocale: locale === "es" ? ["en_US"] : ["es_AR"],
      url: path,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
    robots: { index: true, follow: true },
  };
}
