"use client";

import { useEffect } from "react";

/**
 * Touch screens: one swipe plays a whole transition.
 *
 * The landing has scroll-driven transitions (the hero shutter, «Sobre mí»'s
 * pinned photo, the cover into «Especialidades» and the two curtains). With
 * a finger, a swipe used to leave them stopped halfway. Here, when a swipe
 * (including its momentum) comes to rest inside one of them, the page glides
 * on to the end of that transition in the direction of the swipe — or back
 * to its start if the swipe went up — so each swipe lands on a whole section.
 *
 * Only on touch devices (mouse and trackpad scrolling is unchanged), never
 * with reduced motion, and any new touch stops the glide at once.
 */

type Zone = [start: number, end: number];

const EDGE = 6; // px of tolerance at a zone's ends
const QUIET_MS = 120; // how long the page must be still before completing

/** Scroll ranges where a transition is playing, measured from the page. */
function zones(): Zone[] {
  const vh = window.innerHeight;
  const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  const list: Zone[] = [];

  // Hero → «Sobre mí» shutter: from the top to where «Sobre mí» is revealed.
  const about = document.getElementById("sobre-mi");
  const revealed = about ? top(about) : 0;
  if (about) list.push([0, revealed]);

  // «Sobre mí»: the pinned photo (and, from 1024px, the text coming in). It
  // sits inside the shutter while that plays, so its page position isn't
  // measurable then: it starts scrolling where the shutter ends.
  const track = document.querySelector<HTMLElement>('[class*="h-[240vh]"]');
  if (about && track) list.push([revealed, revealed + track.offsetHeight - vh]);

  // «Especialidades» rising over «Sobre mí».
  const specialties = document.getElementById("especialidades");
  if (specialties) list.push([top(specialties) - vh, top(specialties)]);

  // «Consultoría» uncovering «¿Para quién es?».
  const cover = document.querySelector<HTMLElement>(".curtain-cover");
  if (cover) {
    const end = top(cover) + cover.offsetHeight;
    list.push([end - vh, end]);
  }

  // «¿Para quién es?» uncovering «Cómo funciona».
  const clip = document.querySelector(".clip-curtain");
  if (clip) list.push([top(clip) - vh, top(clip)]);

  return list.filter(([s, e]) => e - s > EDGE * 2);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function SwipeTransitions() {
  useEffect(() => {
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let touching = false;
    let startY = window.scrollY;
    let lastY = window.scrollY;
    let lastDir = 0;
    let timer = 0;
    let frame = 0;
    let gliding = false;

    const stopGlide = () => {
      if (!gliding) return;
      cancelAnimationFrame(frame);
      gliding = false;
      document.documentElement.style.scrollBehavior = "";
    };

    const glideTo = (target: number) => {
      const from = window.scrollY;
      const distance = target - from;
      if (Math.abs(distance) < 2) return;
      // About 0.75 s per screen, within bounds, so short and long ones both feel natural.
      const duration = Math.min(1400, Math.max(450, (Math.abs(distance) / window.innerHeight) * 750));
      const t0 = performance.now();
      gliding = true;
      // The site scrolls smoothly by CSS; the glide sets each frame itself.
      document.documentElement.style.scrollBehavior = "auto";
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, from + distance * ease(t));
        if (t < 1) frame = requestAnimationFrame(step);
        else {
          gliding = false;
          document.documentElement.style.scrollBehavior = "";
          startY = lastY = window.scrollY;
        }
      };
      frame = requestAnimationFrame(step);
    };

    const complete = () => {
      if (touching || gliding || !touch.matches || reduced.matches) return;
      const y = window.scrollY;
      const zone = zones().find(([s, e]) => y > s + EDGE && y < e - EDGE);
      if (!zone) {
        startY = y;
        return;
      }
      const dir = Math.sign(y - startY) || lastDir;
      glideTo(dir < 0 ? zone[0] : zone[1]);
    };

    const onScroll = () => {
      if (gliding) return;
      const y = window.scrollY;
      if (y !== lastY) lastDir = Math.sign(y - lastY);
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(complete, QUIET_MS);
    };
    const onTouchStart = () => {
      touching = true;
      stopGlide();
      window.clearTimeout(timer);
      startY = lastY = window.scrollY;
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(complete, QUIET_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      stopGlide();
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return null;
}
