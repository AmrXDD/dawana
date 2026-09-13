"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

gsap.registerPlugin(ScrollTrigger);

/**
 * Route transition.
 *
 * The App Router swaps children synchronously, so an exit animation would
 * need the outgoing tree kept alive — brittle, and it delays navigation.
 * Instead this plays an *enter* animation on the incoming page plus a brand
 * veil that wipes away over it.
 *
 * CRITICAL: the enter animation class is removed the moment it finishes.
 * A lingering `transform` or `filter` (which `animation-fill-mode: both`
 * leaves behind, even as `translate3d(0,0,0)` / `blur(0)`) turns this div
 * into the containing block for `position: fixed` descendants — which is
 * exactly how ScrollTrigger implements pinning. Leaving it on made the
 * pinned horizontal section position against this wrapper instead of the
 * viewport: it vanished, the scroll ran past it, and it reappeared after
 * the pin released. Hence: animate, then get out of the way.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const first = useRef(true);
  const [veil, setVeil] = useState(false);
  const [entering, setEntering] = useState(true);

  const settle = useCallback(() => {
    setEntering(false);
    // Pins must re-measure now that no ancestor transform distorts layout.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  useEffect(() => {
    setEntering(true);

    // Don't veil the very first paint — that's page load, not a transition.
    if (first.current) {
      first.current = false;
    } else {
      window.scrollTo(0, 0);
      setVeil(true);
    }

    const hideVeil = window.setTimeout(() => setVeil(false), 760);
    // Safety net: `prefers-reduced-motion` disables the animation, so no
    // animationend ever fires and the class would otherwise stick.
    const fallback = window.setTimeout(settle, 900);

    return () => {
      window.clearTimeout(hideVeil);
      window.clearTimeout(fallback);
    };
  }, [pathname, settle]);

  return (
    <>
      {veil && (
        <div
          aria-hidden="true"
          className="a-veil-out pointer-events-none fixed inset-0 z-[70]"
          style={{
            background:
              "linear-gradient(180deg, #04221f 0%, #035a51 55%, #5cbca7 100%)",
          }}
        />
      )}

      <div
        key={pathname}
        className={entering ? "a-page-in" : undefined}
        onAnimationEnd={(e) => {
          // Ignore bubbling from decorative child animations (marquee, blip).
          if (e.animationName !== "page-in") return;
          settle();
        }}
      >
        {children}
      </div>
    </>
  );
}
