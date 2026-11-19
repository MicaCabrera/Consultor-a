import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { about } from "@/lib/content";

export function About() {
  return (
    <Section id="sobre-cesar" theme="dark" className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="mb-6 text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
            {about.eyebrow}
          </p>
          <FadeHeading as="h2" lines={[about.heading]} className="text-3xl md:text-5xl" />
        </Reveal>

        <div className="flex flex-col gap-6">
          {about.paragraphs.map((paragraph, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <p className="text-base leading-relaxed text-muted md:text-lg">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.25}>
            <div className="rounded-2xl border border-dashed border-current/10 p-5 text-sm text-muted">
              {about.placeholder}
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <Button href="#faq" variant="outline" className="w-fit">
              {about.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
