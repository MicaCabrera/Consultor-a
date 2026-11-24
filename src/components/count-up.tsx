"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

/**
 * A number that counts up from 0 to `to` every time it scrolls into view,
 * easing out so it slows down as it lands; it resets once it leaves the
 * screen. With reduced motion it simply shows the final number. The final
 * value is always in the accessible text, so screen readers never hear the
 * in-between numbers.
 */
export function CountUp({ to, duration = 1.8, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useSafeReducedMotion();
  const value = useMotionValue(0);
  const shown = useTransform(value, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      value.set(to);
      return;
    }
    if (!inView) {
      value.set(0); // off screen: ready to count again next time
      return;
    }
    const controls = animate(value, to, { duration, delay: 0.25, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, to, duration, value]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{to}</span>
      {/* Width reserved for the final number, so nothing shifts while counting */}
      <span aria-hidden className="relative inline-block [font-variant-numeric:tabular-nums]">
        <span className="invisible">{to}</span>
        <motion.span className="absolute inset-0 text-right">{shown}</motion.span>
      </span>
    </span>
  );
}
