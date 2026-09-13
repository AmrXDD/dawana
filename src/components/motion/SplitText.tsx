"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Mode = "words" | "chars" | "lines";

interface SplitTextProps {
  children: string;
  as?: ElementType;
  className?: string;
  /** Split granularity. `chars` is reserved for short headlines. */
  mode?: Mode;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Start immediately instead of waiting for the viewport. */
  immediate?: boolean;
  start?: string;
}

/**
 * Accessible mask-reveal for headlines.
 *
 * GSAP's official SplitText is a paid Club plugin, so this is a hand-rolled
 * equivalent: the real string stays in an sr-only node for screen readers and
 * copy/paste, while the visual shards are aria-hidden. Each shard sits inside
 * an overflow-hidden mask so it rises from behind a hard edge — the same
 * gesture as the ECG line clearing the baseline in the logo.
 */
export default function SplitText({
  children,
  as: Tag = "span",
  className,
  mode = "words",
  delay = 0,
  stagger,
  duration = 0.9,
  immediate = false,
  start = "top 85%",
}: SplitTextProps) {
  const root = useRef<HTMLElement>(null);

  const pieces =
    mode === "chars"
      ? Array.from(children)
      : children.split(/(\s+)/).filter((s) => s.length > 0);

  const step = stagger ?? (mode === "chars" ? 0.018 : 0.055);

  useGSAP(
    () => {
      const targets = root.current?.querySelectorAll("[data-shard]");
      if (!targets?.length) return;

      gsap.set(targets, { yPercent: 115, rotate: mode === "chars" ? 2 : 1.4 });

      gsap.to(targets, {
        yPercent: 0,
        rotate: 0,
        duration,
        delay,
        ease: "expo.out",
        stagger: step,
        ...(immediate
          ? {}
          : {
              scrollTrigger: {
                trigger: root.current,
                start,
                once: true,
              },
            }),
      });
    },
    { scope: root, dependencies: [children] },
  );

  return (
    <Tag ref={root} className={cn("u-balance", className)}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {pieces.map((piece, i) =>
          /^\s+$/.test(piece) ? (
            <span key={i}> </span>
          ) : (
            <span
              key={i}
              className="u-mask align-bottom"
              // Inline so nothing in the cascade can turn a shard into a
              // block and stack the headline one word per line.
              style={{ display: "inline-block", verticalAlign: "bottom" }}
            >
              <span data-shard className="inline-block will-change-transform">
                {piece}
              </span>
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
