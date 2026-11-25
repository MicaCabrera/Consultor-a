import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hero } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

// Image shown when the site is shared (Open Graph / X). Same type (DM Sans)
// and colours as the site: page black, light text, accent green.
export const alt = `${SITE_NAME} — Consultoría estratégica en tecnología e IA`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "src/app/og-fonts/DMSans-Medium.ttf"));
  const heading = `${hero.headingPrefix} ${hero.headingHighlight}${hero.headingSuffix}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a0b0a",
          color: "#f5f6f4",
          fontFamily: "DM Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#30e6b0" }} />
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 84, lineHeight: 0.95, letterSpacing: "-0.03em", maxWidth: 980 }}>{heading}</div>
        <div style={{ fontSize: 28, color: "#8b8f8a" }}>Consultoría estratégica en tecnología, inteligencia artificial e innovación</div>
      </div>
    ),
    { ...size, fonts: [{ name: "DM Sans", data: font, weight: 500, style: "normal" }] }
  );
}
