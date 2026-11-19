import { Section } from "@/components/section";
import { footer } from "@/lib/content";

export function Footer() {
  return (
    <Section id="contacto" theme="dark" className="border-t border-current/10 px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">
            <span className="mr-[0.3em] text-accent">⊹</span>
            {footer.name}
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{footer.description}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          {footer.links.map((link) => (
            <a key={link.href} href={link.href} data-cursor="link" className="-my-2.5 py-2.5 hover:text-accent">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm text-muted">
          <a href={`mailto:${footer.email}`} data-cursor="link" className="-my-2.5 py-2.5 hover:text-accent">
            {footer.email}
          </a>
          <div className="flex gap-4">
            {footer.social.map((item) => (
              <a key={item.label} href={item.href} data-cursor="link" className="-my-2.5 py-2.5 hover:text-accent">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-xs text-muted">{footer.copyright}</p>
    </Section>
  );
}
