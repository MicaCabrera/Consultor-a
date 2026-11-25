import { Section } from "@/components/section";
import { FadeHeading } from "@/components/fade-heading";
import { Timeline } from "@/components/ui/timeline";
import { process } from "@/lib/content";

/** `id={null}` drops the anchor, for when a wrapper places it instead. */
export function Process({ id = "como-funciona" }: { id?: string | null }) {
  return (
    <Section id={id ?? undefined} theme="light" className="pt-12 md:pt-16">
      {/* Pinned, horizontally scrolling timeline; the heading opens the track. */}
      <Timeline
        steps={process.steps}
        heading={
          <FadeHeading
            as="h2"
            lines={[process.heading]}
            className="max-w-3xl text-[clamp(2rem,10vw,2.5rem)] max-md:leading-[1.02] md:text-5xl lg:text-[4rem]"
          />
        }
      />
    </Section>
  );
}
