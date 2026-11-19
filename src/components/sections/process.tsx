"use client";

import { motion } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { process } from "@/lib/content";
import { Button } from "@/components/button";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Process() {
  const reduce = useSafeReducedMotion();

  return (
    <Section id="como-funciona" theme="light" className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <FadeHeading as="h2" lines={[process.heading]} className="max-w-2xl text-4xl md:text-5xl" />
        </Reveal>

        <div className="relative mt-16 md:mt-10 md:pt-16">
          <ol className="flex flex-col gap-10 border-l border-current/15 pl-8 md:grid md:grid-cols-3 md:gap-0 md:border-l-0 md:pl-0">
            {process.steps.map((step, i) => (
              <motion.li
                key={step.number}
                className="relative flex flex-col"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                transition={reduce ? { duration: 0 } : { duration: 0.7, delay: 0.12 + i * 0.08, ease: EASE }}
              >
                <span className="block h-4 text-xs leading-4 tracking-[0.04em] text-muted">
                  {step.number}
                </span>

                {/* Rail: a segment per column so the three join into one line */}
                <span className="block md:relative md:my-4 md:h-[9px]">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 bg-current/15 md:block"
                  />
                  <span
                    aria-hidden
                    className="absolute left-[-37px] top-[0.2rem] block size-[9px] rounded-full bg-accent ring-4 ring-bg-light md:left-0 md:top-0"
                  />
                </span>

                <div className="mt-2 pr-6 md:mt-0">
                  <h3 className="text-lg font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-[1.45] text-muted">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <Reveal delay={0.3} className="mt-14 md:mt-16">
          <Button href="#consultoria">{process.cta}</Button>
        </Reveal>
      </div>
    </Section>
  );
}
