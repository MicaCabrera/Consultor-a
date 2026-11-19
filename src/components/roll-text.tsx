import { Fragment } from "react";
import { cn } from "@/lib/utils";

const ANIMATED = /[\p{L}\p{N}]/u;

/**
 * Text that "rolls" letter by letter when its link or button is hovered
 * (or tapped on touch screens). The motion itself is driven by
 * <RollTextController />; this only lays the letters out.
 *
 * Each letter sits in its own clipped cell with a copy right below it.
 * Spaces, arrows and punctuation stay still, as in the reference.
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  // Index of each word's first character in the full string (spaces included),
  // which sets the stagger delay of every letter.
  const starts = words.map((_, w) =>
    words.slice(0, w).reduce((sum, word) => sum + word.length + 1, 0)
  );

  return (
    <span className={cn("inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 ? " " : null}
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, c) =>
                ANIMATED.test(char) ? (
                  <span key={c} className="inline-block [clip-path:inset(0)]">
                    <span data-roll-char={starts[w] + c} className="relative block">
                      {char}
                      <span className="absolute left-0 top-full">{char}</span>
                    </span>
                  </span>
                ) : (
                  <span key={c} className="inline-block">
                    {char}
                  </span>
                )
              )}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
