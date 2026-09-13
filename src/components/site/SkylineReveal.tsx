"use client";

import ScrollExpand from "@/components/ScrollExpand";
import { BRAND, CONTACT } from "@/lib/brand";

/**
 * Kuwait City reveal.
 *
 * react-bits ScrollExpand: the framed plate opens to full bleed as the
 * section is scrolled, then hands the stage to the copy.
 *
 * The section carries its own grading on both edges — a bone-to-dark ramp
 * coming in, and a dark ramp going out that hands straight to the CTA
 * band's gradient. Without these the plate cuts hard against the flat
 * sections on either side.
 */
export default function SkylineReveal() {
  return (
    <section
      aria-label={`${BRAND.name} in ${CONTACT.city}`}
      className="relative isolate"
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
        alt={`The Kuwait Towers at sunset, ${CONTACT.city}`}
        title="Kuwait City"
        scrollHint="Scroll to open"
        useWindowScroll
        startWidth={44}
        startHeight={62}
        startRadius={28}
        endRadius={0}
        mediaZoom={1}
        scrollDistance={1.15}
        holdDistance={0.3}
        smoothing={0.1}
        overlayScrim={0.52}
      >
        <p className="u-eyebrow text-mint-300">Where we operate</p>
        <h2 className="mt-5 max-w-3xl font-display text-title font-semibold text-white">
          Headquartered in Sharq. Present in every channel that matters.
        </h2>
        <p className="mt-6 max-w-xl text-lede text-white/78">
          From Arabiya Tower we run registration, tendering, warehousing and a
          field force that reaches public hospitals, private clinics and retail
          pharmacy across the State of Kuwait.
        </p>
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
