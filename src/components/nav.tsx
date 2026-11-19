"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { nav } from "@/lib/content";
import { useNavTheme } from "@/components/section-theme";
import { RollText } from "@/components/roll-text";

export function Nav() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 transition-colors duration-500 md:px-10",
          isDark ? "text-fg-dark" : "text-fg-light"
        )}
      >
        <a
          href="#inicio"
          data-cursor="link"
          className="-my-2 py-2 font-semibold tracking-tight text-lg"
        >
          <span className="mr-[0.3em] text-accent">⊹</span>CVS
        </a>

        <nav className="hidden items-center gap-8 text-[13px] font-medium uppercase tracking-wider lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-cursor="link"
              className="group relative py-1"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <a
            href="#consultoria"
            data-cursor="link"
            className="relative -my-3 hidden py-3 text-[13px] font-semibold uppercase tracking-wider md:block"
          >
            <RollText text="Reservar" />
            {/* Underline drawn as a line: text-decoration doesn't reach the split letters */}
            <span aria-hidden className="absolute inset-x-0 bottom-[7px] h-0.5 bg-accent" />
          </a>
          <button
            type="button"
            data-cursor="link"
            onClick={() => setOpen(true)}
            className="relative z-50 flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label="Abrir menú"
          >
            <span className="h-px w-6 bg-current" />
            <span className="h-px w-6 bg-current" />
          </button>
          <button
            type="button"
            data-cursor="link"
            onClick={() => setOpen(true)}
            className="-my-3 hidden py-3 text-[13px] font-semibold uppercase tracking-wider md:block"
          >
            <RollText text="Menú" />
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
            className="fixed inset-0 z-[60] flex flex-col bg-bg-dark text-fg-dark"
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
                  <span className="transition-colors group-hover:text-accent">
                    {item.label}
                  </span>
                </motion.a>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-current/10 px-6 py-6 text-sm text-muted md:px-10">
              <span>hola@cesarvidalscasso.com</span>
              <span>Lunes a viernes · 9 a 12 h</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
