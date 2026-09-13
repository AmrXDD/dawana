"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import { MISSION, VISION } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Two statements on a bone ground, separated by a vertical hairline that
 * draws itself as the section enters — a quiet nod to the ECG baseline.
 */
export default function MissionVision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-divider]",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: "power3.inOut",
          scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
        },
      );
    },
    { scope: root },
  );

  const panels = [MISSION, VISION];

  return (
    <section ref={root} className="relative u-band">
      <div className="u-shell">
        <div className="relative grid gap-16 md:grid-cols-2 md:gap-0">
          {/* Centre rule */}
          <div
            data-divider
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 hidden w-px origin-top bg-[color:var(--color-hairline)] md:block"
          />

          {panels.map((panel, i) => (
            <div key={panel.title} className={i === 0 ? "md:pr-16" : "md:pl-16"}>
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[0.72rem] tracking-[0.2em] text-mint-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <SplitText
                  as="h2"
                  mode="chars"
                  className="font-display text-title font-semibold text-deep"
                >
                  {panel.title}
                </SplitText>
              </div>

              <Reveal delay={0.08}>
                <p className="mt-8 text-lede leading-relaxed text-ink-soft">
                  {panel.body}
                </p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
