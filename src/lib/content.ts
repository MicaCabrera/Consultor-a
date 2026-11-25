/**
 * The site's copy. Spanish lives in i18n/es.ts and English in i18n/en.ts;
 * components get the right one with getContent(locale) (server) or
 * useContent() (client). These named exports are the Spanish copy, for the
 * places that only exist in Spanish (booking, admin, llms.txt, share image).
 */
import { es } from "./i18n/es";

export const { nav, hero, intro, specialties, consulting, audience, process, about, finalCta, footer } = es;
