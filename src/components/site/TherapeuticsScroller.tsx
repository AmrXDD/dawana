"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import { useCatalogPresence } from "@/components/site/CatalogPresence";
import { THERAPEUTIC_AREAS } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TOTAL = String(THERAPEUTIC_AREAS.length).padStart(2, "0");

/**
 * Pinned horizontal gallery of the six therapeutic areas.
 *
 * One pinned section on the page — more than that and it starts fighting
 * native scroll feel. Below `lg` this degrades to a normal vertical stack
 * rather than a touch-hostile horizontal drag.
 */
export default function TherapeuticsScroller() {
  const root = useRef<HTMLElement>(null);
  // "View products" only once something is published in the admin.
  const { hasProducts } = useCatalogPresence();
  const track = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

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

          /* The rail is long (opening statement, six areas, closing card), so
             there's a lot of ground to cover. At ~0.75px of travel per 1px of
             scroll it moves quickly enough to feel alive, while the pin still
             holds for well over two screens so every card gets its moment. */
          const pinLength = () =>
            Math.max(distance() * 1.35, window.innerHeight * 2.4);

          const skewTo = gsap.quickTo(rail, "skewX", { duration: 0.6, ease: "power3.out" });
          const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

          const tween = gsap.to(rail, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${pinLength()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              anticipatePin: 1,
              onUpdate: (self) => {
                // A slight lean into the direction of travel, so speed is felt.
                skewTo(gsap.utils.clamp(-2.5, 2.5, self.getVelocity() / -450));

                if (counter.current) {
                  const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
                  const label = String(i).padStart(2, "0");
                  if (counter.current.textContent !== label) counter.current.textContent = label;
                }
              },
              onLeave: () => skewTo(0),
              onLeaveBack: () => skewTo(0),
            },
          });

          const settle = () => skewTo(0);
          ScrollTrigger.addEventListener("scrollEnd", settle);

          cards.forEach((card) => {
            // Each card rises and brightens as it crosses into view.
            gsap.fromTo(
              card,
              { y: 60, opacity: 0.45 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: tween,
                  start: "left 100%",
                  end: "left 55%",
                  scrub: true,
                },
              },
            );

            const line = card.querySelector("[data-card-line]");
            if (line) {
              gsap.fromTo(
                line,
                { scaleX: 0 },
                {
                  scaleX: 1,
                  ease: "none",
                  scrollTrigger: {
                    trigger: card,
                    containerAnimation: tween,
                    start: "left 85%",
                    end: "left 35%",
                    scrub: true,
                  },
                },
              );
            }
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

          return () => {
            ScrollTrigger.removeEventListener("scrollEnd", settle);
            tween.kill();
          };
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
      <div className="flex h-full flex-col justify-center py-28 lg:pb-0 lg:pt-16">
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
          className="u-rail-mask mt-12 lg:mt-10 lg:overflow-hidden"
        >
          <div
            ref={track}
            className="flex flex-col gap-5 px-[var(--spacing-gutter)] lg:w-max lg:flex-row lg:items-stretch lg:gap-8 lg:py-4 lg:will-change-transform"
          >
            {/* Opening statement — desktop rail only */}
            <div className="hidden shrink-0 flex-col justify-between rounded-card border border-mint/25 bg-mint/[0.07] p-9 lg:flex lg:h-[24rem] lg:w-[22rem]">
              <p className="u-eyebrow text-mint">Scroll the portfolio</p>
              <div>
                <p className="font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-mint-50">
                  Registered, stored and delivered under one chain of custody.
                </p>
                <p className="mt-6 inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-mint-300/70">
                  {TOTAL} areas
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </p>
              </div>
            </div>

            {THERAPEUTIC_AREAS.map((area) => (
              <article
                key={area.id}
                id={area.id}
                data-card
                className="u-fill-raised group relative flex shrink-0 flex-col justify-between overflow-hidden rounded-card border border-mint/20 p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-[2px] transition-colors duration-500 hover:border-mint/55 lg:h-[24rem] lg:w-[24rem] lg:p-10"
              >
                {/* Accent line that draws in as the card arrives */}
                <span
                  aria-hidden="true"
                  data-card-line
                  className="absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-mint via-mint-300 to-transparent"
                />

                {/* Oversized index, sitting behind the copy */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-10 -right-3 select-none font-display text-[11rem] font-semibold leading-none tracking-tighter text-mint/[0.07] transition-colors duration-500 group-hover:text-mint/[0.12]"
                >
                  {area.index}
                </span>

                {/* Hover wash */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(80% 60% at 50% 100%, rgba(92,188,167,0.2), transparent 70%)",
                  }}
                />

                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-capsule border border-mint/30 bg-mint/10 px-3 py-1 font-mono text-[0.7rem] tracking-[0.18em] text-mint">
                    {area.index} / {TOTAL}
                  </span>
                  <h3 className="mt-7 font-display text-head font-semibold text-mint-50">
                    {area.name}
                  </h3>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-mint-100/80">
                    {area.blurb}
                  </p>
                </div>

                {hasProducts && (
                  <Link
                    href={`/products?area=${area.id}`}
                    className="relative mt-8 inline-flex items-center gap-2 text-[0.88rem] font-medium text-mint transition-colors duration-300 hover:text-mint-200"
                  >
                    View products
                    <ArrowUpRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </article>
            ))}

            {/* Closing card — desktop rail only */}
            <div className="hidden shrink-0 flex-col justify-between rounded-card bg-mint p-9 text-mint-950 lg:flex lg:h-[24rem] lg:w-[22rem]">
              <p className="u-eyebrow text-deep/70">For partners</p>
              <div>
                <p className="font-display text-[1.9rem] font-semibold leading-[1.1] tracking-tight">
                  Bringing a product to Kuwait?
                </p>
                <Link
                  href="/contact"
                  className="mt-7 inline-flex items-center gap-2 rounded-capsule bg-deep px-5 py-3 text-[0.88rem] font-medium text-mint-50 transition-colors duration-300 hover:bg-mint-950"
                >
                  Talk to our team
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress — only meaningful while pinned */}
        <div className="u-shell mt-10 hidden items-center gap-6 lg:flex">
          <p className="shrink-0 font-mono text-[0.78rem] tabular-nums tracking-[0.14em] text-mint-200/70">
            <span ref={counter} className="text-mint">01</span>
            <span className="text-mint-300/40"> / {TOTAL}</span>
          </p>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              data-progress
              className="h-full origin-left rounded-full bg-gradient-to-r from-mint-500 to-mint shadow-[0_0_14px_rgba(92,188,167,0.7)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
