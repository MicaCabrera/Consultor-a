"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<Theme>("dark");
const OverrideContext = createContext<(theme: Theme | null) => void>(() => {});

export function useNavTheme() {
  return useContext(ThemeContext);
}

/** Lets a section force the nav theme while it is under the nav, e.g. when two
 *  sections are stacked at the same position. Pass `null` to release it. */
export function useNavThemeOverride() {
  return useContext(OverrideContext);
}

export function SectionThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [override, setOverride] = useState<Theme | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const next = visible.target.getAttribute("data-theme") as Theme | null;
          if (next) setTheme(next);
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    // Observe every themed section, including ones mounted later (a section
    // can be re-created, e.g. when a component swaps its markup after load).
    const observed = new Set<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>("section[data-theme]").forEach((section) => {
        if (observed.has(section)) return;
        observed.add(section);
        observer.observe(section);
      });
    };
    scan();

    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <OverrideContext.Provider value={setOverride}>
      <ThemeContext.Provider value={override ?? theme}>{children}</ThemeContext.Provider>
    </OverrideContext.Provider>
  );
}
