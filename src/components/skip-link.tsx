"use client";

import { useContent } from "@/components/locale-provider";

/**
 * "Saltar al contenido": the first Tab stop on the page. Jumps past the menu
 * and moves keyboard focus to the main content (some browsers only scroll on
 * a plain #fragment link, leaving focus behind).
 */
export function SkipLink() {
  const { ui } = useContent();
  return (
    <a
      href="#contenido"
      className="skip-link"
      onClick={(event) => {
        const main = document.getElementById("contenido");
        if (!main) return;
        event.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView();
      }}
    >
      {ui.skipLink}
    </a>
  );
}
