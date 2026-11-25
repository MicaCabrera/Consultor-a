"use client";

import { Section } from "@/components/section";
import { Button } from "@/components/button";
import { FadeHeading } from "@/components/fade-heading";
import { useContent } from "@/components/locale-provider";
import { HeroVideo } from "@/components/ui/hero-video";

/** Layout classes of the hero section, shared with its visual copies. */
export const HERO_CLASS =
  "relative isolate flex min-h-svh flex-col justify-center overflow-hidden px-6 pt-32 pb-20 md:px-10";

export function Hero() {
  return (
    <Section id="inicio" theme="dark" className={HERO_CLASS}>
      <HeroVideo />
      <HeroContent />
    </Section>
  );
}

/** Everything inside the hero section. Rendered once for real and, as a
 *  visual copy (`copy`), inside each slat of the hero → «Sobre mí»
 *  transition: the copies show the final state straight away, with no
 *  entrance animation, and their title isn't a heading (one h1 per page). */
export function HeroContent({ copy = false }: { copy?: boolean }) {
  const { hero } = useContent();
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-bg-dark" />

      {/* Same column as the next section (mx-auto max-w-6xl px-6 md:px-10),
          so the text starts on the same vertical line. The negative margin
          cancels the section padding, which that column already includes. */}
      <div className="-mx-6 md:-mx-10">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
          {/* Lines rise from their masks on load. Non-breaking spaces keep
              "lo que viene?" together on one line, as before. */}
          <FadeHeading
            as={copy ? "p" : "h1"}
            trigger={copy ? "static" : "mount"}
            delay={0.15}
            lines={[`${hero.headingPrefix} ${hero.headingHighlight.replace(/ /g, " ")}${hero.headingSuffix}`]}
            className="max-w-[15ch] text-left text-[13vw] font-medium leading-[0.9] tracking-tight text-fg-dark md:text-[9vw] lg:text-[6.4vw]"
          />

          {copy ? (
            <>
              <p className="mt-8 max-w-xl text-left text-base text-muted md:text-lg">{hero.description}</p>
              <div className="mt-10 flex flex-col items-start gap-4">
                <Button href="#consultoria">{hero.cta}</Button>
              </div>
            </>
          ) : (
            <>
              {/* Same fade-up as before, in CSS (.hero-rise): it starts with the
                  first paint instead of waiting for the page script. */}
              <p
                className="hero-rise mt-8 max-w-xl text-left text-base text-muted md:text-lg"
                style={{ animationDelay: "0.7s" }}
              >
                {hero.description}
              </p>

              <div className="hero-rise mt-10 flex flex-col items-start gap-4" style={{ animationDelay: "0.85s" }}>
                <Button href="#consultoria">{hero.cta}</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
