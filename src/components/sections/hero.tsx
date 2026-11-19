"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { Button } from "@/components/button";
import { hero } from "@/lib/content";

/** Layout classes of the hero section, shared with its visual copies. */
export const HERO_CLASS =
  "relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-32 pb-20 md:px-10";

export function Hero() {
  return (
    <Section id="inicio" theme="dark" className={HERO_CLASS}>
      <HeroContent />
    </Section>
  );
}

/** Everything inside the hero section. Rendered once for real and, as a
 *  visual copy, inside each slat of the hero → «Sobre mí» transition. */
export function HeroContent() {
  return (
    <>
      <div className="grid-floor absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-bg-dark" />

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl text-center text-[15vw] font-medium leading-[0.86] tracking-tight text-fg-dark md:text-[7.8vw]"
      >
        {hero.headingPrefix}{" "}
        <span
          className="text-accent italic"
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
        className="mx-auto mt-8 max-w-xl text-center text-base text-muted md:text-lg"
      >
        {hero.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.85 }}
        className="mt-10 flex flex-col items-center gap-4"
      >
        <Button href="#consultoria">{hero.cta}</Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 right-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted md:right-10"
      >
        <span className="relative flex h-10 w-6 items-start justify-center rounded-full border border-current/30 p-1.5">
          <motion.span
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-accent"
          />
        </span>
        Scroll
      </motion.div>
    </>
  );
}
