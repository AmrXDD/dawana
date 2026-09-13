import Marquee from "@/components/motion/Marquee";
import { THERAPEUTIC_AREAS } from "@/lib/brand";

/**
 * Two counter-running bands of oversized type. Uses the real therapeutic
 * areas rather than invented partner logos — it reads as a statement of
 * capability and never claims a relationship Dawana hasn't stated.
 */
export default function ManifestoMarquee() {
  const Row = ({ items }: { items: readonly string[] }) => (
    <>
      {items.map((label, i) => (
        <span key={`${label}-${i}`} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-display text-[clamp(1.75rem,4.2vw,3.4rem)] font-semibold tracking-tight text-deep">
            {label}
          </span>
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full bg-mint"
          />
        </span>
      ))}
    </>
  );

  const areas = THERAPEUTIC_AREAS.map((a) => a.name);
  const claims = [
    "Government tenders",
    "Private sector",
    "Modern trade",
    "Cold chain integrity",
    "Regulatory compliance",
    "Nationwide coverage",
  ];

  return (
    <section
      aria-label="Capabilities"
      className="relative overflow-hidden border-y border-[color:var(--color-hairline)] py-12 backdrop-blur-[2px] md:py-16"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(245,242,237,0) 0%, rgba(255,255,255,0.72) 30%, rgba(240,250,247,0.8) 70%, rgba(245,242,237,0) 100%)",
      }}
    >
      <Marquee speed={48}>
        <Row items={areas} />
      </Marquee>

      <div className="h-4" />

      <Marquee speed={62} reverse>
        <Row items={claims} />
      </Marquee>
    </section>
  );
}
