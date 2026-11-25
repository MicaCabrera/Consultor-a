"use client";

import { useCallback, useEffect, useRef } from "react";
import { useShutterPhase } from "@/components/ui/slat-shutter";

// Layer behind the hero content (the section is `isolate`), never catching
// clicks or touches.
const LAYER = "pointer-events-none absolute inset-0 -z-5 overflow-hidden";

// Darkening over the footage so the white title and text stay readable:
// an even tint plus a heavier fade at the bottom into the next section.
function Shade() {
  return (
    <>
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-bg-dark" />
    </>
  );
}

// The one playing <video>, so the shutter slats can show its current frame.
let source: HTMLVideoElement | null = null;

/** The hero's background video: muted, looping, inline (also on iOS). */
export function HeroVideo() {
  // Once the shutter has fully opened, the hero is hidden: pause it.
  const hidden = useShutterPhase() === "done";
  const ref = useRef<HTMLVideoElement | null>(null);
  const setRef = useCallback((video: HTMLVideoElement | null) => {
    ref.current = video;
    source = video;
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (hidden) video.pause();
    else video.play().catch(() => {}); // autoplay refused: the poster stays
  }, [hidden]);

  return (
    <div aria-hidden className={LAYER}>
      <video
        ref={setRef}
        className="h-full w-full object-cover"
        src="/hero/fondo-home.mp4"
        poster="/hero/fondo-home.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <Shade />
    </div>
  );
}

/**
 * Background of the hero copies inside the shutter slats. Instead of playing
 * one more video per slat, it copies the live video's current frame, and only
 * while the slats are moving.
 */
export function HeroVideoMirror() {
  const moving = useShutterPhase() === "moving";
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    const copy = () => {
      const canvas = ref.current;
      if (canvas && source && source.videoWidth > 0) {
        if (canvas.width !== source.videoWidth || canvas.height !== source.videoHeight) {
          canvas.width = source.videoWidth;
          canvas.height = source.videoHeight;
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
      {/* object-cover crops the frame like the video; own compositing layer
          so Chrome repaints it inside the transformed slat. */}
      <canvas ref={ref} className="block h-full w-full object-cover will-change-transform" />
      <Shade />
    </div>
  );
}
