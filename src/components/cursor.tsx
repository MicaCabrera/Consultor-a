"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Cursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // Touch screens get no custom cursor. Read from the media query directly
  // instead of copying it into state from an effect.
  const isTouch = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false
  );

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springConfig = { damping: 30, stiffness: 400, mass: 0.4 };
  const dotX = useSpring(x, springConfig);
  const dotY = useSpring(y, springConfig);
  const ringX = useSpring(x, { damping: 26, stiffness: 180, mass: 0.6 });
  const ringY = useSpring(y, { damping: 26, stiffness: 180, mass: 0.6 });

  useEffect(() => {
    if (isTouch) return;

    const moveCursor = (e: MouseEvent) => {
      setIsVisible(true);
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(Boolean(target.closest("[data-cursor='link']")));
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleOver);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleOver);
    };
  }, [x, y, isTouch]);

  if (isTouch) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden
    >
      <motion.div
        className="absolute rounded-full bg-white"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 6,
          height: 6,
        }}
      />
      <motion.div
        className="absolute rounded-full border border-white"
        animate={{
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
          opacity: isHovering ? 1 : 0.6,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </div>
  );
}
