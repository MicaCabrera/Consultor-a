"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface SpineAccordionItem {
  title: string;
  description: string;
  /** Background photo shown behind the open panel. */
  image?: string;
  meta?: string;
}

export interface SpineAccordionProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "children" | "onChange"> {
  items: SpineAccordionItem[];
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Collapsed size when stacked (narrow containers). */
  spine?: string;
  /** Collapsed width when laid out in a row (container ≥ 48rem). */
  spineWide?: string;
}

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const pad = (n: number) => String(n).padStart(2, "0");

export function SpineAccordion({
  items,
  index,
  defaultIndex = 0,
  onIndexChange,
  spine = "4.5rem",
  spineWide = "7rem",
  className,
  style,
  ...props
}: SpineAccordionProps) {
  const [internal, setInternal] = React.useState(defaultIndex);
  const open = index ?? internal;

  const select = React.useCallback(
    (next: number) => {
      if (index === undefined) setInternal(next);
      onIndexChange?.(next);
    },
    [index, onIndexChange]
  );

  return (
    <section
      className={cn("@container relative w-full select-none", className)}
      style={{ "--spine": spine, "--spine-wide": spineWide, ...style } as React.CSSProperties}
      {...props}
    >
      <div className="flex h-full w-full flex-col gap-2 @3xl:flex-row @3xl:gap-4">
        {items.map((item, i) => {
          const isOpen = i === open;
          return (
            <button
              key={item.title}
              type="button"
              data-cursor="link"
              aria-expanded={isOpen}
              onClick={() => select(i)}
              onFocus={() => select(i)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") select(i);
              }}
              className={cn(
                "relative min-h-[var(--spine)] shrink cursor-pointer overflow-hidden border text-left outline-none",
                "@3xl:min-h-0 @3xl:min-w-[var(--spine-wide)]",
                `transition-[flex-basis,background-color,border-color,color] duration-700 ${EASE}`,
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                "motion-reduce:transition-none",
                isOpen
                  ? "basis-full border-current/10 bg-white/[0.02] text-white"
                  : "basis-[var(--spine)] border-current/10 bg-white/[0.02] hover:border-current/25 @3xl:basis-[var(--spine-wide)]"
              )}
            >
              {/* Collapsed spine: number, dot and the title (vertical in a row) */}
              <span
                aria-hidden={isOpen}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
                  isOpen ? "pointer-events-none opacity-0" : "opacity-100 delay-200"
                )}
              >
                <span className="absolute left-5 top-0 flex h-[var(--spine)] items-center text-xs tabular-nums text-muted @3xl:top-6 @3xl:h-auto">
                  {pad(i + 1)}
                </span>
                <span className="absolute right-5 top-0 flex h-[var(--spine)] items-center @3xl:top-6 @3xl:h-auto">
                  <span className="block size-2 rounded-full bg-accent" />
                </span>
                <span
                  className={cn(
                    "absolute left-14 top-0 flex h-[var(--spine)] items-center whitespace-nowrap text-lg font-semibold tracking-tight",
                    "@3xl:left-1/2 @3xl:top-auto @3xl:bottom-6 @3xl:h-auto @3xl:-translate-x-1/2 @3xl:rotate-180 @3xl:text-4xl @3xl:leading-none @3xl:[writing-mode:vertical-rl]"
                  )}
                >
                  {item.title}
                </span>
              </span>

              {/* Background photo, darkened at the bottom so the text stays legible */}
              {item.image ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
                    isOpen ? "opacity-100" : "opacity-0"
                  )}
                >
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 70vw, 100vw"
                    draggable={false}
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
                </span>
              ) : null}

              {/* Open panel: the text revealed with a fade-up */}
              <span
                aria-hidden={!isOpen}
                className={cn(
                  "absolute inset-0 flex flex-col justify-between gap-6 p-6 @3xl:p-10",
                  `transition-[opacity,transform] ${EASE} motion-reduce:transition-none`,
                  isOpen
                    ? "translate-y-0 opacity-100 duration-700 delay-300"
                    : "pointer-events-none translate-y-4 opacity-0 duration-200"
                )}
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="text-[clamp(1.75rem,5cqw,3.5rem)] font-semibold leading-none tracking-tight">
                    {item.title}
                  </span>
                  <span className="shrink-0 pt-1 text-xs tabular-nums opacity-70">{pad(i + 1)}</span>
                </span>
                <span className="block max-w-xl">
                  <span className="block text-base leading-relaxed @3xl:text-2xl @3xl:leading-snug">
                    {item.description}
                  </span>
                  {item.meta ? (
                    <span className="mt-4 block text-sm opacity-70">{item.meta}</span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default SpineAccordion;
