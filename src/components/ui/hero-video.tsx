"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useShutterPhase } from "@/components/ui/slat-shutter";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { useContent } from "@/components/locale-provider";

// Layer behind the hero content (the section is `isolate`), never catching
// clicks or touches.
const LAYER = "pointer-events-none absolute inset-0 -z-5 overflow-hidden";

const POSTER = "/hero/fondo-home.jpg";
// A lighter encode for phones; the full one from 768px.
const SOURCES = { small: "/hero/fondo-home-640.mp4", large: "/hero/fondo-home.mp4" };

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

// The one playing <video> (and its poster image, until the video has a
// frame), so the shutter slats can show what the hero shows.
let source: HTMLVideoElement | null = null;
let posterSource: HTMLImageElement | null = null;

/**
 * The hero's background: a still frame (the poster, served as an optimised
 * image with high priority, so it paints first) and the looping video over
 * it. The video only starts downloading once the page has loaded, in a light
 * version on phones, and fades in once it plays. It doesn't autoplay when
 * the visitor prefers reduced motion, and a small button lets anyone pause
 * or play it (WCAG 2.2.2).
 */
export function HeroVideo() {
  // Once the shutter has fully opened, the hero is hidden: pause it.
  const hidden = useShutterPhase() === "done";
  const reduce = useSafeReducedMotion();
  const { ui } = useContent();
  const ref = useRef<HTMLVideoElement | null>(null);
  const setRef = useCallback((video: HTMLVideoElement | null) => {
    ref.current = video;
    source = video;
  }, []);
  const setPoster = useCallback((img: HTMLImageElement | null) => {
    posterSource = img;
  }, []);

  const [loaded, setLoaded] = useState(false); // src set, after page load
  const [playing, setPlaying] = useState(false);
  // null: no choice made yet (plays unless reduced motion is preferred).
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduce;

  // Start downloading the video only once the page has finished loading.
  useEffect(() => {
    const start = () => {
      const video = ref.current;
      if (!video || video.src) return;
      video.src = window.matchMedia("(min-width: 768px)").matches ? SOURCES.large : SOURCES.small;
      setLoaded(true);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !loaded) return;
    if (hidden || paused) video.pause();
    else video.play().catch(() => {}); // autoplay refused: the poster stays
  }, [hidden, paused, loaded]);

  return (
    <>
      <div aria-hidden className={LAYER}>
        <Image
          ref={setPoster}
          src={POSTER}
          alt=""
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover"
        />
        <video
          ref={setRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: playing ? 1 : 0 }}
          onPlaying={() => setPlaying(true)}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
        />
        <Shade />
      </div>

      {/* Pause / play the background video */}
      <button
        type="button"
        data-cursor="link"
        onClick={() => setUserPaused(!paused)}
        aria-label={paused ? ui.playVideo : ui.pauseVideo}
        className="absolute bottom-6 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-fg-dark/70 transition-colors hover:border-white/60 hover:text-fg-dark md:left-10"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          {paused ? <path d="M8 5.5v13l11-6.5z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
        </svg>
      </button>
    </>
  );
}

/**
 * Background of the hero copies inside the shutter slats. Instead of playing
 * one more video per slat, it copies the live video's current frame (or the
 * poster, if the video hasn't got one yet), and only while the slats move.
 */
export function HeroVideoMirror() {
  const moving = useShutterPhase() === "moving";
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    const copy = () => {
      const canvas = ref.current;
      const video = source && source.videoWidth > 0 && source.readyState >= 2 ? source : null;
      const img = !video && posterSource && posterSource.complete && posterSource.naturalWidth > 0 ? posterSource : null;
      const frameSource = video ?? img;
      if (canvas && frameSource) {
        const w = video ? video.videoWidth : img!.naturalWidth;
        const h = video ? video.videoHeight : img!.naturalHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        canvas.getContext("2d")?.drawImage(frameSource, 0, 0, w, h);
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
