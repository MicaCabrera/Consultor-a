"use client";

import { useCallback } from "react";
import { SlatShutter } from "@/components/ui/slat-shutter";
import { useNavThemeOverride } from "@/components/section-theme";
import { Hero, HeroContent, HERO_CLASS } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { cn } from "@/lib/utils";
import { HeroSmokeMirror } from "@/components/ui/hero-smoke";

/**
 * Hero → «Sobre mí» transition: the hero stays pinned and splits into
 * vertical slats that open from the centre, revealing «Sobre mí» behind it.
 */
export function HeroShutter() {
  const setNavTheme = useNavThemeOverride();

  // Hero and «Sobre mí» share the same spot while pinned, so the nav can't
  // tell them apart by position: follow the reveal instead.
  const onRevealChange = useCallback(
    (revealed: boolean | null) => {
      setNavTheme(revealed === null ? null : revealed ? "light" : "dark");
    },
    [setNavTheme]
  );

  return (
    <SlatShutter
      cover={<Hero />}
      slice={
        <div
          data-theme="dark"
          className={cn(HERO_CLASS, "h-full bg-bg-dark text-fg-dark")}
        >
          <HeroSmokeMirror />
          <HeroContent />
        </div>
      }
      anchorId="sobre-mi"
      onRevealChange={onRevealChange}
    >
      <div className="flex min-h-svh flex-col justify-center bg-bg-light">
        <Intro id={null} />
      </div>
    </SlatShutter>
  );
}
