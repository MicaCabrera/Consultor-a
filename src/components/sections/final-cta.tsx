import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { finalCta, footer } from "@/lib/content";
import { WA, whatsappUrl } from "@/lib/mica";

/** Text link with the menu's hover: a thin line sweeps under it and goes. */
function UnderlineLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      data-cursor="link"
      className="group -my-2.5 py-2.5"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="relative">
        {children}
        <span aria-hidden className="nav-underline absolute inset-x-0 -bottom-0.5 h-px bg-white" />
      </span>
    </a>
  );
}

/**
 * The closing section and the site footer in one full-screen block: the call
 * to action centred, with the contact links under it, and the legal bar (a
 * <footer> inside the section) along the bottom edge. In flow, not absolutely
 * placed, so on short screens the bar sits below the content instead of
 * covering it.
 */
export function FinalCta() {
  return (
    <Section
      id="contacto"
      theme="dark"
      mist
      className="full-screen relative flex flex-col overflow-hidden px-6 md:px-10"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-24 text-center md:py-28">
        <FadeHeading as="h2" lines={[finalCta.heading]} className="text-4xl md:text-6xl" />
        <Reveal delay={0.15}>
          <p className="mt-6 text-base text-muted md:text-lg">{finalCta.description}</p>
        </Reveal>
        <Reveal delay={0.25} className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <Button href={whatsappUrl(WA.avanzar)} external className="w-full justify-center sm:w-auto">
            {finalCta.cta}
          </Button>
        </Reveal>

        {/* Contact: mail and social links, as they were in the footer */}
        <Reveal delay={0.35} className="mt-12">
          {/* Phones: the mail on its own line, the social links under it */}
          <div className="flex flex-col items-center gap-y-3 text-sm text-muted sm:flex-row sm:gap-x-8">
            <UnderlineLink href={`mailto:${footer.email}`}>{footer.email}</UnderlineLink>
            <div className="flex items-center gap-x-8">
              {footer.social.map((item) => (
                <UnderlineLink key={item.label} href={item.href} external>
                  {item.label}
                </UnderlineLink>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Legal bar: smaller and dimmer than the rest. Extra bottom room on
          phones so the floating chat button never covers it. */}
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 pt-6 pb-24 text-center text-xs text-muted md:flex-row md:items-end md:justify-between md:gap-8 md:pb-8 md:text-left">
        <div className="flex flex-col gap-1">
          <p>
            <span className="mr-[0.3em] text-accent">⊹</span>
            {footer.description}
          </p>
          <p>{footer.copyright}</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap justify-center gap-x-6 gap-y-1 md:justify-end">
          {footer.links.map((link) => (
            <UnderlineLink key={link.href} href={link.href}>
              {link.label}
            </UnderlineLink>
          ))}
        </nav>
      </footer>
    </Section>
  );
}
