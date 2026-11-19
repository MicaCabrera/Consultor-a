"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!$&@#%<>|_.";
const WINDOW_SIZE = 10;
const STEP_MS = 24;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function TypewriterText({
  text,
  className,
  play,
}: {
  text: string;
  className?: string;
  /** Optional extra gate: the effect waits until this is true and in view. */
  play?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const seen = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });
  const inView = seen && (play ?? true);
  const [chars, setChars] = useState<{ char: string; glitching: boolean }[]>(
    () => text.split("").map((char) => ({ char, glitching: false }))
  );
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const totalSteps = text.length + WINDOW_SIZE;
    let step = 0;

    const id = setInterval(() => {
      step += 1;
      const windowStart = step - WINDOW_SIZE;
      const windowEnd = step;

      setChars(
        text.split("").map((char, i) => {
          if (char === " ") return { char, glitching: false };
          const inWindow = i >= windowStart && i < windowEnd;
          return inWindow
            ? { char: randomGlyph(), glitching: true }
            : { char, glitching: false };
        })
      );

      if (step >= totalSteps) {
        setChars(text.split("").map((char) => ({ char, glitching: false })));
        clearInterval(id);
      }
    }, STEP_MS);

    return () => clearInterval(id);
  }, [inView, text]);

  return (
    <p ref={ref} className={cn(className)}>
      {chars.map((c, i) => (
        <span key={i} className={c.glitching ? "text-accent" : undefined}>
          {c.char}
        </span>
      ))}
    </p>
  );
}
