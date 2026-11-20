import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { finalCta } from "@/lib/content";

export function FinalCta() {
  return (
    <Section theme="light" className="relative overflow-hidden px-6 py-32 text-center md:px-10 md:py-40">
      <div className="grid-floor absolute inset-0 -z-10 opacity-60" />
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <Reveal>
          <FadeHeading
            as="h2"
            lines={[finalCta.heading]}
            accentWords={["oportunidades"]}
            className="text-4xl md:text-6xl"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-base text-muted md:text-lg">{finalCta.description}</p>
        </Reveal>
        <Reveal delay={0.25} className="mt-10">
          <Button href="#consultoria">{finalCta.cta}</Button>
        </Reveal>
        <Reveal delay={0.35}>
          <p className="mt-6 text-sm text-muted">{finalCta.note}</p>
        </Reveal>
      </div>
    </Section>
  );
}
