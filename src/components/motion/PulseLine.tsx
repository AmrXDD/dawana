"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Builds one ECG cycle: P wave → QRS complex → T wave, then baseline.
 * The QRS is deliberately asymmetric (tall R, deep S) to echo the spike
 * that forms the "W" in the Dawana wordmark.
 */
function beat(x: number, w: number, b: number, amp: number) {
  const p = (f: number) => x + w * f;
  return [
    `L ${p(0.1).toFixed(2)} ${b}`,
    // P wave — gentle rounded bump
    `Q ${p(0.16).toFixed(2)} ${(b - amp * 0.16).toFixed(2)} ${p(0.22).toFixed(2)} ${b}`,
    `L ${p(0.36).toFixed(2)} ${b}`,
    // QRS — Q dip, R spike, S undershoot
    `L ${p(0.4).toFixed(2)} ${(b + amp * 0.1).toFixed(2)}`,
    `L ${p(0.46).toFixed(2)} ${(b - amp).toFixed(2)}`,
    `L ${p(0.52).toFixed(2)} ${(b + amp * 0.55).toFixed(2)}`,
    `L ${p(0.57).toFixed(2)} ${b}`,
    `L ${p(0.68).toFixed(2)} ${b}`,
    // T wave — broad recovery bump
    `Q ${p(0.76).toFixed(2)} ${(b - amp * 0.28).toFixed(2)} ${p(0.84).toFixed(2)} ${b}`,
    `L ${p(1).toFixed(2)} ${b}`,
  ].join(" ");
}

export function buildPulsePath(
  width: number,
  height: number,
  beats: number,
  amp = height * 0.36,
) {
  const b = height / 2;
  const w = width / beats;
  let d = `M 0 ${b}`;
  for (let i = 0; i < beats; i++) d += " " + beat(i * w, w, b, amp);
  return d;
}

interface PulseLineProps {
  className?: string;
  width?: number;
  height?: number;
  beats?: number;
  strokeWidth?: number;
  color?: string;
  /** Draw on scroll into view instead of on mount. */
  onScroll?: boolean;
  /** Animate a travelling blip along the trace. */
  blip?: boolean;
  duration?: number;
  delay?: number;
  /** Loop the draw forever (used for ambient decoration). */
  loop?: boolean;
}

export default function PulseLine({
  className,
  width = 1200,
  height = 160,
  beats = 4,
  strokeWidth = 2.5,
  color = "currentColor",
  onScroll = true,
  blip = false,
  duration = 2.6,
  delay = 0,
  loop = false,
}: PulseLineProps) {
  const root = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const d = useMemo(
    () => buildPulsePath(width, height, beats),
    [width, height, beats],
  );

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return;

      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      const tl = gsap.timeline({
        delay,
        repeat: loop ? -1 : 0,
        repeatDelay: loop ? 1.2 : 0,
        ...(onScroll
          ? {
              scrollTrigger: {
                trigger: root.current,
                start: "top 88%",
                once: !loop,
              },
            }
          : {}),
      });

      tl.to(path, {
        strokeDashoffset: 0,
        duration,
        ease: loop ? "none" : "power2.inOut",
      });

      if (blip && dotRef.current) {
        const dot = dotRef.current;
        gsap.set(dot, { opacity: 1 });
        tl.to(
          { t: 0 },
          {
            t: 1,
            duration,
            ease: loop ? "none" : "power2.inOut",
            onUpdate() {
              const pt = path.getPointAtLength(
                (this.targets()[0] as { t: number }).t * len,
              );
              gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
            },
          },
          0,
        );
      }
    },
    { scope: root, dependencies: [d] },
  );

  return (
    <svg
      ref={root}
      className={cn("block w-full overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        ref={pathRef}
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {blip && (
        <circle
          ref={dotRef}
          r={5}
          cx={0}
          cy={height / 2}
          fill={color}
          opacity={0}
          style={{ filter: "drop-shadow(0 0 8px currentColor)" }}
        />
      )}
    </svg>
  );
}

/**
 * Ambient continuously-scrolling trace used behind dark sections.
 * Pure CSS translate on a duplicated path — no JS per frame.
 */
export function PulseTicker({
  className,
  color = "currentColor",
  speed = 26,
  opacity = 0.5,
}: {
  className?: string;
  color?: string;
  speed?: number;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const d = useMemo(() => buildPulsePath(800, 120, 3, 34), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--speed", `${speed}s`);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={cn("pointer-events-none overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* h-full matters: without it the SVGs collapse to auto height and the
          trace renders as sparse chevrons instead of a continuous line. */}
      <div className="a-marquee flex h-full w-[200%]">
        {[0, 1].map((i) => (
          <svg
            key={i}
            viewBox="0 0 800 120"
            className="h-full w-1/2 shrink-0"
            fill="none"
            preserveAspectRatio="none"
            style={{ opacity }}
          >
            <path
              d={d}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}
