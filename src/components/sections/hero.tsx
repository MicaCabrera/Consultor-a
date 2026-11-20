"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { Button } from "@/components/button";
import { hero } from "@/lib/content";
import { HeroSmoke } from "@/components/ui/hero-smoke";

/** Layout classes of the hero section, shared with its visual copies. */
export const HERO_CLASS =
  "relative isolate flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-32 pb-20 md:px-10";

export function Hero() {
  return (
    <Section id="inicio" theme="dark" className={HERO_CLASS}>
      <HeroSmoke />
      <HeroContent />
    </Section>
  );
}

/** Everything inside the hero section. Rendered once for real and, as a
 *  visual copy, inside each slat of the hero → «Sobre mí» transition. */
export function HeroContent() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-bg-dark" />

      {/* Same column as the next section (mx-auto max-w-6xl px-6 md:px-10),
          so the text starts on the same vertical line. The negative margin
          cancels the section padding, which that column already includes. */}
      <div className="-mx-6 md:-mx-10">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[15ch] text-left text-[11.5vw] font-medium leading-[0.9] tracking-tight text-fg-dark md:text-[5.6vw]"
          >
            {hero.headingPrefix}{" "}
            <span
              className="whitespace-nowrap italic"
              style={{ fontFamily: "var(--font-accent-serif)" }}
            >
              {hero.headingHighlight}
            </span>
            {hero.headingSuffix}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 max-w-xl text-left text-base text-muted md:text-lg"
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-10 flex flex-col items-start gap-4"
          >
            <Button href="#consultoria">{hero.cta}</Button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
