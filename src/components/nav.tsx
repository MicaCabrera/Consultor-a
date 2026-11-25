"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { nav, footer } from "@/lib/content";
import { useNavTheme } from "@/components/section-theme";
import { RollText } from "@/components/roll-text";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

export function Nav() {
  const [open, setOpen] = useState(false);
  // Inline menu of wide screens (≥1024px), unfolding to the left of MENÚ.
  const [inlineOpen, setInlineOpen] = useState(false);
  const reduce = useSafeReducedMotion();

  // MENÚ: the links fit in one row only on wide screens; below that, the
  // full-screen menu.
  const onMenu = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setInlineOpen((v) => !v);
    else setOpen(true);
  };

  // Inline menu: Esc closes it; it also closes if the screen gets narrower.
  useEffect(() => {
    if (!inlineOpen) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInlineOpen(false);
    };
    const onChange = () => {
      if (!mq.matches) setInlineOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [inlineOpen]);

  // While the full-screen menu is open: no page scroll behind it, Esc closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const theme = useNavTheme();
  const isDark = theme === "dark";

  // Phones: once the page moves, the bar gets a translucent backdrop so the
  // logo and menu icon never sit on top of running text. Desktop keeps the
  // bare bar (the classes below are max-md only).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 transition-[color,background-color] duration-500 md:px-10",
          isDark ? "text-fg-dark" : "text-fg-light",
          scrolled && "max-md:py-4 max-md:backdrop-blur-md",
          scrolled && (isDark ? "max-md:bg-bg-dark/70" : "max-md:bg-bg-light/75")
        )}
      >
        <a
          href="#inicio"
          data-cursor="link"
          className="-my-2 py-2 font-semibold tracking-tight text-lg"
        >
          <span className="mr-[0.3em] text-accent">⊹</span>CVS
        </a>

        {/* Right: MENÚ, with the links unfolding to its left */}
        <div className="relative flex items-center gap-6">
          {/* Inline menu (≥1024px). Absolutely placed to the left of MENÚ, so
              opening it never moves or resizes anything else. */}
          <motion.nav
            id="nav-inline"
            aria-label="Secciones"
            aria-hidden={!inlineOpen}
            inert={!inlineOpen}
            initial={false}
            animate={{ clipPath: inlineOpen ? "inset(0 0 0 0%)" : "inset(0 0 0 100%)" }}
            transition={{ duration: reduce ? 0 : 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute right-full top-1/2 mr-8 hidden -translate-y-1/2 items-center gap-6 whitespace-nowrap text-[13px] font-medium uppercase tracking-wider lg:flex xl:gap-8"
          >
            {nav.map((item, i) => {
              // Unfolds from the right: the link nearest MENÚ comes in first
              // and, when closing, leaves last.
              const fromRight = nav.length - 1 - i;
              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  data-cursor="link"
                  onClick={() => setInlineOpen(false)}
                  initial={false}
                  animate={inlineOpen ? { x: 0, opacity: 1 } : { x: 24, opacity: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduce ? 0 : (inlineOpen ? fromRight : i) * 0.05,
                  }}
                  className="group relative py-1"
                >
                  {item.label}
                  {/* Hover: a thin line sweeps under the link and goes (.nav-underline) */}
                  <span aria-hidden className="nav-underline absolute inset-x-0 bottom-0.5 h-px bg-current" />
                </motion.a>
              );
            })}
          </motion.nav>

          {/* Mobile: icon only, opens the full-screen menu */}
          <button
            type="button"
            data-cursor="link"
            onClick={() => setOpen(true)}
            className="relative z-50 -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label="Abrir menú"
          >
            <span className="h-px w-6 bg-current" />
            <span className="h-px w-6 bg-current" />
          </button>

          {/* MENÚ (≥768px): inline menu on wide screens, full-screen below 1024px */}
          <button
            type="button"
            data-cursor="link"
            onClick={onMenu}
            aria-expanded={inlineOpen}
            aria-controls="nav-inline"
            className="-my-3 hidden items-center gap-3 py-3 text-[13px] font-semibold uppercase tracking-wider md:flex"
          >
            <RollText text="Menú" />
            <span aria-hidden className="relative block h-3 w-6">
              <motion.span
                initial={false}
                animate={inlineOpen ? { top: 5.5, rotate: 45, width: 20 } : { top: 2, rotate: 0, width: 24 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: [0.76, 0, 0.24, 1] }}
                className="absolute right-0 h-px bg-current"
              />
              <motion.span
                initial={false}
                animate={inlineOpen ? { top: 5.5, rotate: -45, width: 20 } : { top: 9, rotate: 0, width: 16 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: [0.76, 0, 0.24, 1] }}
                className="absolute right-0 h-px bg-current"
              />
            </span>
          </button>

        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[80] flex flex-col bg-bg-dark text-fg-dark"
          >
            <div className="flex items-center justify-between px-6 py-5 md:px-10">
              <span className="font-semibold tracking-tight text-lg">
                <span className="mr-[0.3em] text-accent">⊹</span>CVS
              </span>
              <button
                type="button"
                data-cursor="link"
                onClick={() => setOpen(false)}
                className="-my-3 -mr-3 p-3 text-[13px] font-semibold uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3 px-6 md:px-10">
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  data-cursor="link"
                  onClick={() => setOpen(false)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-baseline gap-3 text-[clamp(2rem,10.5vw,3rem)] font-medium leading-[1.1] tracking-tight md:gap-4 md:text-7xl"
                >
                  <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    ⊹
                  </span>
                  <span className="relative transition-colors group-hover:text-accent">
                    {item.label}
                    {/* Hover: a thin white line sweeps under the link and goes */}
                    <span aria-hidden className="nav-underline absolute inset-x-0 bottom-[0.06em] h-px bg-white" />
                  </span>
                </motion.a>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-current/10 px-6 py-6 text-sm text-muted md:px-10">
              <a href={`mailto:${footer.email}`} data-cursor="link" className="w-fit hover:text-accent">
                {footer.email}
              </a>
              <span>Lunes a viernes · 9 a 12 h</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
