import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import MissionVision from "@/components/site/MissionVision";
import Values from "@/components/site/Values";
import CTABand from "@/components/site/CTABand";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import Counter from "@/components/motion/Counter";
import { ABOUT, BRAND, DEPARTMENTS, SIGNATORY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT.lede,
};

/* Org structure as stated in the company profile's chart. */
const STRUCTURE = [
  {
    tier: "Executive",
    roles: ["Chief Executive Officer", "General Manager", "Operation Manager"],
  },
  {
    tier: "Commercial",
    roles: ["Sales Manager", "Marketing Manager", "Tenders Manager", "Procurement Manager"],
  },
  {
    tier: "Field",
    roles: ["Medical Representatives", "Sales Representatives", "Promoters", "Merchandisers"],
  },
  {
    tier: "Corporate",
    roles: ["Finance & Accounting", "Legal & Contract Management", "Collection", "Human Resources"],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={`Established ${BRAND.founded}`}
        title="A reliable name in Kuwaiti healthcare."
        lede={ABOUT.lede}
      />

      {/* Story */}
      <section className="relative pb-8">
        <div className="u-shell">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="u-eyebrow text-mint-600">Our story</p>
            </div>

            <div>
              <Reveal>
                <p className="max-w-2xl text-lede text-ink-soft">{ABOUT.body}</p>
              </Reveal>

              <Reveal
                stagger
                each={0.08}
                className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3"
              >
                {[
                  { v: 2015, label: "Year founded", plain: true },
                  { v: 25, suffix: "+", label: "Years of leadership experience" },
                  { v: 6, label: "Therapeutic areas" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="border-t border-[color:var(--color-hairline)] pt-5"
                  >
                    <div className="font-display text-[2.1rem] font-semibold leading-none tracking-tight text-deep">
                      {f.plain ? (
                        <span className="tabular-nums">{f.v}</span>
                      ) : (
                        <Counter to={f.v} suffix={f.suffix} duration={1.8} />
                      )}
                    </div>
                    <p className="mt-3 text-[0.82rem] leading-snug text-ink-faint">
                      {f.label}
                    </p>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <div id="mission" className="scroll-mt-28">
        <MissionVision />
      </div>

      <Values />

      {/* Structure */}
      <section className="relative u-band">
        <div className="u-shell">
          <div className="max-w-2xl">
            <p className="u-eyebrow text-mint-600">Structure</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-5 font-display text-title font-semibold text-deep"
            >
              One organisation, ten departments, a single chain of accountability.
            </SplitText>
          </div>

          <Reveal stagger each={0.07} className="mt-16 grid gap-4 md:grid-cols-2">
            {STRUCTURE.map((group, i) => (
              <article
                key={group.tier}
                className="rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-8 backdrop-blur-[2px]"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[0.72rem] tracking-[0.18em] text-mint-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[1.3rem] font-semibold tracking-tight text-deep">
                    {group.tier}
                  </h3>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {group.roles.map((role) => (
                    <li
                      key={role}
                      className="flex items-center gap-3 text-[0.92rem] text-ink-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1 shrink-0 rounded-full bg-mint"
                      />
                      {role}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </Reveal>

          {/* Department index */}
          <Reveal className="mt-12 border-t border-[color:var(--color-hairline)] pt-8">
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {DEPARTMENTS.map((d) => (
                <li
                  key={d}
                  className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-faint"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Leadership note */}
      <section className="relative pb-16">
        <div className="u-shell-narrow">
          <Reveal>
            <figure className="rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-10 backdrop-blur-[2px] md:p-14">
              <blockquote className="font-display text-head font-medium leading-snug tracking-tight text-deep">
                &ldquo;We built Dawana to be the partner we wanted to find — one
                that treats registration, cold chain and after-sales service as
                the product, not the paperwork.&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-[color:var(--color-hairline)] pt-6">
                <span
                  aria-hidden="true"
                  className="grid size-11 place-items-center rounded-full bg-deep text-[0.78rem] font-semibold text-mint"
                >
                  BA
                </span>
                <span>
                  <span className="block text-[0.95rem] font-semibold text-deep">
                    {SIGNATORY.name}
                  </span>
                  <span className="u-eyebrow block text-ink-faint">
                    {SIGNATORY.title}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <CTABand />
    </>
  );
}
