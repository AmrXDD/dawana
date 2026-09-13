"use client";

import { useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { buildPulsePath } from "@/components/motion/PulseLine";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The single heartbeat that sits on the CTA↔footer seam.
 *
 * Previously there were two traces — one ending the CTA band, one starting
 * the footer — which read as a duplicated motif across a hard colour break.
 * This is one continuous trace straddling the boundary: it draws in on
 * scroll, then a blip travels it forever, and its stroke is a gradient that
 * fades at both ends so it never terminates in a hard stop.
 */
export default function SeamPulse({ className }: { className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const W = 1600;
  const H = 150;
  const d = useMemo(() => buildPulsePath(W, H, 7, 42), []);

  useGSAP(
    () => {
      const path = pathRef.current;
      const dot = dotRef.current;
      if (!path) return;

      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 2.6,
        ease: "power2.inOut",
        scrollTrigger: { trigger: root.current, start: "top 95%", once: true },
      });

      if (!dot) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Blip runs the trace on a loop once the line exists.
      const state = { t: 0 };
      gsap.to(state, {
        t: 1,
        duration: 6,
        ease: "none",
        repeat: -1,
        delay: 1.4,
        onUpdate() {
          const pt = path.getPointAtLength(state.t * len);
          gsap.set(dot, { attr: { cx: pt.x, cy: pt.y }, opacity: 1 });
        },
      });
    },
    { scope: root },
  );

  return (
    <svg
      ref={root}
      className={cn("block w-full overflow-visible", className)}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Fades at both ends so the trace never stops abruptly */}
        <linearGradient id="seam-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5cbca7" stopOpacity="0" />
          <stop offset="18%" stopColor="#5cbca7" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#8ed4c2" stopOpacity="0.95" />
          <stop offset="82%" stopColor="#5cbca7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5cbca7" stopOpacity="0" />
        </linearGradient>

        <filter id="seam-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft underglow so the line sits in the gradient, not on top of it */}
      <path
        d={d}
        stroke="url(#seam-stroke)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.22}
        filter="url(#seam-glow)"
      />

      <path
        ref={pathRef}
        d={d}
        stroke="url(#seam-stroke)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      <circle
        ref={dotRef}
        r={4.5}
        cx={0}
        cy={H / 2}
        fill="#b9e6d9"
        opacity={0}
        style={{ filter: "drop-shadow(0 0 7px rgba(92,188,167,0.9))" }}
      />
    </svg>
  );
}
