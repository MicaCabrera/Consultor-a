import { audience, consulting, footer, intro, process, specialties } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * /llms.txt (llmstxt.org): a plain summary of the site for AI assistants.
 * Built only from the site's own content, so it never says anything the
 * page doesn't. Sessions being online and international is the client's
 * own information (not shown on the page yet).
 */
export function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION} Sesiones online, para clientes de cualquier país.`,
    "",
    ...intro.paragraphs,
    "",
    "## Especialidades",
    "",
    ...specialties.items.map((item) => `- **${item.title}**: ${item.description}`),
    "",
    "## Consultoría individual",
    "",
    consulting.description,
    "",
    `- Duración: 60 minutos, online.`,
    `- ${consulting.priceNote}: ${consulting.price}.`,
    `- Contacto y reserva: por WhatsApp o por mail a ${footer.email}.`,
    "",
    "## Para quién es",
    "",
    ...audience.items.map((item) => `- **${item.title}**: ${item.description}`),
    "",
    "## Cómo funciona",
    "",
    ...process.steps.map((step) => `${step.number}. **${step.title}**: ${step.description}`),
    "",
    "## Enlaces",
    "",
    `- [Sitio](${SITE_URL}/)`,
    `- [English version](${SITE_URL}/en)`,
    `- [Sobre mí](${SITE_URL}/#sobre-mi)`,
    `- [Especialidades](${SITE_URL}/#especialidades)`,
    `- [Consultoría](${SITE_URL}/#consultoria)`,
    `- [Cómo funciona](${SITE_URL}/#como-funciona)`,
    `- [Contacto](${SITE_URL}/#contacto)`,
    ...footer.social.map((s) => `- [${s.label}](${s.href})`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
