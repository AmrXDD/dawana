"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScrollExpand from "@/components/ScrollExpand";
import { BRAND, CONTACT } from "@/lib/brand";

/* Facts for this chapter. Deliberately NOT the hero's stat row (founded /
   leadership / areas / sectors): this moment is about Dawana's home and
   where it's heading. Every value is from the company profile. */
const FACTS = [
  { label: "Headquarters", value: "Arabiya Tower, Sharq" },
  { label: "Founded", value: `${BRAND.founded}, ${CONTACT.city}` },
  { label: "Vision", value: "Premier across MENA" },
];

/**
 * Dawana's home chapter.
 *
 * react-bits ScrollExpand: a framed plate of the Kuwait Towers opens to full
 * bleed on scroll and hands the stage to the company's story. The section is
 * graded on both edges (bone in, night out) so it never cuts hard against
 * its neighbours.
 */
export default function SkylineReveal() {
  const root = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(false);

  // On phones a 44%-wide frame is too small for the title, which then spills
  // onto the bone page as white-on-cream. Start wider there.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* The overlay sits at opacity 0 until the frame opens, but it's still in
     the hit-test — an invisible "Read our story" link would be clickable over
     the small frame. The vendor component writes opacity inline every frame,
     so mirror that into a data attribute CSS can gate pointer events on. */
  useEffect(() => {
    const overlay = root.current?.querySelector<HTMLElement>(".scroll-expand__overlay");
    if (!overlay) return;

    const sync = () => {
      const live = Number(overlay.style.opacity || 0) > 0.85;
      if (live && !("live" in overlay.dataset)) overlay.dataset.live = "";
      if (!live && "live" in overlay.dataset) delete overlay.dataset.live;
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(overlay, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={root}
      aria-label={`${BRAND.name}, rooted in Kuwait`}
      className="dw-skyline relative isolate"
    >
      {/* Lead-in: the bone page dissolves toward the plate */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(245,242,237,0.95) 0%, rgba(245,242,237,0.5) 45%, transparent 100%)",
        }}
      />

      <ScrollExpand
        src="/media/kuwait-towers.jpg"
        alt={`The Kuwait Towers at sunset — ${BRAND.name} is headquartered in ${CONTACT.city}`}
        title={
          <span className="flex flex-col items-center gap-4">
            <span className="u-eyebrow text-mint-100 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">
              {BRAND.name} · Est. {BRAND.founded}
            </span>
            <span>Rooted in Kuwait</span>
          </span>
        }
        scrollHint={`Scroll to discover ${BRAND.name}`}
        useWindowScroll
        startWidth={narrow ? 84 : 44}
        startHeight={narrow ? 48 : 62}
        startRadius={28}
        endRadius={0}
        mediaZoom={1}
        scrollDistance={1.15}
        holdDistance={0.3}
        smoothing={0.1}
        overlayScrim={0.58}
      >
        <p className="u-eyebrow text-mint-300">Where {BRAND.name} began</p>

        <h2 className="mt-4 max-w-3xl font-display text-title font-semibold text-white sm:mt-5">
          Kuwait&apos;s everyday remedy, since {BRAND.founded}.
        </h2>

        <p className="mt-5 max-w-2xl text-lede text-white/80 sm:mt-6">
          What began in {CONTACT.city} is now a reliable name across Kuwait&apos;s
          private and government sectors — and the next chapter is our vision:
          to become the premier healthcare solutions provider in the MENA region.
        </p>

        {/* Phones: compact label/value rows. Stacked cards needed ~275px and
            got squashed out of the frame on short screens. sm+: three cards
            separated by hairline gaps. */}
        <dl className="mt-7 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-card border border-white/15 bg-white/10 text-left backdrop-blur-sm sm:mt-10 sm:grid-cols-3 sm:gap-px">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline justify-between gap-4 border-b border-white/10 bg-[#04221f]/35 px-5 py-3 last:border-b-0 sm:block sm:border-b-0 sm:px-6 sm:py-5"
            >
              <dt className="u-eyebrow shrink-0 text-mint-300/80">{fact.label}</dt>
              <dd className="text-right font-display text-[0.95rem] font-semibold tracking-tight text-white sm:mt-2 sm:text-left sm:text-[1.1rem]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/about"
          className="group mt-7 sm:mt-10 inline-flex items-center gap-2 rounded-capsule border border-white/25 bg-white/10 px-6 py-3 text-[0.9rem] font-medium text-white backdrop-blur-sm transition-colors duration-300 hover:border-mint hover:bg-mint hover:text-mint-950"
        >
          Read our story
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </ScrollExpand>

      {/* Lead-out. Lands on solid #04221f — exactly where the CTA band's
          dark-entry ramp begins — so the handoff has no seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-64"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(4,34,31,0.28) 30%, rgba(4,34,31,0.68) 58%, rgba(4,34,31,0.92) 80%, #04221f 100%)",
        }}
      />
    </section>
  );
}
