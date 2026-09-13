"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Positive drifts down, negative drifts up, as a % of element height. */
  speed?: number;
  rotate?: number;
  scrub?: number | boolean;
}

/** Scrub-linked drift. Transform-only, so it stays on the compositor. */
export default function Parallax({
  children,
  className,
  speed = -12,
  rotate = 0,
  scrub = 1,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.fromTo(
        el,
        { yPercent: -speed / 2, rotate: -rotate / 2 },
        {
          yPercent: speed / 2,
          rotate: rotate / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
