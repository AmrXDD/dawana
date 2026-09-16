import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import PartnerLogo from "@/components/site/PartnerLogo";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import { getPartners } from "@/lib/catalog";
import { PARTNER_LOGOS } from "@/lib/partners";
import { CHANNELS } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Dawana partners with manufacturers seeking a reliable route into Kuwait's public and private healthcare sectors.",
};

export const revalidate = 600;

/* What Dawana handles on a partner's behalf — drawn from the departments
   and channels named in the company profile. */
const CAPABILITIES = [
  {
    title: "Regulatory & registration",
    body: "Dossier preparation, Ministry of Health submission and lifecycle maintenance of marketing authorisations.",
  },
  {
    title: "Tender management",
    body: "A dedicated tenders department handling qualification, pricing, submission and award fulfilment.",
  },
  {
    title: "Supply chain & cold chain",
    body: "Validated storage and transport with temperature monitoring and full traceability records.",
  },
  {
    title: "Field promotion",
    body: "Medical and sales representatives, plus modern-trade promoters and merchandisers.",
  },
  {
    title: "Commercial reporting",
    body: "Monthly sell-in and sell-out reporting, stock cover analysis and quarterly business reviews.",
  },
  {
    title: "Collections",
    body: "A standalone collection department managing receivables across public and private accounts.",
  },
];

interface PartnerRow {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  logo_url: string | null;
  blurb: string | null;
}

export default async function PartnersPage() {
  const { partners } = await getPartners();
  const rows = partners as PartnerRow[];

  return (
    <>
      <PageHero
        eyebrow="Partnerships"
        title="Bring your brand to Kuwait with a partner that knows the ground."
        lede="We work hand in hand with innovative manufacturers to deliver reliable and affordable healthcare across the MENA region — starting in Kuwait."
      />

      {/* Partner grid */}
      <section className="relative pb-8">
        <div className="u-shell">
          <Reveal
            stagger
            each={0.04}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
          >
            {PARTNER_LOGOS.map((p) => (
              <PartnerLogo
                key={p.name}
                partner={p}
                className="aspect-[3/2] transition-colors duration-500 hover:border-mint-400"
                sizes="(min-width: 1280px) 200px, (min-width: 640px) 180px, 45vw"
              />
            ))}
          </Reveal>

          {/* Partners published from the database, with blurbs and links. */}
          {rows.length > 0 && (
            <Reveal
              stagger
              each={0.05}
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {rows.map((p) => {
                const card = (
                  <>
                    <div className="flex h-16 items-center">
                      {p.logo_url ? (
                        <Image
                          src={p.logo_url}
                          alt={p.name}
                          width={180}
                          height={64}
                          className="max-h-12 w-auto object-contain"
                        />
                      ) : (
                        <span className="font-display text-[1.3rem] font-semibold tracking-tight text-deep">
                          {p.name}
                        </span>
                      )}
                    </div>

                    {p.blurb && (
                      <p className="mt-5 text-[0.88rem] leading-relaxed text-ink-soft">
                        {p.blurb}
                      </p>
                    )}

                    {p.country && (
                      <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-faint">
                        {p.country}
                      </p>
                    )}
                  </>
                );

                const cls =
                  "block rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-7 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint-400";

                return p.website ? (
                  <a
                    key={p.id}
                    href={p.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cls}
                  >
                    {card}
                  </a>
                ) : (
                  <div key={p.id} className={cls}>
                    {card}
                  </div>
                );
              })}
            </Reveal>
          )}
        </div>
      </section>

      {/* What we handle */}
      <section className="relative u-band">
        <div className="u-shell">
          <div className="max-w-2xl">
            <p className="u-eyebrow text-mint-600">What we handle</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-5 font-display text-title font-semibold text-deep"
            >
              Everything between your factory gate and the dispensing counter.
            </SplitText>
          </div>

          <Reveal
            stagger
            each={0.06}
            className="mt-16 grid gap-px overflow-hidden rounded-card border border-[color:var(--color-hairline)] bg-[color:var(--color-hairline)] sm:grid-cols-2 lg:grid-cols-3"
          >
            {CAPABILITIES.map((c, i) => (
              <article key={c.title} className="bg-paper p-8">
                <span className="font-mono text-[0.72rem] tracking-[0.18em] text-mint-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 font-display text-[1.2rem] font-semibold tracking-tight text-deep">
                  {c.title}
                </h3>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
                  {c.body}
                </p>
              </article>
            ))}
          </Reveal>

          {/* Channels recap */}
          <Reveal
            stagger
            each={0.08}
            className="mt-16 grid gap-4 md:grid-cols-3"
          >
            {CHANNELS.map((ch) => (
              <div
                key={ch.id}
                className="u-fill-deep rounded-card p-8 text-mint-100"
              >
                <h3 className="font-display text-[1.2rem] font-semibold tracking-tight text-mint-50">
                  {ch.title}
                </h3>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-mint-200/70">
                  {ch.body}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <CTABand />
    </>
  );
}
