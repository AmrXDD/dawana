"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import PulseLine from "@/components/motion/PulseLine";
import Magnetic from "@/components/motion/Magnetic";
import { ButtonLink } from "@/components/ui/Button";
import SideRays from "@/components/SideRays";
import { useSiteReady } from "@/components/site/SiteGate";
import { BRAND, CONTACT, PALETTE } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The fold. Three layers moving at different rates:
 *   1. the capsule field (slowest, decorative)
 *   2. the headline block (mask-revealed on load)
 *   3. the ECG trace, which draws across the baseline of the type
 * On scroll, the whole stack lifts and fades so the next section feels like
 * it is arriving rather than merely following.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  // The WebGL context spins up only once the loader has opened.
  const ready = useSiteReady();

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Entrance chain — meta, rule, then supporting content.
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        "[data-hero-eyebrow]",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.1,
      )
        .fromTo(
          "[data-hero-rule]",
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: "power3.inOut" },
          0.2,
        )
        .fromTo(
          "[data-hero-sub]",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 1 },
          0.95,
        )
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.08 },
          1.08,
        )
        .fromTo(
          "[data-hero-meta]",
          { opacity: 0 },
          { opacity: 1, duration: 1.2 },
          1.3,
        )
        .fromTo(
          "[data-capsule]",
          { opacity: 0, scale: 0.82, rotate: -8 },
          {
            // Each capsule declares its own resting opacity via data-op.
            // Tweening to a flat 1 would blow out the watermark, which is
            // meant to sit at ~7%.
            opacity: (_i, el: Element) =>
              Number((el as HTMLElement).dataset.op ?? 1),
            scale: 1,
            rotate: 0,
            duration: 1.8,
            stagger: 0.12,
            ease: "elastic.out(1, 0.72)",
          },
          0.45,
        );

      if (reduced) return;

      // Capsules drift on scroll at staggered depths.
      gsap.utils.toArray<HTMLElement>("[data-capsule]").forEach((el, i) => {
        gsap.to(el, {
          yPercent: -18 - i * 14,
          rotate: i % 2 ? 10 : -10,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 1.1 },
        });
      });

      // The fold lifts away as the next band arrives.
      gsap.to("[data-hero-stack]", {
        yPercent: -12,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden u-grain pb-24 pt-32 md:pb-32"
    >
      {/* Volumetric light from the upper right. Kept low-saturation and
          low-opacity so it reads as clinical daylight, not a nightclub. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.55]"
      >
        {ready && (
        <SideRays
          speed={1.1}
          rayColor1={PALETTE.mint}
          rayColor2="#a8dcd0"
          intensity={1.05}
          spread={1.5}
          origin="top-right"
          tilt={-6}
          saturation={0.85}
          blend={0.6}
          falloff={1.9}
          opacity={0.55}
        />
        )}
      </div>

      {/* Ground wash — mint bleeding out of the lower-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 85% at 78% 108%, rgba(92,188,167,0.22) 0%, rgba(92,188,167,0.04) 42%, transparent 70%)",
        }}
      />

      {/* Capsule field — the pill motif lifted from the brand mark */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Image
          data-capsule
          data-op="0.07"
          src="/brand/dawana-monogram.png"
          alt=""
          width={703}
          height={799}
          className="absolute right-[4%] top-[14%] w-[150px] md:w-[240px]"
        />
        <span
          data-capsule
          data-op="1"
          className="absolute left-[6%] top-[18%] block h-28 w-12 rounded-capsule bg-mint/15 md:h-44 md:w-20"
        />
        <span
          data-capsule
          data-op="1"
          className="absolute bottom-[16%] left-[16%] block h-16 w-16 rounded-capsule border border-mint/25 md:h-24 md:w-24"
        />
        <span
          data-capsule
          data-op="1"
          className="absolute right-[22%] top-[8%] block h-10 w-24 rounded-capsule bg-deep/10 md:h-14 md:w-36"
        />
      </div>

      <div data-hero-stack className="u-shell relative z-10">
        <p data-hero-eyebrow className="u-eyebrow flex items-center gap-3 text-mint-600">
          <span className="a-blip inline-block size-1.5 rounded-full bg-mint" />
          Pharmaceutical distribution · {CONTACT.city}
        </p>

        <h1 className="mt-7 font-display text-hero font-semibold text-deep">
          <SplitText immediate delay={0.28} mode="words" duration={1.15}>
            Your Everyday
          </SplitText>
          <span className="relative block">
            <SplitText immediate delay={0.44} mode="words" duration={1.15} className="text-mint-500">
              Remedy
            </SplitText>
            {/* The trace runs out of the final word and off the page */}
            <PulseLine
              className="absolute left-[9.5em] top-1/2 hidden h-16 w-[min(46vw,620px)] -translate-y-1/2 text-mint lg:block"
              onScroll={false}
              blip
              beats={3}
              delay={1.1}
              duration={2.4}
              strokeWidth={2}
              height={120}
              width={620}
            />
          </span>
        </h1>

        <div
          data-hero-rule
          className="u-rule mt-10 w-full max-w-2xl origin-left"
          aria-hidden="true"
        />

        <p
          data-hero-sub
          className="mt-8 max-w-xl text-lede text-ink-soft"
        >
          Built on more than 25 years of leadership experience, {BRAND.name} supplies
          the private and government healthcare sectors across Kuwait — with
          integrity, consistency, and an unbroken chain of quality.
        </p>

        <div className="mt-11 flex flex-wrap items-center gap-3">
          <span data-hero-cta className="inline-block">
            <Magnetic>
              <ButtonLink href="/therapeutics" size="lg" arrow>
                Explore therapeutics
              </ButtonLink>
            </Magnetic>
          </span>
          <span data-hero-cta className="inline-block">
            <ButtonLink href="/about" size="lg" variant="outline">
              Our story
            </ButtonLink>
          </span>
        </div>

        {/* Foot meta — anchors the fold and adds credibility without a stat wall */}
        <dl
          data-hero-meta
          className="mt-20 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-7 border-t border-[color:var(--color-hairline)] pt-8 sm:grid-cols-4"
        >
          {[
            { k: "Established", v: String(BRAND.founded) },
            { k: "Leadership", v: "25+ yrs" },
            { k: "Therapeutic areas", v: "06" },
            { k: "Sectors", v: "Public & private" },
          ].map((item) => (
            <div key={item.k}>
              <dt className="u-eyebrow text-ink-faint">{item.k}</dt>
              <dd className="mt-2 font-display text-[1.35rem] font-semibold tracking-tight text-deep">
                {item.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href="#intro"
        aria-label="Scroll to content"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink-faint transition-colors hover:text-deep md:flex"
      >
        <span className="u-eyebrow">Scroll</span>
        <ArrowDown className="size-4 animate-bounce" strokeWidth={1.5} />
      </a>
    </section>
  );
}
