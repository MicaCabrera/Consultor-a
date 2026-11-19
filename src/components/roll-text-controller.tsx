"use client";

import { useEffect } from "react";

// Same motion as the reference (ebuka.marketing), sped up.
const ROLL = {
  duration: 450,
  stagger: 18,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

function roll(target: Element) {
  target.querySelectorAll<HTMLElement>("[data-roll-char]").forEach((el) => {
    const index = Number(el.dataset.rollChar);
    el.getAnimations().forEach((animation) => animation.cancel());
    el.animate([{ transform: "translateY(-100%)" }, { transform: "none" }], {
      duration: ROLL.duration,
      delay: index * ROLL.stagger,
      easing: ROLL.easing,
      fill: "backwards",
    });
  });
}

function rollTarget(node: EventTarget | null) {
  const el = node instanceof Element ? node.closest("a, button") : null;
  if (!el || (el as HTMLButtonElement).disabled) return null;
  return el.querySelector("[data-roll-char]") ? el : null;
}

/**
 * Plays the letter roll of every <RollText /> inside a link or button:
 * on pointer enter and leave with a mouse, and on tap on touch screens.
 * Mounted once for the whole site.
 */
export function RollTextController() {
  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Enter and leave, ignoring moves between a button's own children.
    const onHover = (event: MouseEvent) => {
      if (!canHover.matches || reduce.matches) return;
      const target = rollTarget(event.target);
      if (!target || target.contains(event.relatedTarget as Node | null)) return;
      roll(target);
    };

    // No hover on touch: roll on tap instead.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || reduce.matches) return;
      const target = rollTarget(event.target);
      if (target) roll(target);
    };

    document.addEventListener("mouseover", onHover);
    document.addEventListener("mouseout", onHover);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("mouseover", onHover);
      document.removeEventListener("mouseout", onHover);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return null;
}
