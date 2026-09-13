"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "@/components/motion/SplitText";
import { CHANNELS } from "@/lib/brand";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * Accordion-style channel list. Rows expand on hover (pointer) and on
 * focus/click (keyboard + touch), so the interaction is never hover-only.
 */
export default function Channels() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
      rows.forEach((row, i) => {
        const body = row.querySelector("[data-body]") as HTMLElement | null;
        if (!body) return;
        gsap.to(body, {
          height: i === active ? "auto" : 0,
          opacity: i === active ? 1 : 0,
          duration: 0.55,
          ease: "power3.out",
        });
      });
    },
    { scope: root, dependencies: [active] },
  );

  return (
    <section className="relative u-band">
      <div className="u-shell">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="u-eyebrow text-mint-600">Where we operate</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-5 font-display text-title font-semibold text-deep"
            >
              Three channels, end to end.
            </SplitText>
          </div>

          <div ref={root} className="border-t border-[color:var(--color-hairline)]">
            {CHANNELS.map((channel, i) => (
              <div
                key={channel.id}
                data-row
                className="border-b border-[color:var(--color-hairline)]"
              >
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-expanded={active === i}
                  className="flex w-full items-center justify-between gap-6 py-7 text-left"
                >
                  <span className="flex items-baseline gap-5">
                    <span
                      className={cn(
                        "font-mono text-[0.72rem] tracking-[0.18em] transition-colors duration-300",
                        active === i ? "text-mint-500" : "text-ink-faint",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-display text-[1.45rem] font-semibold tracking-tight transition-colors duration-300 sm:text-[1.7rem]",
                        active === i ? "text-deep" : "text-ink-soft",
                      )}
                    >
                      {channel.title}
                    </span>
                  </span>

                  {/* Plus/minus built from two rules — rotates rather than swaps */}
                  <span
                    aria-hidden="true"
                    className="relative grid size-8 shrink-0 place-items-center"
                  >
                    <span className="absolute h-px w-3.5 bg-deep" />
                    <span
                      className={cn(
                        "absolute h-px w-3.5 bg-deep transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        active === i ? "rotate-0" : "rotate-90",
                      )}
                    />
                  </span>
                </button>

                <div data-body className="overflow-hidden opacity-0" style={{ height: 0 }}>
                  <p className="max-w-xl pb-8 pl-[3.1rem] text-[0.98rem] leading-relaxed text-ink-soft">
                    {channel.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
