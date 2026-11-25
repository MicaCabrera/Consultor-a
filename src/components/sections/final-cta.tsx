import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { finalCta } from "@/lib/content";

export function FinalCta() {
  return (
    <Section theme="dark" mist className="relative overflow-hidden px-6 py-32 text-center md:px-10 md:py-40">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <FadeHeading
          as="h2"
          lines={[finalCta.heading]}
          className="text-4xl md:text-6xl"
        />
        <Reveal delay={0.15}>
          <p className="mt-6 text-base text-muted md:text-lg">{finalCta.description}</p>
        </Reveal>
        <Reveal delay={0.25} className="mt-10">
          <Button href="#consultoria">{finalCta.cta}</Button>
        </Reveal>
      </div>
    </Section>
  );
}
