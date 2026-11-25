"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { useUncovered } from "@/components/curtain-reveal";

/*
 * Masked line-by-line reveal for headings.
 *
 * Every word sits in its own mask (overflow hidden) and rises into place from
 * below. Words are grouped by the line they actually land on — measured from
 * the rendered layout, so it follows the real wrapping at every width — and
 * a whole line moves together, each line a little after the one above. It
 * plays once, the first time the heading enters the viewport (or on mount
 * with `trigger="mount"`, for the first screen).
 *
 * The masks add no space: their bottom padding (room for descenders) is
 * cancelled by an equal negative margin, and the word spacing is the same
 * margin the words had before, so the heading's layout is unchanged.
 */

// Smooth ease-in-out with a long, soft landing.
const EASE = [0.65, 0.05, 0, 1] as const;
const DURATION = 1.1;
const LINE_STAGGER = 0.12;

export function FadeHeading({
  lines,
  fadedWords = 0,
  className,
  dot = false,
  accentWords = [],
  as: Tag = "h1",
  trigger = "view",
  delay = 0,
}: {
  lines: string[];
  fadedWords?: number;
  className?: string;
  dot?: boolean;
  /** Words shown in the accent serif italic, like the hero highlight. */
  accentWords?: string[];
  as?: "h1" | "h2" | "h3";
  /** "view": when it scrolls into view (once). "mount": as soon as it renders. */
  trigger?: "view" | "mount";
  /** Seconds before the first line starts. */
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35, margin: "0px 0px -8% 0px" });
  const reduce = useSafeReducedMotion();
  // Behind a curtain (CurtainReveal), also wait until it is really uncovered.
  const uncovered = useUncovered(ref, 0.35);
  const show = reduce || trigger === "mount" || (inView && uncovered);

  // Line index of each word, measured after layout (and again on resize, as
  // long as the reveal hasn't played yet).
  const [lineOf, setLineOf] = useState<number[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const result: number[] = [];
      let line = -1;
      let lastTop = Number.NEGATIVE_INFINITY;
      el.querySelectorAll<HTMLElement>("[data-mask]").forEach((mask) => {
        if (Math.abs(mask.offsetTop - lastTop) > 4) {
          line += 1;
          lastTop = mask.offsetTop;
        }
        result.push(line);
      });
      setLineOf(result);
    };
    const ro = new ResizeObserver(measure); // also fires once right away
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const linesWords = lines.map((line) => line.split(" "));
  const totalWords = linesWords.flat().length;
  let w = 0;

  return (
    <Tag ref={ref} className={cn("fade-heading font-medium leading-[0.95] tracking-tight", className)}>
      {linesWords.map((lineWords, lineIndex) => (
        <span key={lineIndex} className="block">
          {lineWords.map((word, i) => {
            const index = w++;
            const isFaded = totalWords - index <= fadedWords;
            const isAccent = accentWords.includes(word.replace(/[.,;:!?¿¡]/g, ""));
            const isLast = lineIndex === linesWords.length - 1 && i === lineWords.length - 1;
            const line = lineOf[index] ?? 0;
            return (
              <span
                key={i}
                data-mask
                className="-mb-[0.14em] mr-[0.22em] overflow-hidden pb-[0.14em] align-bottom"
              >
                <motion.span
                  initial={reduce ? false : { y: "115%" }}
                  animate={show ? { y: "0%" } : { y: "115%" }}
                  transition={{ duration: DURATION, ease: EASE, delay: delay + line * LINE_STAGGER }}
                  className={cn(isFaded && "is-faded", isAccent && "text-accent italic")}
                  style={isAccent ? { fontFamily: "var(--font-accent-serif)" } : undefined}
                >
                  {word}
                  {isLast && dot ? <span className="accent-dot" /> : null}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
