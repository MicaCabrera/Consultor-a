"use client";

import { createContext, useContext } from "react";
import { getContent, type Content, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("es");

/** Language of the page, for client components (see useContent). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The page's copy in its language. */
export function useContent(): Content {
  return getContent(useContext(LocaleContext));
}
