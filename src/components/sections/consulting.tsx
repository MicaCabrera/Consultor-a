import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { FadeHeading } from "@/components/fade-heading";
import { Button } from "@/components/button";
import { CountUp } from "@/components/count-up";
import { consulting } from "@/lib/content";

/** "USD 120" → currency "USD" and amount 120, so the amount can count up. */
function splitPrice(price: string) {
  const match = /^(\D*?)\s*(\d+)$/.exec(price.trim());
  return match ? { currency: match[1], amount: Number(match[2]) } : null;
}

// Same type as the big numbers of «Especialidades», at a smaller size.
const BIG_NUMBER = "text-[clamp(84px,10vw,150px)] font-normal leading-[0.76] tracking-[-0.08em] opacity-60";

export function Consulting() {
  const price = splitPrice(consulting.price);

  return (
    <Section id="consultoria" theme="light" className="px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <FadeHeading
            as="h2"
            lines={[consulting.heading]}
            className="max-w-4xl text-5xl md:text-6xl lg:text-[5rem]"
          />
        </Reveal>

        {/* Description on the left, price on the right: the bottom of the
            number lines up with the last line of the description. */}
        <div className="mt-8 flex flex-col gap-12 lg:flex-row lg:items-end lg:gap-28 xl:gap-36">
          <Reveal className="max-w-xl">
            <p className="text-base leading-relaxed text-muted md:text-lg">{consulting.description}</p>
          </Reveal>

          <Reveal delay={0.15} className="shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted">
              {consulting.priceNote}
            </p>
            {price ? (
              <p className="mt-5 flex items-start gap-2.5 select-none" aria-label={consulting.price}>
                <span className="mt-[0.3em] text-base font-medium tracking-[0.15em] text-muted">
                  {price.currency}
                </span>
                <CountUp to={price.amount} className={BIG_NUMBER} />
              </p>
            ) : (
              <p className={`mt-5 ${BIG_NUMBER}`}>{consulting.price}</p>
            )}
          </Reveal>
        </div>

        <Reveal delay={0.25}>
          <Button href="#como-funciona" className="mt-12 w-full justify-center px-7 py-3.5 text-base sm:w-auto">
            {consulting.cta}
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
