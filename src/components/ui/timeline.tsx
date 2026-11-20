"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "framer-motion";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/*
 * Horizontal scroll timeline, adapted from Hyperiux Vault's Timeline.
 *
 * Same mechanics as the reference: the section pins, vertical scroll slides a
 * track sideways, steps alternate above and below one central line, and each
 * step's dot and stem grow, and its copy rises from a mask, when it is reached.
 *
 * The green line is drawn up to a fixed reading point on screen, and a step
 * turns on exactly when the line reaches its dot, so line and steps always
 * agree. Built on framer-motion (already in the project) instead of GSAP.
 */

export type TimelineStep = { number: string; title: string; description: string };

const EASE = [0.16, 1, 0.3, 1] as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Where on screen (fraction of the width) the line "arrives". */
const READ_AT = 0.68;
/** Vertical scroll spent per pixel of horizontal travel. */
const SCROLL_PER_PX = 1.15;
/**
 * Extra pinned scroll after the slide ends, as a share of the slide's own
 * scroll length: the last step stays on screen, still, before the pin releases.
 * Added only at the end, so the pace of the earlier steps is unchanged.
 */
const HOLD = 0.25;

function MaskReveal({
  show,
  delay = 0,
  className,
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("block overflow-hidden pb-[0.08em]", className)}>
      <motion.span
        className="block"
        initial={false}
        animate={show ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
        transition={{ duration: show ? 0.75 : 0.35, ease: EASE, delay: show ? delay : 0 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Step({
  step,
  index,
  active,
  dotRef,
}: {
  step: TimelineStep;
  index: number;
  active: boolean;
  dotRef: (el: HTMLSpanElement | null) => void;
}) {
  const above = index % 2 === 0;
  return (
    <li
      className={cn("absolute w-[var(--c)]", above ? "top-0 bottom-1/2" : "top-1/2 bottom-0")}
      style={{ left: `calc(var(--s) * ${index})` }}
    >
      {/* Stem from the central line out to the copy */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scaleY: active ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={cn(
          "absolute left-0 w-px bg-accent",
          above ? "top-1 bottom-0 origin-bottom" : "top-0 bottom-1 origin-top"
        )}
      />
      {/* Dot on the line */}
      <span
        ref={dotRef}
        className={cn(
          "absolute left-0 -translate-x-1/2",
          above ? "bottom-0 translate-y-1/2" : "top-0 -translate-y-1/2"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "block size-[11px] rounded-full border transition-[background-color,border-color,transform] duration-500",
            active ? "scale-100 border-accent bg-accent" : "scale-75 border-current/30 bg-bg-light"
          )}
        />
      </span>
      {/* Copy at the far end of the stem */}
      <div className={cn("absolute inset-x-0 pl-6 pr-2", above ? "top-0" : "bottom-0")}>
        <MaskReveal show={active}>
          <span className="text-xs tabular-nums tracking-[0.06em] text-accent">{step.number}</span>
        </MaskReveal>
        <MaskReveal show={active} delay={0.05} className="mt-2">
          <h3 className="text-xl font-medium leading-[1.15] tracking-tight md:text-2xl">
            {step.title}
          </h3>
        </MaskReveal>
        <MaskReveal show={active} delay={0.12} className="mt-2.5">
          <p className="text-sm leading-[1.5] text-muted">{step.description}</p>
        </MaskReveal>
      </div>
    </li>
  );
}

export function Timeline({
  heading,
  steps,
}: {
  heading: React.ReactNode;
  steps: TimelineStep[];
}) {
  const reduce = useSafeReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);

  const [travel, setTravel] = useState(0); // horizontal distance to slide, px
  const [reached, setReached] = useState(0);

  const raw = useMotionValue(0);
  const progress = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.5 });
  const x = useMotionValue(0);
  const fill = useMotionValue(0);

  // How far the track must slide: until the last dot sits just left of centre.
  const measure = useCallback(() => {
    const track = trackRef.current;
    const last = dots.current[steps.length - 1];
    if (!track || !last) return;
    const vw = document.documentElement.clientWidth;
    // Both boxes move together with the slide, so their difference is the
    // dot's position inside the track whatever the current offset.
    const dotInTrack = last.getBoundingClientRect().left - track.getBoundingClientRect().left;
    // End with the last dot left of centre, and never with its copy cut off.
    const copyWidth = last.parentElement?.offsetWidth ?? 0;
    const endAt = Math.min(vw * 0.45, vw - copyWidth - 24);
    setTravel(Math.max(0, dotInTrack - endAt));
  }, [steps.length]);

  useEffect(() => {
    measure();
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    window.addEventListener("resize", measure);
    return () => {
      alive = false;
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Scroll → progress through the pinned stretch.
  const { scrollY } = useScroll();
  const onScroll = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Progress covers the slide only; the hold that follows keeps it at 1.
    const slide = travel * SCROLL_PER_PX;
    raw.set(slide > 0 ? clamp01(-wrap.getBoundingClientRect().top / slide) : 0);
  }, [raw, travel]);
  useMotionValueEvent(scrollY, "change", onScroll);
  useEffect(onScroll, [onScroll, travel]);

  // Progress → slide, then line fill and reached steps from real positions.
  const render = useCallback(() => {
    x.set(-progress.get() * travel);
    const line = lineRef.current;
    if (!line) return;
    const vw = document.documentElement.clientWidth;
    const readAt = vw * READ_AT;
    const r = line.getBoundingClientRect();
    fill.set(clamp01((readAt - r.left) / r.width));
    const count = dots.current.filter((d) => d && d.getBoundingClientRect().left <= readAt).length;
    setReached((prev) => (prev === count ? prev : count));
  }, [progress, travel, x, fill]);
  useMotionValueEvent(progress, "change", render);
  useEffect(render, [render]);

  const timeline = (
    <div className="relative h-full w-[calc(var(--s)*4_+_var(--c))] shrink-0">
      {/* Central line and its accent fill */}
      <div ref={lineRef} aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-current/15" />
      <motion.div
        aria-hidden
        style={{ scaleX: reduce ? 1 : fill }}
        className="absolute inset-x-0 top-1/2 h-px origin-left bg-accent"
      />
      <ol>
        {steps.map((step, i) => (
          <Step
            key={step.number}
            step={step}
            index={i}
            active={reduce || i < reached}
            dotRef={(el) => {
              dots.current[i] = el;
            }}
          />
        ))}
      </ol>
    </div>
  );

  const trackClass =
    "flex h-[min(78svh,36rem)] items-stretch gap-[10vw] px-6 md:h-[min(70svh,38rem)] md:gap-[7vw] md:px-10 " +
    // Step spacing (--s) and copy width (--c). Same-side steps sit 2·s apart,
    // always more than c, so copy never overlaps.
    "[--c:74vw] [--s:42vw] md:[--c:clamp(15rem,30vw,20rem)] md:[--s:clamp(11rem,20vw,15rem)] lg:[--c:clamp(16rem,22vw,22rem)] lg:[--s:clamp(14rem,19vw,19rem)]";

  // Reduced motion: no pinning, no scrubbing; a plain horizontal scroller.
  if (reduce) {
    return (
      <div className="overflow-x-auto py-16">
        <div ref={trackRef} className={cn(trackClass, "w-max")}>
          <div className="flex w-[min(85vw,40rem)] shrink-0 items-center lg:w-[min(50vw,46rem)]">{heading}</div>
          {timeline}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{
        height: travel
          ? `calc(100svh + ${Math.round(travel * SCROLL_PER_PX * (1 + HOLD))}px)`
          : "300svh",
      }}
    >
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className={cn(trackClass, "w-max will-change-transform")}>
          <div className="flex w-[min(85vw,40rem)] shrink-0 items-center lg:w-[min(50vw,46rem)]">{heading}</div>
          {timeline}
        </motion.div>
      </div>
    </div>
  );
}
