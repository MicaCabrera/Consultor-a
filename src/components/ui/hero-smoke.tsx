"use client";

import { useCallback, useEffect, useRef } from "react";
import { GradFlow, type GradientConfigInput } from "gradflow";
import { useShutterPhase } from "@/components/ui/slat-shutter";

const SMOKE: GradientConfigInput = {
  type: "smoke",
  color1: "#30e6b0",
  color2: "#064432",
  color3: "#011610",
  speed: 0.7,
  scale: 1.8,
  noise: 0.16,
};

// Layer classes: behind the hero content (the section is `isolate`), never
// catching clicks or touches. The library tracks the pointer on the window, so
// `interactive` keeps working through `pointer-events: none`.
// The 30% opacity lets the hero's dark background through, for a subdued look.
const LAYER = "pointer-events-none absolute inset-0 -z-5 overflow-hidden opacity-30";

// The one live GradFlow canvas, so the shutter slats can show it too.
let source: HTMLCanvasElement | null = null;

/** The hero's animated smoke background: the single GradFlow instance. */
export function HeroSmoke() {
  // Once the shutter has fully opened, the hero is hidden: freeze it.
  const hidden = useShutterPhase() === "done";
  const setSource = useCallback((canvas: HTMLCanvasElement | null) => {
    source = canvas;
  }, []);

  return (
    <div aria-hidden className={LAYER}>
      {/* preserveDrawingBuffer: lets the slats read the current frame. */}
      <GradFlow ref={setSource} config={SMOKE} interactive paused={hidden} preserveDrawingBuffer />
    </div>
  );
}

/**
 * Background of the hero copies inside the shutter slats. Instead of starting
 * another WebGL context per slat, it copies the live GradFlow frame, and only
 * while the slats are moving.
 */
export function HeroSmokeMirror() {
  const moving = useShutterPhase() === "moving";
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    const copy = () => {
      const canvas = ref.current;
      if (canvas && source && source.width > 0) {
        if (canvas.width !== source.width || canvas.height !== source.height) {
          canvas.width = source.width;
          canvas.height = source.height;
        }
        canvas.getContext("2d")?.drawImage(source, 0, 0);
      }
      frame = requestAnimationFrame(copy);
    };
    copy();
    return () => cancelAnimationFrame(frame);
  }, [moving]);

  return (
    <div aria-hidden className={LAYER}>
      {/* Own compositing layer: without it Chrome keeps showing the blank
          canvas inside the transformed slat instead of the copied frames. */}
      <canvas ref={ref} className="block h-full w-full will-change-transform" />
    </div>
  );
}
