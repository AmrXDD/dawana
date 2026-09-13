import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Channels from "@/components/site/Channels";
import CTABand from "@/components/site/CTABand";
import Reveal from "@/components/motion/Reveal";
import PulseLine from "@/components/motion/PulseLine";
import { THERAPEUTIC_AREAS } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Therapeutics",
  description:
    "Six therapeutic areas — mom and baby care, diabetes, neurology, nutraceuticals, ophthalmology and oral care — served across Kuwait's public and private healthcare sectors.",
};

export default function TherapeuticsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title="Six therapeutic areas, one standard of care."
        lede="Each portfolio is built around partners whose manufacturing and clinical evidence meet the expectations of Kuwait's regulators and clinicians alike."
      />

      {/* Editorial list — alternating rows rather than a card grid, so the
          page doesn't repeat the home page's scroller. */}
      <section className="relative pb-8">
        <div className="u-shell">
          <ul className="border-t border-[color:var(--color-hairline)]">
            {THERAPEUTIC_AREAS.map((area) => (
              <li
                key={area.id}
                id={area.id}
                className="scroll-mt-32 border-b border-[color:var(--color-hairline)]"
              >
                <Reveal>
                  <div className="grid gap-6 py-12 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-12 md:py-16">
                    <span className="font-mono text-[0.78rem] tracking-[0.2em] text-mint-500 md:pt-3">
                      {area.index}
                    </span>

                    <div className="max-w-3xl">
                      <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-tight tracking-tight text-deep">
                        {area.name}
                      </h2>
                      <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-ink-soft">
                        {area.blurb}
                      </p>

                      <PulseLine
                        className="mt-8 h-10 w-full max-w-sm text-mint/35"
                        beats={2}
                        strokeWidth={1.5}
                        height={90}
                        width={420}
                        duration={1.8}
                      />
                    </div>

                    <Link
                      href={`/products?area=${area.id}`}
                      className="group inline-flex shrink-0 items-center gap-2 rounded-capsule border border-[color:var(--color-hairline)] px-5 py-3 text-[0.85rem] text-deep transition-colors duration-300 hover:border-mint-500 hover:bg-mint-50 md:mt-2"
                    >
                      View products
                      <ArrowUpRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Channels />
      <CTABand />
    </>
  );
}
