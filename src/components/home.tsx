import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { SectionThemeProvider } from "@/components/section-theme";
import { HeroShutter } from "@/components/sections/hero-shutter";
import { Specialties } from "@/components/sections/specialties";
import { Consulting } from "@/components/sections/consulting";
import { Audience } from "@/components/sections/audience";
import { Process } from "@/components/sections/process";
import { FinalCta } from "@/components/sections/final-cta";
import { MistBackground } from "@/components/mist-background";
import { ClipReveal, CurtainReveal } from "@/components/curtain-reveal";
import type { Locale } from "@/lib/i18n";
import { SwipeTransitions } from "@/components/swipe-transitions";

// Each block in its own Suspense boundary: nothing here suspends (the HTML
// comes complete from the server), but React then hydrates the blocks one by
// one instead of in a single long task, so the browser can paint in between.
/** The landing page, in either language (app/(es)/page.tsx, app/(en)/en/page.tsx). */
export function Home({ locale }: { locale: Locale }) {
  return (
    <SectionThemeProvider>
      <Nav />
      {/* Touch screens: each swipe plays a whole transition */}
      <SwipeTransitions />
      {/* Fixed mist seen through the dark sections after the hero */}
      <Suspense fallback={null}>
        <MistBackground />
      </Suspense>
      <main id="contenido" tabIndex={-1} className="outline-none">
        <Suspense fallback={null}>
          <HeroShutter />
        </Suspense>
        <Suspense fallback={null}>
          <Specialties />
        </Suspense>
        {/* «Consultoría» scrolls away and uncovers «¿Para quién es?» behind it */}
        <Suspense fallback={null}>
          <CurtainReveal cover={<Consulting locale={locale} />} revealed={<Audience locale={locale} />} />
        </Suspense>
        {/* «¿Para quién es?» (see-through) scrolls away and uncovers «Cómo funciona» */}
        <Suspense fallback={null}>
          <ClipReveal anchorId="como-funciona" revealed={<Process locale={locale} id={null} />} />
        </Suspense>
        <Suspense fallback={null}>
          <FinalCta locale={locale} />
        </Suspense>
      </main>
    </SectionThemeProvider>
  );
}
