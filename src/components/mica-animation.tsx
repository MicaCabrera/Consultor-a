"use client";

import { useEffect, useRef } from "react";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Avi's launcher animation: "Glow IA Animation" (public/mica-glow.json,
 * extracted from the project's .lottie file, with its glow images recoloured
 * to the site green and embedded). Drawn by lottie-web's light build, loaded
 * lazily so it never weighs on the first page load. With reduced motion it
 * shows a single still frame.
 */
export function MicaAnimation({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      const [{ default: lottie }, data] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        fetch("/mica-glow.json").then((r) => r.json()),
      ]);
      if (cancelled || !ref.current) return;
      const anim = lottie.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: !reduce,
        autoplay: !reduce,
        animationData: data,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      anim.setSubframe(false);
      if (reduce) anim.goToAndStop(0, true);
      destroy = () => anim.destroy();
    })().catch(() => {
      // Decorative: if it fails to load, the button still works.
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [reduce]);

  return <div ref={ref} aria-hidden className={className} />;
}
