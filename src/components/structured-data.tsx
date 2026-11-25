import { consulting, footer, intro, specialties } from "@/lib/content";
import { WHATSAPP_NUMBER, whatsappUrl } from "@/lib/mica";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * JSON-LD for search engines and AI assistants: who César is (Person), the
 * consulting service (ProfessionalService, with the specialties as services
 * and the session as an offer) and the website. Built only from the site's
 * own content, so it always matches what the page says.
 *
 * Facts given by the client, not shown on the page yet: sessions are online
 * and the service is international.
 */
export function StructuredData() {
  const price = /(\d+)/.exec(consulting.price)?.[1];
  const person = `${SITE_URL}/#cesar`;
  const service = `${SITE_URL}/#consultoria`;

  const graph = [
    {
      "@type": "Person",
      "@id": person,
      name: footer.name,
      url: SITE_URL,
      image: `${SITE_URL}${intro.photo.src}`,
      jobTitle: "Consultor estratégico en tecnología, inteligencia artificial e innovación",
      description: intro.paragraphs[0],
      email: `mailto:${footer.email}`,
      sameAs: footer.social.map((s) => s.href),
      knowsAbout: specialties.items.map((item) => item.title),
    },
    {
      "@type": "ProfessionalService",
      "@id": service,
      name: `${footer.name} — Consultoría estratégica`,
      url: SITE_URL,
      description: footer.description,
      founder: { "@id": person },
      email: footer.email,
      telephone: `+${WHATSAPP_NUMBER}`,
      areaServed: "Worldwide",
      availableLanguage: ["es"],
      sameAs: footer.social.map((s) => s.href),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: footer.email,
        telephone: `+${WHATSAPP_NUMBER}`,
        url: whatsappUrl(),
        availableLanguage: ["es"],
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Especialidades",
        itemListElement: specialties.items.map((item) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: item.title, description: item.description },
        })),
      },
      makesOffer: {
        "@type": "Offer",
        name: "Consultoría individual de 60 minutos (online)",
        description: consulting.description,
        ...(price ? { price, priceCurrency: "USD" } : {}),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/#consultoria`,
        itemOffered: {
          "@type": "Service",
          name: "Consultoría estratégica individual",
          serviceType: "Consultoría en tecnología, inteligencia artificial e innovación",
          provider: { "@id": person },
          areaServed: "Worldwide",
          availableChannel: {
            "@type": "ServiceChannel",
            name: "Online",
            serviceUrl: whatsappUrl(),
          },
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "es-AR",
      publisher: { "@id": person },
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Static, server-rendered data from the site's own content.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
