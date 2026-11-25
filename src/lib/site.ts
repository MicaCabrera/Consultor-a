/**
 * Public address of the site, used for the canonical URL, Open Graph, the
 * sitemap, robots.txt, llms.txt and the structured data.
 *
 * TODO: when the own domain is live, set NEXT_PUBLIC_SITE_URL to it in the
 * Vercel project settings (e.g. https://www.example.com, no trailing slash).
 * Until then it falls back to the Vercel address.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesar-vidal-scasso.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "César Vidal Scasso";
export const SITE_TITLE = "César Vidal Scasso — Consultoría estratégica en tecnología e IA";
export const SITE_DESCRIPTION =
  "Consultorías individuales de 60 minutos sobre tecnología, inteligencia artificial, innovación y desarrollo de negocios.";
