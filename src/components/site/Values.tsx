"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SplitText from "@/components/motion/SplitText";
import { VALUES } from "@/lib/brand";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Bento-ish values grid. The first cell is deliberately oversized and
 * inverted so the grid has a focal point instead of six equal boxes —
 * the single most common tell of a generated layout.
 */
export default function Values() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-value]",
        { opacity: 0, y: 26, scale: 0.975 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          ease: "power3.out",
          stagger: { each: 0.06, from: "start", grid: "auto" },
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative u-band">
      <div className="u-shell">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-mint-600">Our values</p>
          <SplitText
            as="h2"
            mode="words"
            className="mt-5 font-display text-title font-semibold text-deep"
          >
            The six commitments behind every shipment.
          </SplitText>
        </div>

        <div className="mt-16 grid auto-rows-[minmax(13rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, i) => {
            const feature = i === 0;
            return (
              <article
                key={value.id}
                data-value
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-card p-8 transition-colors duration-500",
                  feature
                    ? "u-fill-deep text-mint-50 sm:col-span-2 sm:row-span-1"
                    : "border border-[color:var(--color-hairline)] bg-gradient-to-br from-white via-paper-pure to-mint-50/60 hover:border-mint-400",
                )}
              >
                {feature && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-mint/12 blur-2xl"
                  />
                )}

                <span
                  className={cn(
                    "relative font-mono text-[0.72rem] tracking-[0.18em]",
                    feature ? "text-mint" : "text-mint-500",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="relative mt-10">
                  <h3
                    className={cn(
                      "font-display font-semibold tracking-tight",
                      feature ? "text-[1.9rem] text-mint-50" : "text-[1.35rem] text-deep",
                    )}
                  >
                    {value.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 leading-relaxed",
                      feature
                        ? "max-w-md text-[1rem] text-mint-200/75"
                        : "text-[0.9rem] text-ink-soft",
                    )}
                  >
                    {value.body}
                  </p>
                </div>

                {/* Baseline that extends on hover */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-8 bottom-6 h-px origin-left scale-x-0 transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100",
                    feature ? "bg-mint/50" : "bg-mint",
                  )}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
