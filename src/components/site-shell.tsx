import { dmSans } from "@/app/fonts";
import { Cursor } from "@/components/cursor";
import { RollTextController } from "@/components/roll-text-controller";
import { ChatLauncher } from "@/components/chat-launcher";
import { SkipLink } from "@/components/skip-link";
import { StructuredData } from "@/components/structured-data";
import { LocaleProvider } from "@/components/locale-provider";
import { LOCALE_LANG, type Locale } from "@/lib/i18n";

/**
 * <html> and <body> of every page, in its language. Each language has its
 * own root layout (app/(es) and app/(en)) so the lang attribute, metadata
 * and structured data always match the page.
 */
export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={LOCALE_LANG[locale]} className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-dark text-fg-dark">
        <LocaleProvider locale={locale}>
          {/* Keyboard users: first Tab stop, jumps past the menu to the content */}
          <SkipLink />
          <StructuredData locale={locale} />
          <Cursor />
          <RollTextController />
          {children}
          <ChatLauncher />
        </LocaleProvider>
      </body>
    </html>
  );
}
