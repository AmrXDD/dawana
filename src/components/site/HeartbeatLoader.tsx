"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { BRAND } from "@/lib/brand";

/* ─────────────────────────────────────────────────────────────────────────
   Loader — the wordmark and a single heartbeat.

   A hairline beneath the logo fills as the page genuinely loads and ends in
   one pulse — the same spike that forms the "w" in the wordmark — then the
   whole thing fades into the site. Same bone ground as the page, so the
   handoff is a dissolve rather than a scene change.

   GSAP-free on purpose: SiteGate pauses GSAP's global timeline while this is
   up, so it runs on requestAnimationFrame and the Web Animations API.
   ───────────────────────────────────────────────────────────────────────── */

// Flat baseline, then one tall-R pulse near the end, echoing the wordmark.
const PULSE = "M1 12 H118 L124 2 L130 22 L135 12 H159";

interface HeartbeatLoaderProps {
  /** Fired as the loader starts fading — the site begins revealing. */
  onOpen: () => void;
  /** Fired once it's fully gone — safe to unmount. */
  onDone: () => void;
}

export default function HeartbeatLoader({ onOpen, onDone }: HeartbeatLoaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);

  // Latest callbacks without re-running the effect.
  const openRef = useRef(onOpen);
  const doneRef = useRef(onDone);
  openRef.current = onOpen;
  doneRef.current = onDone;

  useEffect(() => {
    const el = root.current;
    const path = line.current;
    if (!el || !path) {
      openRef.current();
      doneRef.current();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seen = false;
    try {
      seen = sessionStorage.getItem("dw-loaded") === "1";
    } catch {
      /* private mode */
    }

    // Long enough for the line to read as a gesture; brisk on repeat visits.
    const MIN = reduced ? 400 : seen ? 700 : 1500;
    // Hard ceiling — a slow asset must never hold a visitor on this screen.
    const MAX = 8000;

    /* ---- Readiness: real signals, not a fake timer ---- */
    let fontsReady = !document.fonts;
    let loaded = document.readyState === "complete";
    document.fonts?.ready.then(() => (fontsReady = true)).catch(() => (fontsReady = true));
    const onLoad = () => (loaded = true);
    if (!loaded) window.addEventListener("load", onLoad, { once: true });

    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    const t0 = performance.now();
    let last = t0;
    let shown = 0;
    let raf = 0;
    let finished = false;

    const finish = (animate: boolean) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      path.style.strokeDashoffset = "0";
      try {
        sessionStorage.setItem("dw-loaded", "1");
      } catch {
        /* private mode */
      }

      if (!animate) {
        openRef.current();
        doneRef.current();
        return;
      }

      // A brief hold so the completed beat registers, then dissolve.
      later(() => {
        openRef.current();
        const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
        el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 650,
          easing: ease,
          fill: "forwards",
        });
        mark.current?.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }],
          { duration: 650, easing: ease, fill: "forwards" },
        );
        later(() => doneRef.current(), 680);
      }, reduced ? 0 : 280);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min(64, now - last);
      last = now;
      const elapsed = now - t0;

      // Follows time but can't outrun real readiness. Never decreases.
      const readiness = (fontsReady ? 0.5 : 0) + (loaded ? 0.5 : 0);
      let target = Math.min(elapsed / MIN, 1, 0.15 + 0.85 * readiness);
      if (elapsed > MAX) target = 1;

      shown += (target - shown) * (1 - Math.exp(-dt / 140));
      if (target === 1 && shown > 0.995) shown = 1;

      path.style.strokeDashoffset = `${len * (1 - shown)}`;
      if (shown === 1) finish(true);
    };

    raf = requestAnimationFrame(frame);

    /* Watchdog. requestAnimationFrame fires no frames in a background tab or
       some JS-rendering crawlers, so the MAX cap above can't trigger there.
       If the loop has stalled, open the site outright. */
    later(() => {
      if (finished) return;
      if (performance.now() - last > 400) finish(false);
      else later(() => finish(true), 2500);
    }, MAX);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div
      ref={root}
      className="dw-loader fixed inset-0 z-[100] grid place-items-center bg-paper"
    >
      <div ref={mark} className="flex flex-col items-center gap-5">
        <Image
          src="/brand/dawana-wordmark.png"
          alt=""
          width={1804}
          height={783}
          priority
          className="h-auto w-[132px] md:w-[152px]"
        />

        <svg
          viewBox="0 0 160 24"
          className="h-auto w-[132px] overflow-visible md:w-[152px]"
          fill="none"
          aria-hidden="true"
        >
          {/* Faint track */}
          <path
            d={PULSE}
            stroke="rgba(3, 90, 81, 0.12)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Fill */}
          <path
            ref={line}
            d={PULSE}
            stroke="#5cbca7"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        Loading {BRAND.name}
      </p>
    </div>
  );
}
