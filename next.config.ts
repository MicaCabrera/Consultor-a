import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Static media in /public is served with max-age=0 by default, so every
  // visit revalidated the 1.8 MB hero video. Cache it (and the other media)
  // for a day in the browser, refreshed in the background for a week.
  async headers() {
    const media = "public, max-age=86400, stale-while-revalidate=604800";
    return ["/hero/:path*", "/about/:path*", "/mica-glow.json"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: media }],
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
