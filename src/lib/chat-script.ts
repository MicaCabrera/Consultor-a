import type { Locale } from "@/lib/i18n";
import { CHAT_UI, STEPS, WA, matchFreeText } from "./mica";
import { CHAT_UI_EN, STEPS_EN, WA_EN, matchFreeTextEn } from "./mica-en";

/** Avi's script and window text in the page's language. */
export function getChatScript(locale: Locale) {
  return locale === "en"
    ? { steps: STEPS_EN, wa: WA_EN, match: matchFreeTextEn, ui: CHAT_UI_EN }
    : { steps: STEPS, wa: WA, match: matchFreeText, ui: CHAT_UI };
}

export type ChatScript = ReturnType<typeof getChatScript>;
