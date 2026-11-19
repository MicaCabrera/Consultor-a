"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Section } from "@/components/section";
import { useShutterRevealed } from "@/components/ui/slat-shutter";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { intro } from "@/lib/content";
import { cn } from "@/lib/utils";

/*
 * «Sobre mí» — scroll to scale.
 *
 * A tall track holds a sticky viewport. Progress p (0 → 1) runs over the
 * pinned part of the scroll:
 *
 *   0.00–0.06  hold: title + small square photo
 *   0.08–0.32  title fades and drifts up
 *   0.06–0.62  photo grows from a square crop to the full 3:2 frame,
 *              travelling to the centre (max ≈50% of the width on desktop)
 *   0.72–1.00  photo starts rising, accelerating until it moves exactly at
 *              scroll speed when the pin releases, so the hand-off to normal
 *              scrolling has no seam
 *
 * The text follows the track in normal flow and fades up, tied to scroll,
 * while the photo is still on its way out.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const RISE_FROM = 0.72;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Geometry = {
  ready: boolean;
  scale0: number; // initial scale of the photo frame
  inset0: number; // initial side crop (px, unscaled) that makes it square
  x0: number; // initial offset from the viewport centre
  y0: number;
  rise: number; // scroll length (px) of the rise segment
};

/** Fades and lifts its children in as they scroll into view. */
function ScrollReveal({
  children,
  className,
  distance = 40,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raw = useMotionValue(0);
  const progress = useSpring(raw, { stiffness: 110, damping: 26, mass: 0.5 });
  const opacity = useTransform(progress, [0, 1], [0, 1]);
  const y = useTransform(progress, [0, 1], [distance, 0]);
  const { scrollY } = useScroll();

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const vh = window.innerHeight;
    const top = el.getBoundingClientRect().top;
    // From 92% down the viewport to 62%: fully in place well before centre.
    raw.set(clamp01((vh * 0.92 - top) / (vh * 0.3)));
  }, [raw]);

  useMotionValueEvent(scrollY, "change", update);
  useEffect(update, [update]);

  const reduce = useSafeReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

function Title({ animate }: { animate: boolean }) {
  const words = intro.heading.split(" ");
  return (
    <h2 className="text-5xl font-medium leading-[0.95] tracking-tight md:text-6xl lg:text-[5rem]">
      {words.map((word, i) => (
        // The mask's bottom padding keeps descenders visible; the matching
        // negative margin keeps it from adding to the line spacing.
        <span key={i} className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={false}
            animate={animate ? { y: "0%", opacity: 1 } : { y: "105%", opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: animate ? 0.1 + i * 0.06 : 0 }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

function Statement() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-28 text-center md:px-10 md:pb-40">
      <ScrollReveal>
        <h3 className="text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
          {intro.name.prefix}{" "}
          {/* Same treatment as the hero's highlighted words */}
          <span className="text-accent italic" style={{ fontFamily: "var(--font-accent-serif)" }}>
            {intro.name.highlight}
          </span>
          {intro.name.suffix}
        </h3>
      </ScrollReveal>
      <div className="mt-10 flex flex-col gap-7 md:mt-14 md:gap-9">
        {intro.paragraphs.map((paragraph, i) => (
          <ScrollReveal key={i}>
            <p className="text-lg leading-relaxed text-muted md:text-2xl md:leading-[1.5]">
              {paragraph}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

function Photo({ className, sizes }: { className?: string; sizes: string }) {
  return (
    <Image
      src={intro.photo.src}
      alt={intro.photo.alt}
      fill
      sizes={sizes}
      // In view right behind the hero on load, so don't wait for lazy loading.
      loading="eager"
      className={cn("object-cover object-[50%_35%] grayscale", className)}
    />
  );
}

function ScrollToScale() {
  const revealed = useShutterRevealed();
  const trackRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Geometry>({ ready: false, scale0: 0.3, inset0: 0, x0: 0, y0: 0, rise: 0 });

  // Raw progress drives the rise (it must match the pin release exactly);
  // a spring-smoothed copy drives the growth for a softer feel.
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.5 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0.3);
  const clipPath = useMotionValue("inset(0px 0px 0px 0px)");
  const photoOpacity = useMotionValue(0);
  const titleOpacity = useMotionValue(1);
  const titleY = useMotionValue(0);

  const render = useCallback(() => {
    const g = geo.current;
    if (!g.ready) return;
    const ps = smooth.get();
    const pr = raw.get();

    const grow = easeInOut(clamp01((ps - 0.06) / 0.56));
    const open = easeOut(clamp01((ps - 0.06) / 0.5));
    const rise = clamp01((pr - RISE_FROM) / (1 - RISE_FROM));
    const fade = clamp01((ps - 0.08) / 0.24);

    scale.set(g.scale0 + (1 - g.scale0) * grow);
    x.set(g.x0 * (1 - grow));
    // y = -(L/2)·t² ends with slope -1: the same speed as the page.
    y.set(g.y0 * (1 - grow) - (g.rise / 2) * rise * rise);
    const inset = g.inset0 * (1 - open);
    clipPath.set(`inset(0px ${inset}px 0px ${inset}px)`);
    titleOpacity.set(1 - fade);
    titleY.set(-40 * easeOut(fade));
  }, [smooth, raw, scale, x, y, clipPath, titleOpacity, titleY]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const photo = photoRef.current;
    if (!track || !photo) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const desktop = vw >= 768;
    const w = photo.offsetWidth;
    const h = photo.offsetHeight;
    const pin = Math.max(1, track.offsetHeight - vh);

    if (desktop) {
      const container = Math.min(1152, vw - 80);
      const side = Math.min(280, Math.max(200, vw * 0.18));
      geo.current = {
        ready: true,
        scale0: side / h,
        inset0: (w - h) / 2,
        x0: container / 2 - side / 2,
        y0: 0,
        rise: pin * (1 - RISE_FROM),
      };
    } else {
      // Mobile: the square sits below the title. Its place comes from where the
      // title actually ends (it wraps differently per width), and it shrinks if
      // needed so it never overlaps the title or leaves the screen.
      const stage = photo.offsetParent instanceof HTMLElement ? photo.offsetParent.offsetHeight : vh;
      const title = titleRef.current;
      const titleBottom = title ? title.offsetTop + title.offsetHeight : stage * 0.45;
      const top = titleBottom + 32;
      const side = Math.max(96, Math.min(vw * 0.46, stage - 32 - top));
      geo.current = {
        ready: true,
        scale0: side / h,
        inset0: (w - h) / 2,
        x0: -(vw / 2 - 24) + side / 2,
        y0: top + side / 2 - stage / 2,
        rise: pin * (1 - RISE_FROM),
      };
    }
    photoOpacity.set(1);
    render();
  }, [render, photoOpacity]);

  const { scrollY } = useScroll();
  const track = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const pin = el.offsetHeight - window.innerHeight;
    raw.set(clamp01(-el.getBoundingClientRect().top / Math.max(1, pin)));
  }, [raw]);

  useMotionValueEvent(scrollY, "change", track);
  useMotionValueEvent(raw, "change", render);
  useMotionValueEvent(smooth, "change", render);

  useEffect(() => {
    measure();
    track();
    // The title's line breaks depend on the web font: measure again once loaded.
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    window.addEventListener("resize", measure);
    return () => {
      alive = false;
      window.removeEventListener("resize", measure);
    };
  }, [measure, track]);

  return (
    <div ref={trackRef} className="relative h-[240vh] md:h-[280vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Title: left on desktop, at the top on mobile */}
        <motion.div
          ref={titleRef}
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute inset-x-0 top-[16svh] mx-auto max-w-6xl px-6 md:top-1/2 md:-translate-y-1/2 md:px-10"
        >
          <div className="max-w-md md:max-w-[min(68%,46rem)]">
            <Title animate={revealed} />
          </div>
        </motion.div>

        {/* Photo frame at its final size, centred; transforms do the rest */}
        <motion.div
          ref={photoRef}
          style={{ x, y, scale, clipPath, opacity: photoOpacity }}
          className={cn(
            "absolute left-[calc(50%-var(--w)/2)] top-[calc(50%-var(--w)/3)] h-[calc(var(--w)*2/3)] w-[var(--w)] overflow-hidden will-change-transform",
            "[--w:88vw] md:[--w:min(50vw,105svh)]"
          )}
        >
          <Photo sizes="(min-width: 768px) 50vw, 88vw" />
        </motion.div>
      </div>
    </div>
  );
}

/** Reduced motion: the same content, laid out statically. */
function StaticIntro() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-28 md:px-10 md:py-36">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="max-w-md md:max-w-xl">
          <Title animate />
        </div>
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Photo sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      </div>
    </div>
  );
}

/** `id={null}` drops the anchor, for when a wrapper places it instead. */
export function Intro({ id = "sobre-mi" }: { id?: string | null }) {
  const reduce = useSafeReducedMotion();

  return (
    <Section id={id ?? undefined} theme="light" className="relative">
      {reduce ? <StaticIntro /> : <ScrollToScale />}
      <Statement />
    </Section>
  );
}
