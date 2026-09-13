"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the wrapper as one block. */
  stagger?: boolean;
  /** Per-item stagger in seconds. Kept ≤0.08 so long lists never feel laggy. */
  each?: number;
  y?: number;
  delay?: number;
  duration?: number;
  start?: string;
  /** Adds a slight scale-in. Use sparingly — cards only, never body copy. */
  scale?: boolean;
}

/**
 * The workhorse scroll reveal. Deliberately restrained: 16–28px of travel and
 * an opacity fade, nothing that reads as "sliding in". Anything louder is
 * handled by SplitText or a pinned timeline instead.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  each = 0.07,
  y = 22,
  delay = 0,
  duration = 0.8,
  start = "top 86%",
  scale = false,
}: RevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const targets = stagger ? Array.from(el.children) : [el];
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y, ...(scale ? { scale: 0.97 } : {}) },
        {
          opacity: 1,
          y: 0,
          ...(scale ? { scale: 1 } : {}),
          duration,
          delay,
          ease: "power3.out",
          stagger: stagger ? each : 0,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn(className)}>
      {children}
    </div>
  );
}
