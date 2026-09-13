"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Pull strength as a fraction of cursor offset. Clamped so the element
   *  never escapes its own hit box. */
  strength?: number;
  /** Inner content lags slightly behind the shell for a layered feel. */
  innerStrength?: number;
}

/**
 * Cursor-following magnetism for the one or two focal CTAs per screen.
 * Uses gsap.quickTo so we interpolate instead of creating a tween per
 * mousemove event — no GC churn, no debounce needed.
 */
export default function Magnetic({
  children,
  className,
  strength = 0.32,
  innerStrength = 0.16,
}: MagneticProps) {
  const shell = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = shell.current;
      const inn = inner.current;
      if (!el || !inn) return;

      // Pointer-coarse devices have no hover; skip entirely.
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const cfg = { duration: 0.55, ease: "elastic.out(1, 0.55)" };
      const xTo = gsap.quickTo(el, "x", cfg);
      const yTo = gsap.quickTo(el, "y", cfg);
      const ixTo = gsap.quickTo(inn, "x", { duration: 0.7, ease: "power3.out" });
      const iyTo = gsap.quickTo(inn, "y", { duration: 0.7, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo(dx * innerStrength);
        iyTo(dy * innerStrength);
      };

      const onLeave = () => {
        xTo(0);
        yTo(0);
        ixTo(0);
        iyTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: shell },
  );

  return (
    <span ref={shell} className={cn("inline-block will-change-transform", className)}>
      <span ref={inner} className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  );
}
