"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Drives the whole page with Lenis and hands scroll ownership to GSAP's
 * ScrollTrigger so pinned sections stay in sync with the eased scroll
 * position. Without this marriage, pinning visibly drifts.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 0.95,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Fonts and images change layout height; refresh once settled.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    // Let anchor links and the nav drive Lenis rather than native scrolling.
    const onAnchor = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onAnchor);

    return () => {
      document.removeEventListener("click", onAnchor);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
