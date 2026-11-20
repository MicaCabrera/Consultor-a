import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Timeline } from "@/components/ui/timeline";
import { process } from "@/lib/content";

export function Process() {
  return (
    <Section id="como-funciona" theme="light" className="pt-12 md:pt-16">
      {/* Pinned, horizontally scrolling timeline; the heading opens the track. */}
      <Timeline
        steps={process.steps}
        heading={
          <Reveal>
            <FadeHeading
              as="h2"
              lines={[process.heading]}
              className="max-w-3xl text-[clamp(2rem,10vw,2.5rem)] md:text-5xl lg:text-[4rem]"
            />
          </Reveal>
        }
      />
    </Section>
  );
}
