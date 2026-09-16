import Marquee from "@/components/motion/Marquee";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import { ButtonLink } from "@/components/ui/Button";
import PartnerLogo from "@/components/site/PartnerLogo";
import { PARTNER_LOGOS } from "@/lib/partners";

/**
 * Two counter-running rows of partner logos. Transparent background so the
 * section keeps the bone page that SkylineReveal grades in from.
 */
export default function PartnersMarquee() {
  const half = Math.ceil(PARTNER_LOGOS.length / 2);
  const rows = [PARTNER_LOGOS.slice(0, half), PARTNER_LOGOS.slice(half)];

  return (
    <section aria-label="Our partners" className="relative overflow-hidden u-band">
      <div className="u-shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="u-eyebrow text-mint-600">Our partners</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-5 font-display text-title font-semibold text-deep"
            >
              The manufacturers we bring to Kuwait.
            </SplitText>
          </div>

          <Reveal delay={0.1}>
            <ButtonLink href="/partners" variant="outline" arrow>
              All partners
            </ButtonLink>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.12} className="mt-14 flex flex-col gap-4 md:mt-16">
        {rows.map((row, r) => (
          <Marquee key={r} speed={r === 0 ? 56 : 64} reverse={r === 1}>
            {row.map((p) => (
              <PartnerLogo
                key={p.name}
                partner={p}
                className="mx-2 h-24 w-44 shrink-0 md:h-28 md:w-52"
                sizes="(min-width: 768px) 160px, 140px"
              />
            ))}
          </Marquee>
        ))}
      </Reveal>
    </section>
  );
}
