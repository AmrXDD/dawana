"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import { THERAPEUTIC_AREAS } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Pinned horizontal gallery of the six therapeutic areas.
 *
 * One pinned section on the page — more than that and it starts fighting
 * native scroll feel. Below `lg` this degrades to a normal vertical stack
 * rather than a touch-hostile horizontal drag.
 */
export default function TherapeuticsScroller() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const rail = track.current;
      const view = viewport.current;
      if (!section || !rail || !view) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        },
        () => {
          /* Travel is measured against the RAIL'S OWN VIEWPORT, not the
             window. The rail sits inside the padded shell, so using
             window.innerWidth under-measures by the gutters and the pin
             releases before the last card has fully arrived. */
          const distance = () =>
            Math.max(0, rail.scrollWidth - view.clientWidth);

          /* Pin length is deliberately decoupled from track width. Scrolling
             1px of page per 1px of track made the whole gallery fly past in
             under half a viewport. Stretching the pin lets the same travel
             play out over a longer scroll, so each card gets read. The floor
             keeps it deliberate on wide screens where overflow is small. */
          const pinLength = () =>
            Math.max(distance() * 2.4, window.innerHeight * 1.6);

          const tween = gsap.to(rail, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${pinLength()}`,
              pin: true,
              scrub: 1.1,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });

          // Each card lifts slightly as it crosses the centre of the viewport.
          gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
            gsap.fromTo(
              card,
              { y: 44 },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: tween,
                  start: "left 92%",
                  end: "left 45%",
                  scrub: true,
                },
              },
            );
          });

          // Progress rail
          gsap.fromTo(
            "[data-progress]",
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => `+=${pinLength()}`,
                scrub: true,
              },
            },
          );

          return () => tween.kill();
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="therapeutics"
      className="u-band-dark relative overflow-hidden text-mint-100 lg:h-[100svh]"
    >
      <div className="flex h-full flex-col justify-center py-28 lg:py-0">
        {/* Heading */}
        <div className="u-shell flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="u-eyebrow text-mint-400">Our services</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-5 font-display text-title font-semibold text-mint-50"
            >
              Six therapeutic areas, one standard of care.
            </SplitText>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-mint-200/65">
            Each portfolio is built around partners whose manufacturing and clinical
            evidence meet the expectations of Kuwait&apos;s regulators and clinicians
            alike.
          </p>
        </div>

        {/* Rail — full-bleed so cards fade at the screen edge rather than
            being sliced at the shell gutter. The track carries the gutter as
            padding, so the first card still aligns with the heading. */}
        <div
          ref={viewport}
          className="u-rail-mask mt-14 lg:mt-20 lg:overflow-hidden"
        >
          <div
            ref={track}
            className="flex flex-col gap-5 px-[var(--spacing-gutter)] lg:w-max lg:flex-row lg:gap-7 lg:will-change-transform"
          >
            {THERAPEUTIC_AREAS.map((area) => (
              <article
                key={area.id}
                id={area.id}
                data-card
                className="u-fill-raised group relative flex flex-col justify-between overflow-hidden rounded-card border border-[color:var(--color-night-line)] p-8 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint/45 lg:h-[23rem] lg:w-[21rem] lg:p-9"
              >
                {/* Hover wash */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(80% 60% at 50% 100%, rgba(92,188,167,0.18), transparent 70%)",
                  }}
                />

                <div className="relative">
                  <span className="font-mono text-[0.72rem] tracking-[0.18em] text-mint/70">
                    {area.index}
                  </span>
                  <h3 className="mt-6 font-display text-head font-semibold text-mint-50">
                    {area.name}
                  </h3>
                  <p className="mt-4 text-[0.9rem] leading-relaxed text-mint-200/65">
                    {area.blurb}
                  </p>
                </div>

                <Link
                  href={`/products?area=${area.id}`}
                  className="relative mt-8 inline-flex items-center gap-2 text-[0.85rem] font-medium text-mint transition-colors duration-300 hover:text-mint-200"
                >
                  View products
                  <ArrowUpRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Progress — only meaningful while pinned */}
        <div className="u-shell mt-14 hidden lg:block">
          <div className="h-px w-full bg-[color:var(--color-night-line)]">
            <div
              data-progress
              className="h-full origin-left bg-gradient-to-r from-mint-500 to-mint"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
