import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// One public page: the landing. (Booking and admin pages are paused/private.)
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
