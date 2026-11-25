"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavThemeOverride } from "@/components/section-theme";

/*
 * Scroll-driven curtain between two sections: `cover` (A) scrolls away at
 * normal speed while `revealed` (B) stays still behind it, uncovered from the
 * bottom up; once A is gone, B scrolls on normally. Pure CSS (see .curtain-*
 * in globals.css):
 *
 *   - A sits above (z-index) with its opaque background, at least one screen
 *     tall (100svh), so B never peeks out above it.
 *   - B is `position: sticky; top: 0` and pulled up by one screen
 *     (margin-top: -100svh): it starts hidden under A's last screen.
 *   - A spacer of one screen after B gives the sticky room to hold B still
 *     while A's last screen leaves, and releases it exactly when A is gone.
 *     The -100svh and +100svh cancel out: the page height doesn't change.
 *
 * The scroll listener here doesn't move anything. It only tells B's in-view
 * animations how much of each element is really uncovered (an element under
 * A counts as "in view" for the browser), and tells the nav which of the
 * two is really under it (the browser sees both there while B is stuck).
 */

type Cover = { bottom: () => number; subscribe: (fn: () => void) => () => void };
const CoverContext = createContext<Cover | null>(null);

/**
 * `true` once at least `amount` of the element is uncovered and on screen.
 * Outside a curtain it is always `true`, so callers work the same anywhere.
 */
export function useUncovered(ref: React.RefObject<Element | null>, amount = 0) {
  const cover = useContext(CoverContext);
  const [uncovered, setUncovered] = useState(false);

  useEffect(() => {
    if (!cover) return;
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = Math.max(r.top, cover.bottom(), 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      const shown = r.height > 0 ? Math.max(0, bottom - top) / r.height : 0;
      // Enough of it on view, or as much as can ever fit on screen.
      const needed = Math.min(amount, window.innerHeight / Math.max(r.height, 1));
      setUncovered((prev) => prev || shown >= Math.max(needed, 0.0001));
    };
    check();
    return cover.subscribe(check);
  }, [cover, ref, amount]);

  return cover ? uncovered : true;
}

export function CurtainReveal({ cover, revealed }: { cover: React.ReactNode; revealed: React.ReactNode }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  const setNavTheme = useNavThemeOverride();

  const listeners = useRef(new Set<() => void>());
  const bottom = useCallback(() => coverRef.current?.getBoundingClientRect().bottom ?? 0, []);
  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);
  const [gate] = useState<Cover>(() => ({ bottom, subscribe }));

  useEffect(() => {
    const onScroll = () => {
      listeners.current.forEach((fn) => fn());
      // The nav reads the section in a band near the top of the screen. While
      // B is stuck there behind A, the browser sees both in that band, so say
      // which one is really on top: A while it covers the band, then B.
      const a = coverRef.current;
      const b = revealedRef.current;
      if (!a || !b) return;
      const band = window.innerHeight * 0.15;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const themeOf = (el: HTMLElement) =>
        (el.querySelector("section")?.getAttribute("data-theme") as "dark" | "light" | null) ?? null;
      if (ra.top <= band && ra.bottom >= band) setNavTheme(themeOf(a));
      else if (rb.top <= band && rb.bottom >= band) setNavTheme(themeOf(b));
      else setNavTheme(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setNavTheme(null);
    };
  }, [setNavTheme]);

  return (
    <div className="curtain">
      <div ref={coverRef} className="curtain-cover">
        {cover}
      </div>
      <div ref={revealedRef} className="curtain-revealed">
        <CoverContext.Provider value={gate}>{revealed}</CoverContext.Provider>
      </div>
      <div aria-hidden className="curtain-spacer" />
    </div>
  );
}

/**
 * The same curtain for when the section that leaves is see-through (it shows
 * the fixed mist), so it can't hide what is behind it. Instead of making it
 * opaque, the revealed section is clipped: it is drawn only below the point
 * where the previous section ends.
 *
 *   - This wrapper starts exactly where the previous section ends and clips
 *     everything outside its own box (clip-path: inset(0)). As it scrolls up,
 *     so does the edge of the clip.
 *   - Inside, the revealed section is sticky at the top of the screen and
 *     pulled up one screen (margin-top: -100svh), with a one-screen spacer
 *     after it: it stays still while the edge slides up over it, and is
 *     released exactly when it is fully uncovered. flow-root keeps that
 *     negative margin from collapsing into the wrapper.
 *
 * Clipped parts are neither painted nor clickable, so they never block the
 * section above. `anchorId` marks the point where the section is fully
 * uncovered, so links land on it rather than on the one still covering it.
 */
export function ClipReveal({ revealed, anchorId }: { revealed: React.ReactNode; anchorId?: string }) {
  const windowRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  const setNavTheme = useNavThemeOverride();

  const listeners = useRef(new Set<() => void>());
  // Everything above the clip's edge is still covered.
  const bottom = useCallback(() => windowRef.current?.getBoundingClientRect().top ?? 0, []);
  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);
  const [gate] = useState<Cover>(() => ({ bottom, subscribe }));

  useEffect(() => {
    const onScroll = () => {
      listeners.current.forEach((fn) => fn());
      // While the revealed section is stuck under the nav but still covered,
      // the browser sees it in the nav's band: only claim the band once the
      // clip's edge has passed it. (Above the edge, the previous section
      // reports itself.)
      const w = windowRef.current;
      const r = revealedRef.current;
      if (!w || !r) return;
      const band = window.innerHeight * 0.15;
      const edge = w.getBoundingClientRect().top;
      const rr = r.getBoundingClientRect();
      const theme = r.querySelector("section")?.getAttribute("data-theme") as "dark" | "light" | null;
      setNavTheme(edge <= band && rr.top <= band && rr.bottom >= band ? theme : null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setNavTheme(null);
    };
  }, [setNavTheme]);

  return (
    <div ref={windowRef} className="clip-curtain">
      {anchorId ? <div id={anchorId} aria-hidden className="absolute inset-x-0 top-0 h-px" /> : null}
      <div ref={revealedRef} className="clip-curtain-revealed">
        <CoverContext.Provider value={gate}>{revealed}</CoverContext.Provider>
      </div>
      <div aria-hidden className="clip-curtain-spacer" />
    </div>
  );
}
