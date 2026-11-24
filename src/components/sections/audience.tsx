import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { SpineAccordion } from "@/components/ui/spine-accordion";
import { audience } from "@/lib/content";

export function Audience() {
  return (
    <Section theme="dark" mist className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <FadeHeading as="h2" lines={[audience.heading]} className="max-w-4xl text-5xl md:text-6xl lg:text-[5rem]" />
        </Reveal>

        <Reveal delay={0.1} className="mt-24 md:mt-32">
          <SpineAccordion
            items={audience.items}
            aria-label={audience.eyebrow}
            className="h-[38rem] md:h-[34rem]"
          />
        </Reveal>
      </div>
    </Section>
  );
}
