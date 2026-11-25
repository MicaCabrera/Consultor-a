import { es, type Content } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";
export type { Content };

export const LOCALES: Locale[] = ["es", "en"];
/** Path of each language's home page. */
export const LOCALE_PATH: Record<Locale, string> = { es: "/", en: "/en" };
/** HTML lang / hreflang of each language. */
export const LOCALE_LANG: Record<Locale, string> = { es: "es-AR", en: "en" };

const DICTIONARIES: Record<Locale, Content> = { es, en };

export function getContent(locale: Locale): Content {
  return DICTIONARIES[locale];
}
