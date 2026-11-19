import { Check } from "lucide-react";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { consulting } from "@/lib/content";

export function Consulting() {
  return (
    <Section id="consultoria" theme="light" className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <Reveal>
          <p className="mb-6 text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
            {consulting.eyebrow}
          </p>
          <FadeHeading as="h2" lines={[consulting.heading]} className="text-4xl md:text-5xl" />
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
            {consulting.description}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative overflow-hidden border border-current/10 bg-bg-dark p-8 text-fg-dark md:p-10" data-theme="dark">
            <p className="text-sm uppercase tracking-widest text-muted">
              {consulting.priceNote}
            </p>
            <p className="mt-3 text-5xl font-medium tracking-tight md:text-6xl">
              {consulting.price}
            </p>
            <p className="mt-2 text-sm text-muted">{consulting.priceFootnote}</p>

            <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-accent">
              {consulting.includesTitle}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {consulting.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted md:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button href="#como-funciona" className="mt-10 w-full justify-center">
              {consulting.cta}
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
