"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CounterProps {
  to: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts a figure up when it scrolls into view. The final value is rendered
 * server-side inside an sr-only node so screen readers and crawlers never
 * see a meaningless "0".
 */
export default function Counter({
  to,
  from = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 2,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const display = (n: number) =>
    prefix +
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  useGSAP(
    () => {
      const el = ref.current?.querySelector("[data-count]");
      if (!el) return;

      const obj = { v: from };
      gsap.to(obj, {
        v: to,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
        onUpdate: () => {
          el.textContent = display(obj.v);
        },
      });
    },
    { scope: ref, dependencies: [to, from] },
  );

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span className="sr-only">{display(to)}</span>
      <span data-count aria-hidden="true">
        {display(from)}
      </span>
    </span>
  );
}
