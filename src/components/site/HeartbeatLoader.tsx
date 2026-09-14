"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { BRAND } from "@/lib/brand";

/* ─────────────────────────────────────────────────────────────────────────
   Loader — the wordmark and a single heartbeat, then it becomes the header.

   The wordmark wipes in along the direction the trace travels. A hairline
   beneath it fills as the page genuinely loads, with a soft dot riding the
   tip; when the fill crosses the R-peak (the spike that forms the "w" in the
   logo) the wordmark takes one gentle beat. The tagline settles in beneath.

   The exit is the point: rather than fading away and letting the site pop in,
   the wordmark glides into its exact place in the navigation while the site
   fades up underneath, then hands over to the real nav logo on landing. The
   loader is transparent over the shared backdrop, so the ground never changes.

   GSAP-free on purpose: SiteGate pauses GSAP's global timeline while this is
   up, so it runs on requestAnimationFrame, CSS and the Web Animations API.
   ───────────────────────────────────────────────────────────────────────── */

const TRACE: ReadonlyArray<readonly [number, number]> = [
  [1, 12],
  [118, 12],
  [124, 2], // R-peak
  [130, 22],
  [135, 12],
  [159, 12],
];
const PULSE = `M ${TRACE.map(([x, y]) => `${x} ${y}`).join(" L ")}`;

/** How far along the trace the R-peak sits — the moment the logo beats. */
const R_PEAK_AT = (() => {
  let total = 0;
  let toPeak = 0;
  for (let i = 1; i < TRACE.length; i++) {
    const [x0, y0] = TRACE[i - 1];
    const [x1, y1] = TRACE[i];
    total += Math.hypot(x1 - x0, y1 - y0);
    if (i === 2) toPeak = total;
  }
  return toPeak / total;
})();

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

interface HeartbeatLoaderProps {
  /** Fired as the site should begin fading in. */
  onOpen: () => void;
  /** Fired once the handover is complete — safe to unmount. */
  onDone: () => void;
}

export default function HeartbeatLoader({ onOpen, onDone }: HeartbeatLoaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const flip = useRef<HTMLDivElement>(null);
  const beat = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const head = useRef<SVGCircleElement>(null);

  // Latest callbacks without re-running the effect.
  const openRef = useRef(onOpen);
  const doneRef = useRef(onDone);
  openRef.current = onOpen;
  doneRef.current = onDone;

  useEffect(() => {
    const path = fill.current;
    const dot = head.current;
    const mark = flip.current;
    if (!root.current || !path || !dot || !mark) {
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

    // Long enough for the gesture to read; brisk on repeat visits.
    const MIN = reduced ? 400 : seen ? 900 : 1900;
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

    /* The logo must only ever be seen once. While this attribute is set, CSS
       keeps the navigation's own logo invisible, so as the site fades in there
       is an empty slot rather than a second logo waiting where this one lands.
       Every exit path — and unmount — releases it. */
    const html = document.documentElement;
    html.dataset.logoHandoff = "pending";
    const releaseLogo = () => {
      delete html.dataset.logoHandoff;
    };

    const t0 = performance.now();
    let last = t0;
    let shown = 0;
    let raf = 0;
    let finished = false;
    let beaten = false;

    /* One gentle beat. Lives on an inner wrapper so it composes with the
       exit glide on the outer one instead of fighting it for `transform`. */
    const beatOnce = () => {
      beaten = true;
      beat.current?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.022)", offset: 0.3 },
          { transform: "scale(0.996)", offset: 0.62 },
          { transform: "scale(1)" },
        ],
        { duration: 760, easing: EASE_OUT },
      );
    };

    /* ---- Exit: the wordmark becomes the navigation logo ---- */
    const exit = () => {
      trail.current?.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(6px)" },
        ],
        { duration: 480, easing: EASE_OUT, fill: "forwards" },
      );

      // The nav is rendered (just hidden) behind the loader, so it can be
      // measured before the site is visible.
      const target = document.querySelector<HTMLElement>(".dawana-nav .logo");
      const from = mark.getBoundingClientRect();
      const to = target?.getBoundingClientRect();
      const canGlide = !reduced && !!to && to.height > 0 && from.height > 0;

      if (!canGlide || !to) {
        mark.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 600,
          delay: 120,
          easing: EASE_OUT,
          fill: "forwards",
        });
        // No glide (reduced motion, or no nav to land on): this copy fades
        // out first, then the site — and its logo — fade in. Still only one.
        later(() => {
          releaseLogo();
          openRef.current();
        }, 720);
        later(() => doneRef.current(), 820);
        return;
      }

      // Centre-to-centre, so a not-yet-sized nav image still lands correctly.
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = to.height / from.height;

      const glide = mark.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(1)" },
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})` },
        ],
        { duration: 1050, delay: 140, easing: EASE_IN_OUT, fill: "forwards" },
      );

      // The site fades up underneath while the mark is in flight — with an
      // empty slot in the nav where the logo will land. Early enough that the
      // fade (0.9s) is effectively complete by the landing frame.
      later(() => openRef.current(), 520);

      /* Landing. In the same frame the travelling mark vanishes and the nav's
         logo appears: identical file, identical size and position, so the
         swap is invisible — no crossfade, and never two logos at once. Bound
         to the animation's own finish rather than a guessed timeout, with a
         timer as a backstop in case the tab is hidden mid-flight and the
         animation clock stops. */
      let landed = false;
      const land = () => {
        if (landed) return;
        landed = true;
        mark.style.visibility = "hidden";
        releaseLogo();
        later(() => doneRef.current(), 120);
      };
      glide.onfinish = land;
      later(land, 140 + 1050 + 400);
    };

    const finish = (animate: boolean) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      path.style.strokeDashoffset = "0";
      dot.style.opacity = "0";
      try {
        sessionStorage.setItem("dw-loaded", "1");
      } catch {
        /* private mode */
      }

      if (!animate) {
        releaseLogo();
        openRef.current();
        doneRef.current();
        return;
      }

      if (!beaten && !reduced) beatOnce();
      // Let the beat land before the mark starts to move.
      later(exit, reduced ? 0 : 520);
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

      shown += (target - shown) * (1 - Math.exp(-dt / 150));
      if (target === 1 && shown > 0.995) shown = 1;

      path.style.strokeDashoffset = `${len * (1 - shown)}`;

      const tip = path.getPointAtLength(len * shown);
      dot.setAttribute("cx", `${tip.x}`);
      dot.setAttribute("cy", `${tip.y}`);
      dot.style.opacity = shown > 0.01 && shown < 1 ? "1" : "0";

      if (!beaten && !reduced && shown >= R_PEAK_AT) beatOnce();
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
      // Never leave the nav logo hidden, whatever path got us here.
      releaseLogo();
    };
  }, []);

  return (
    // Transparent: the site's own backdrop is the ground, so nothing behind
    // the mark changes when the site fades in.
    <div ref={root} className="dw-loader fixed inset-0 z-[100] grid place-items-center">
      <div className="flex flex-col items-center">
        <div ref={flip} className="will-change-transform">
          <div ref={beat}>
            <Image
              src="/brand/dawana-wordmark.png"
              alt=""
              width={1804}
              height={783}
              priority
              // Same file URL as the nav logo, not a resized variant: the landing
              // swap shows the identical bitmap, already decoded and cached.
              unoptimized
              className="dw-loader__word h-auto w-[136px] md:w-[160px]"
            />
          </div>
        </div>

        <div ref={trail} className="mt-6 flex flex-col items-center">
          <svg
            viewBox="0 0 160 24"
            className="h-auto w-[136px] overflow-visible md:w-[160px]"
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
              ref={fill}
              d={PULSE}
              stroke="#5cbca7"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Tip */}
            <circle ref={head} r={2.4} cx={1} cy={12} fill="#5cbca7" className="dw-loader__head" />
          </svg>

          <p className="dw-loader__tagline u-eyebrow mt-5 text-mint-600">{BRAND.tagline}</p>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        Loading {BRAND.name}
      </p>
    </div>
  );
}
