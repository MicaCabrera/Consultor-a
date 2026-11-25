"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
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
 *
 * Below 1024px (phones, portrait tablets) the photo then rises:
 *
 *   0.72–1.00  photo starts rising, accelerating until it moves exactly at
 *              scroll speed when the pin releases, so the hand-off to normal
 *              scrolling has no seam
 *
 * and the three paragraphs follow the track in normal flow.
 *
 * From 1024px the track is longer and, instead of rising, right after the
 * growth (same scroll distances as above, in vh) the photo slides to the
 * left half while the text block comes in from the right into the right half. The pin releases once the text is in place, so from
 * then on both simply scroll away with the page. See WIDE below.
 *
 * Cover: once that ends (the photo gone on narrow screens, the text landed on
 * wide ones), the last screen stays still while «Especialidades» rises over
 * it at scroll speed. The pinned part gets one extra screen of room that
 * overflows the section, and the section clips it (see .intro-cover in
 * globals.css), so nothing shows through «Especialidades», which is
 * see-through. The page height doesn't change.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const RISE_FROM = 0.72;

/**
 * Wide screens (≥1024px), in vh of scroll from the start of the pin. The first
 * three match the narrow timing at its 180vh pin (0.06, 0.08 and 0.62 of it),
 * so the growth looks exactly the same.
 */
const WIDE = {
  growFrom: 10.8,
  growLen: 100.8, // grow ends at 111.6
  openLen: 90,
  fadeFrom: 14.4,
  fadeLen: 43.2,
  holdLen: 0, // no pause: the move follows the growth straight away
  moveLen: 80, // photo to the left half, text in from the right
  settleLen: 15, // still pinned a little longer, so the smoothing can land
  coverDelay: 30, // and a little more, before «Especialidades» starts rising
  pin: 236.6, // = 111.6 + 0 + 80 + 15 + 30
};
const WIDE_QUERY = "(min-width: 1024px)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// Gentle start and end with no sharp speed peak in the middle.
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

type Geometry = {
  ready: boolean;
  scale0: number; // initial scale of the photo frame
  inset0: number; // initial side crop (px, unscaled) that makes it square
  x0: number; // initial offset from the viewport centre
  y0: number;
  rise: number; // scroll length (px) of the rise segment
  moveX: number; // wide: photo shift that puts it in the left half
  textFrom: number; // wide: text block start offset, just past the right edge
};

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

/** The three paragraphs, shown complete. */
function StatementText() {
  return (
    <div className="flex max-w-xl flex-col gap-5 text-base leading-relaxed text-fg md:gap-6 md:text-lg">
      {intro.paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

/** Below 1024px: the text in normal flow under the photo, as before. */
function Statement() {
  // Its own height, so it can stick with its bottom on the bottom of the
  // screen (CSS alone can't place a sticky element by its bottom edge here).
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.style.setProperty("--statement-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // One screen taller than what it adds to the page (clipped by the
    // section), so the block has room to stay put while it is covered.
    <div className="intro-cover-extend-auto">
      {/* Pulled up into the end of the pinned track, which otherwise leaves a
          tall empty gap below the photo on its way out. Left-aligned on the
          same column as the rest of the site (max-w-6xl). */}
      <div
        ref={ref}
        className="intro-statement relative mx-auto -mt-[25svh] max-w-6xl px-6 pb-28 text-left md:px-10 md:pb-40"
      >
        <div className="max-w-3xl">
          <StatementText />
        </div>
      </div>
      <div aria-hidden className="intro-cover-spacer" />
    </div>
  );
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
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

function ScrollToScale({ wide }: { wide: boolean }) {
  const revealed = useShutterRevealed();
  const trackRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Geometry>({ ready: false, scale0: 0.3, inset0: 0, x0: 0, y0: 0, rise: 0, moveX: 0, textFrom: 0 });

  // Raw progress drives the rise (it must match the pin release exactly);
  // a spring-smoothed copy drives the growth for a softer feel.
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.5 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Full size until measured: at load the photo is behind the hero cover, and
  // starting big means its first paint is already its largest (LCP).
  const scale = useMotionValue(1);
  const clipPath = useMotionValue("inset(0px 0px 0px 0px)");
  // Visible from the first paint: at load it sits behind the hero cover, so
  // there is nothing to hide while the script measures it.
  const photoOpacity = useMotionValue(1);
  const titleOpacity = useMotionValue(1);
  const titleY = useMotionValue(0);
  // Wide only: the text block coming in.
  // Off screen until measured, so it never flashes in its final place.
  const textX = useMotionValue(4000);

  const render = useCallback(() => {
    const g = geo.current;
    if (!g.ready) return;
    const ps = smooth.get();
    const pr = raw.get();

    if (wide) {
      // Positions in vh of scroll, read from the spring-smoothed progress so
      // wheel steps glide instead of jumping. The pin lasts a bit past the end
      // of the move (settleLen), so the spring settles before it releases.
      const sv = ps * WIDE.pin;
      const grow = easeInOut(clamp01((sv - WIDE.growFrom) / WIDE.growLen));
      const open = easeOut(clamp01((sv - WIDE.growFrom) / WIDE.openLen));
      const fade = clamp01((sv - WIDE.fadeFrom) / WIDE.fadeLen);
      const move = easeInOutSine(clamp01((sv - (WIDE.growFrom + WIDE.growLen + WIDE.holdLen)) / WIDE.moveLen));

      scale.set(g.scale0 + (1 - g.scale0) * grow);
      x.set(g.x0 * (1 - grow) + g.moveX * move);
      y.set(g.y0 * (1 - grow));
      const inset = g.inset0 * (1 - open);
      clipPath.set(`inset(0px ${inset}px 0px ${inset}px)`);
      titleOpacity.set(1 - fade);
      titleY.set(-40 * easeOut(fade));
      textX.set(g.textFrom * (1 - move));
      return;
    }

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
  }, [wide, smooth, raw, scale, x, y, clipPath, titleOpacity, titleY, textX]);

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
        // Right edge on the centre line: the photo fills the left half.
        moveX: -w / 2,
        // Far enough right that the block starts fully off screen.
        textFrom: textRef.current ? vw - textRef.current.offsetLeft : vw,
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
        moveX: 0,
        textFrom: 0,
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
    <div
      ref={trackRef}
      className="relative h-[240vh] md:h-[280vh]"
      // Wide: room for the hold and the move as well (see WIDE).
      style={wide ? { height: `${WIDE.pin + 100}vh` } : undefined}
    >
      {/* Wide: one screen taller than the track (clipped by the section), so
          the stage stays put while «Especialidades» covers it. */}
      <div className={wide ? "intro-cover-extend" : "h-full"}>
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

        {/* Wide: the text block, from the centre line (plus a gap) to the
            right edge of the site column, coming in from the right. */}
        {wide ? (
          <motion.div
            ref={textRef}
            style={{ x: textX }}
            className="absolute top-1/2 right-[max(2.5rem,calc((100%-72rem)/2))] left-[calc(50%+4rem)] -translate-y-1/2 will-change-transform"
          >
            <StatementText />
          </motion.div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

/** Reduced motion: the same content, laid out statically. Wide screens show
 *  the end state straight away: the photo on the left, the text on the right. */
function StaticIntro({ wide }: { wide: boolean }) {
  if (wide) {
    return (
      <div className="mx-auto max-w-6xl px-10 py-36">
        <div className="max-w-xl">
          <Title animate />
        </div>
        <div className="mt-20 grid grid-cols-2 items-center gap-16">
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <Photo sizes="50vw" />
          </div>
          <div>
            <StatementText />
          </div>
        </div>
      </div>
    );
  }
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

/** Reduced motion below 1024px: the text under the photo, no effects. */
function StaticStatement() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-28 md:px-10 md:pb-40">
      <div className="max-w-3xl">
        <StatementText />
      </div>
    </div>
  );
}

/** `id={null}` drops the anchor, for when a wrapper places it instead. */
export function Intro({ id = "sobre-mi" }: { id?: string | null }) {
  const reduce = useSafeReducedMotion();
  // Side by side from 1024px; below that the text stays under the photo.
  const wide = useMediaQuery(WIDE_QUERY);

  return (
    <Section id={id ?? undefined} theme="light" className={cn("relative", !reduce && "intro-cover")}>
      {reduce ? <StaticIntro wide={wide} /> : <ScrollToScale wide={wide} />}
      {wide ? null : reduce ? <StaticStatement /> : <Statement />}
    </Section>
  );
}
