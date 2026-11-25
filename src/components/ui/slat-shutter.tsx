"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  cubicBezier,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsClient, useSafeReducedMotion } from "@/lib/use-reduced-motion";

const ease = cubicBezier(0.42, 0, 0, 1);

// The first (centre) slats start moving at 0.12; switch to them just before.
const SLATS_START = 0.1;
// Every slat has finished moving once progress passes this point
// (latest start 0.28 + duration 0.42).
const SLATS_DONE = 0.72;
// Progress after which the revealed content counts as "the one on screen".
const REVEALED_AT = 0.42;

export interface SlatShutterProps {
  /** Interactive cover, shown as-is while the page is at rest on it. */
  cover: React.ReactNode;
  /** Visual copy of the cover, rendered inside every slat (no ids, no h1 needed). */
  slice: React.ReactNode;
  /** Content revealed behind the slats. It is pinned during the reveal. */
  children: React.ReactNode;
  /** Slats on wide screens (≥768px). */
  slats?: number;
  /** Slats on narrow screens. */
  slatsMobile?: number;
  /** Scroll distance the reveal takes, in viewport heights. */
  length?: number;
  /** Id for an anchor placed where the reveal ends, so links land on the revealed content. */
  anchorId?: string;
  /**
   * Called while the shutter sits under the top of the viewport:
   * `false` before the reveal, `true` after it, `null` once the shutter is off screen.
   */
  onRevealChange?: (revealed: boolean | null) => void;
  className?: string;
}

// Lets the revealed content time its own entrance to the moment it is actually
// seen. `true` outside a shutter, so components work the same anywhere.
const RevealedContext = React.createContext(true);

// Which layer the shutter is showing, for content that needs to know (e.g. to
// pause work while hidden). "cover" outside a shutter.
type ShutterPhase = "cover" | "moving" | "done";
const PhaseContext = React.createContext<ShutterPhase>("cover");

export function useShutterPhase() {
  return React.useContext(PhaseContext);
}

/** `true` once the slats have opened far enough to show the content behind them. */
export function useShutterRevealed() {
  return React.useContext(RevealedContext);
}

function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true
  );
}

function Slat({
  index,
  count,
  progress,
  children,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
  children: React.ReactNode;
}) {
  // Open from the centre outwards, alternating up and down.
  const mid = (count - 1) / 2;
  const order = Math.abs(index - mid) / Math.max(mid, 1);
  const start = 0.12 + order * 0.16;
  const end = start + 0.42;
  const dir = index % 2 === 0 ? -1 : 1;
  const y = useTransform(progress, [start, end], ["0%", `${dir * 104}%`], { ease });
  const scaleX = useTransform(progress, [start, end], [1, 0.82], { ease });

  // Each slat is a full-size copy clipped to its strip, overlapping its
  // neighbours by half a pixel so no seam can ever show between them.
  const left = (index * 100) / count;
  const right = 100 - ((index + 1) * 100) / count;
  const clipPath = `inset(0 calc(${right}% - 0.5px) 0 calc(${left}% - 0.5px))`;
  const transformOrigin = `${left + 50 / count}% 50%`;

  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{ y, scaleX, clipPath, transformOrigin }}
    >
      {children}
    </motion.div>
  );
}

export function SlatShutter({
  cover,
  slice,
  children,
  slats = 8,
  slatsMobile = 6,
  length = 150,
  anchorId,
  onRevealChange,
  className,
}: SlatShutterProps) {
  const isClient = useIsClient();
  // Hydrates the animated tree first, then switches if motion is reduced.
  const reduce = useSafeReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const count = wide ? slats : slatsMobile;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const probeRef = React.useRef<HTMLDivElement>(null);

  // The probe is `length` viewports taller than the screen, so progress runs
  // 0 → 1 over exactly the pinned part of the scroll.
  const { scrollYProgress } = useScroll({ target: probeRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  const revealScale = useTransform(progress, [0.1, 0.85], [1.06, 1], { ease });
  const shade = useTransform(progress, [0.05, 0.6], [0.35, 0]);

  // Which layer is live. Only changes at the thresholds, so few renders.
  // No slat moves before SLATS_START, so the real cover stays up until then:
  // scrolling back to the top always returns to the untouched cover, even
  // while the spring is still settling.
  const [phase, setPhase] = React.useState<ShutterPhase>("cover");
  // Latches: once revealed, entrances don't replay when scrolling back up.
  const [revealed, setRevealed] = React.useState(false);

  // The slats are 6–8 static copies of the cover: build them only when the
  // visitor starts scrolling (the slats start moving a little later), so
  // they never weigh on the first load.
  const [slatsReady, setSlatsReady] = React.useState(false);
  React.useEffect(() => {
    if (slatsReady) return;
    const ready = () => setSlatsReady(true);
    if (window.scrollY > 0) ready();
    window.addEventListener("scroll", ready, { once: true, passive: true });
    return () => window.removeEventListener("scroll", ready);
  }, [slatsReady]);
  useMotionValueEvent(progress, "change", (p) => {
    setPhase(p < SLATS_START ? "cover" : p > SLATS_DONE ? "done" : "moving");
    if (p > 0.5) setRevealed(true);
  });

  const { scrollY } = useScroll();
  const report = React.useCallback(() => {
    if (!onRevealChange) return;
    const el = trackRef.current;
    // Not mounted (e.g. reduced motion): release the nav theme.
    if (!el) return onRevealChange(null);
    const r = el.getBoundingClientRect();
    const band = window.innerHeight * 0.15;
    const over = r.top <= band && r.bottom >= band;
    onRevealChange(over ? scrollYProgress.get() > REVEALED_AT : null);
  }, [onRevealChange, scrollYProgress]);
  useMotionValueEvent(scrollY, "change", report);
  React.useEffect(() => {
    report();
    return () => onRevealChange?.(null);
    // `reduce` swaps the markup, so re-check once it changes.
  }, [report, onRevealChange, reduce]);

  if (reduce) {
    return (
      <div className={className}>
        {cover}
        <div id={anchorId}>{children}</div>
      </div>
    );
  }

  return (
    <div ref={trackRef} className={cn("relative", className)}>
      <div
        ref={probeRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: `${length + 100}vh` }}
      />
      {anchorId ? (
        <div
          id={anchorId}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${length}vh` }}
        />
      ) : null}

      <PhaseContext.Provider value={phase}>
      <div className="sticky top-0 overflow-x-clip">
        {/* The real, interactive cover while at rest. First in the page order
            (hero, then «Sobre mí»); absolutely placed, so the layout is the
            same as if it came last. */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-20 h-svh overflow-hidden",
            phase !== "cover" && "invisible"
          )}
        >
          {cover}
        </div>

        {/* Revealed content, pinned while the slats open */}
        <motion.div
          className="relative origin-top"
          style={{ scale: revealScale }}
          inert={phase === "cover"}
        >
          <RevealedContext.Provider value={revealed}>{children}</RevealedContext.Provider>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: shade }}
          />
        </motion.div>

        {/* Slats: copies of the cover, each clipped to its own strip */}
        <div
          aria-hidden
          inert
          className={cn(
            "absolute inset-x-0 top-0 z-10 h-svh overflow-hidden",
            phase !== "moving" && "invisible"
          )}
        >
          {isClient && slatsReady
            ? Array.from({ length: count }, (_, i) => (
                <Slat key={`${count}-${i}`} index={i} count={count} progress={progress}>
                  {slice}
                </Slat>
              ))
            : null}
        </div>
      </div>
      </PhaseContext.Provider>

      {/* Scroll room for the reveal */}
      <div aria-hidden style={{ height: `${length}vh` }} />
    </div>
  );
}

export default SlatShutter;
