"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { specialties } from "@/lib/content";

type Item = (typeof specialties.items)[number];

// Timing taken from the reference implementation.
const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

/** Big watermark number. All values are stacked in one cell and cross-faded,
 *  with a spring slide in the scroll direction so the change never jumps. */
function ActiveNumber({ active }: { active: number }) {
  const reduce = useSafeReducedMotion();

  return (
    <div className="grid select-none text-[clamp(160px,22vw,380px)] font-normal leading-[0.76] tracking-[-0.08em] text-fg-dark/10">
      {specialties.items.map((item, i) => {
        const offset = i === active ? 0 : i < active ? -0.18 : 0.18;
        return (
          <motion.span
            key={item.title}
            className="[grid-area:1/1]"
            initial={false}
            animate={{ opacity: i === active ? 1 : 0, y: reduce ? 0 : `${offset}em` }}
            transition={{
              opacity: { duration: 0.36, ease: "easeOut" },
              y: { type: "spring", stiffness: 110, damping: 22, mass: 0.8 },
            }}
          >
            {pad(i + 1)}
          </motion.span>
        );
      })}
    </div>
  );
}

function Card({
  item,
  index,
  cardRef,
}: {
  item: Item;
  index: number;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const reduce = useSafeReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, {
    once: true,
    amount: 0.22,
    margin: "0px 0px -16% 0px",
  });
  const words = item.title.split(" ");

  return (
    <motion.article
      ref={(el) => {
        ref.current = el;
        cardRef(el);
      }}
      data-index={index}
      initial={false}
      animate={
        reduce || visible ? { opacity: 1, y: 0 } : { opacity: 0.12, y: 30 }
      }
      transition={reduce ? { duration: 0 } : { duration: 0.72, ease: EASE, delay: (index % 4) * 0.08 }}
      className="py-[clamp(42px,4vw,72px)] lg:col-start-5 lg:col-end-12 lg:min-h-[clamp(360px,42vh,560px)]"
    >
      {/* Mobile: the watermark number travels with each card */}
      <span
        aria-hidden
        className="mb-6 block select-none text-[96px] leading-[0.76] tracking-[-0.08em] text-fg-dark/10 lg:hidden"
      >
        {pad(index + 1)}
      </span>

      <div>
        <h3 className="text-[clamp(28px,2.35vw,46px)] font-medium leading-[1.06] tracking-[-0.01em] text-fg-dark">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span
                className="inline-block"
                initial={false}
                animate={{ y: reduce || visible ? "0%" : "112%" }}
                transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE }}
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </motion.span>
            </span>
          ))}
        </h3>
      </div>

      <p className="mt-[34px] max-w-[34em] text-[15px] leading-6 text-muted">
        {item.description}
      </p>
    </motion.article>
  );
}

export function Specialties() {
  const [active, setActive] = useState(0);
  const cards = useRef<(HTMLElement | null)[]>([]);

  // Same rule as the reference: a card becomes active when half of it sits
  // inside the band between 18% from the top and 28% from the bottom.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActive(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { threshold: 0.5, rootMargin: "-18% 0px -28% 0px" }
    );
    cards.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const total = specialties.items.length;

  return (
    <Section id="especialidades" theme="dark" mist className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 lg:gap-x-[30px]">
        <aside
          aria-hidden
          className="hidden lg:sticky lg:top-[36vh] lg:col-start-1 lg:col-end-4 lg:row-start-1 lg:block lg:self-start"
          style={{ gridRowEnd: `span ${total + 1}` }}
        >
          <ActiveNumber active={active} />
        </aside>

        <Reveal className="pb-[clamp(56px,7vw,118px)] lg:col-start-5 lg:col-end-12 lg:row-start-1">
          <FadeHeading
            as="h2"
            lines={[specialties.heading]}
            className="text-4xl md:text-5xl"
          />
          <p className="mt-6 max-w-xl text-base text-muted md:text-lg">
            {specialties.description}
          </p>
        </Reveal>

        {specialties.items.map((item, i) => (
          <Card
            key={item.title}
            item={item}
            index={i}
            cardRef={(el) => {
              cards.current[i] = el;
            }}
          />
        ))}
      </div>
    </Section>
  );
}
