"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FadeHeading({
  lines,
  fadedWords = 0,
  className,
  dot = false,
  as: Tag = "h1",
}: {
  lines: string[];
  fadedWords?: number;
  className?: string;
  dot?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  const linesWords = lines.map((line) => line.split(" "));
  const totalWords = linesWords.flat().length;
  // Index of each line's first word in the whole heading (for the stagger).
  const lineStarts = linesWords.map((_, l) =>
    linesWords.slice(0, l).reduce((sum, words) => sum + words.length, 0)
  );

  return (
    <Tag className={cn("fade-heading font-medium leading-[0.95] tracking-tight", className)}>
      {linesWords.map((lineWords, lineIndex) => (
        <span key={lineIndex} className="block overflow-hidden">
          {lineWords.map((word, i) => {
            const globalIndex = lineStarts[lineIndex] + i;
            const isFaded = totalWords - globalIndex <= fadedWords;
            const isLast = lineIndex === linesWords.length - 1 && i === lineWords.length - 1;
            return (
              <motion.span
                key={i}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.06 * globalIndex,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn("mr-[0.22em] inline-block", isFaded && "is-faded")}
              >
                {word}
                {isLast && dot ? <span className="accent-dot" /> : null}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
