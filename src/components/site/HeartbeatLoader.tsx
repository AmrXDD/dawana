"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { BRAND, CONTACT } from "@/lib/brand";

/* ─────────────────────────────────────────────────────────────────────────
   Heartbeat loader — a bedside patient monitor.

   An ECG trace sweeps the screen with a phosphor trail and an erase gap
   ahead of the cursor, exactly as a real monitor redraws. The capsule
   monogram sits in a glass medallion and pulses on every R-peak. When the
   site is genuinely ready it takes one strong final beat, and the screen
   splits open along the trace line.

   Deliberately GSAP-free: SiteGate pauses GSAP's global timeline while this
   runs (so no site animation plays behind it), which would freeze any GSAP
   used here too. Canvas + the Web Animations API keep it independent.
   ───────────────────────────────────────────────────────────────────────── */

const BPM = 72;
const PERIOD = 60 / BPM; // seconds per beat
const R_PHASE = 0.27; // where the R-peak sits inside one cycle

/* PQRST as a sum of Gaussians — smoother and far more anatomically correct
   than a polyline. R is deliberately tall and S deep, echoing the spike that
   forms the "w" in the Dawana wordmark. */
const WAVES = [
  { mu: 0.12, a: 0.11, s: 0.028 }, // P
  { mu: 0.245, a: -0.14, s: 0.009 }, // Q
  { mu: R_PHASE, a: 1.0, s: 0.011 }, // R
  { mu: 0.297, a: -0.32, s: 0.012 }, // S
  { mu: 0.52, a: 0.28, s: 0.05 }, // T
];

function ecg(phase: number) {
  let y = 0;
  for (const w of WAVES) {
    const d = phase - w.mu;
    y += w.a * Math.exp(-(d * d) / (2 * w.s * w.s));
  }
  return y;
}

const STATUS: { at: number; label: string }[] = [
  { at: 0, label: "Connecting leads" },
  { at: 0.25, label: "Reading pulse" },
  { at: 0.55, label: "Stabilising rhythm" },
  { at: 0.85, label: "Checking vitals" },
];

/* The panels share one 100vh background, each showing its own half, so the
   gradient is continuous across the split line. */
const PANEL_BG =
  "radial-gradient(62% 48% at 50% 50%, rgba(92,188,167,0.17) 0%, rgba(92,188,167,0.04) 45%, transparent 72%)," +
  "linear-gradient(180deg, #020d0c 0%, #04221f 28%, #063a34 50%, #04221f 72%, #020d0c 100%)";

interface HeartbeatLoaderProps {
  /** Fired as the screen begins to split — the site should start revealing. */
  onOpen: () => void;
  /** Fired once the panels are fully clear — safe to unmount. */
  onDone: () => void;
}

export default function HeartbeatLoader({ onOpen, onDone }: HeartbeatLoaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const seam = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const medallion = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const beatDot = useRef<HTMLSpanElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const hrOut = useRef<HTMLSpanElement>(null);
  const spoOut = useRef<HTMLSpanElement>(null);
  const live = useRef<HTMLParagraphElement>(null);

  // Latest callbacks without re-running the effect.
  const openRef = useRef(onOpen);
  const doneRef = useRef(onDone);
  openRef.current = onOpen;
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      openRef.current();
      doneRef.current();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seen = false;
    try {
      seen = sessionStorage.getItem("dw-vitals") === "1";
    } catch {
      /* private mode */
    }

    // Long enough for the rhythm to read on a first visit; brisk on repeats.
    const MIN = reduced ? 900 : seen ? 1500 : 2900;
    // Hard ceiling — a slow third-party asset must never trap a visitor.
    const MAX = 8000;

    /* ---- Readiness: real signals, not a fake timer ---- */
    let fontsReady = !document.fonts;
    let loaded = document.readyState === "complete";
    document.fonts?.ready.then(() => (fontsReady = true)).catch(() => (fontsReady = true));
    const onLoad = () => (loaded = true);
    if (!loaded) window.addEventListener("load", onLoad, { once: true });

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    /* ---- Canvas geometry ---- */
    let W = 0;
    let H = 0;
    let speed = 0;
    let amp = 0;
    let mid = 0;

    const sampleY = (tSec: number) => {
      const p = (((tSec / PERIOD) % 1) + 1) % 1;
      // Faint baseline wander, like a real lead picking up breathing.
      const wander = Math.sin(tSec * 1.3) * 0.022 + Math.sin(tSec * 3.7) * 0.008;
      return mid - (ecg(p) + wander) * amp;
    };

    const strokeStyle = () => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#a8e3d4";
      ctx.lineWidth = 1.9;
      ctx.shadowColor = "#5cbca7";
      ctx.shadowBlur = 12;
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 1.5) {
        const y = sampleY(x / speed);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      strokeStyle();
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // ~3 beats per sweep, clamped so phones and ultrawides both read well.
      const beatW = Math.min(390, Math.max(170, W / 3.2));
      speed = beatW / PERIOD;
      amp = H * 0.36;
      mid = H * 0.58;
      if (reduced) drawStatic();
    };

    resize();
    window.addEventListener("resize", resize);

    /* ---- State ---- */
    const t0 = performance.now();
    let last = t0;
    let dPrev = 0;
    let lastBeat = -1;
    let progress = 0;
    let statusIdx = -1;
    let hr = 64;
    let phase: "run" | "final" | "exit" = "run";
    let raf = 0;

    const setStatus = (label: string, announce: string) => {
      if (status.current) status.current.textContent = label;
      if (live.current) live.current.textContent = announce;
    };

    /* ---- Exit: final beat, then split along the trace ---- */
    const exit = () => {
      if (phase === "exit") return;
      phase = "exit";
      try {
        sessionStorage.setItem("dw-vitals", "1");
      } catch {
        /* private mode */
      }

      if (reduced) {
        root.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 380,
          easing: "ease-out",
          fill: "forwards",
        });
        openRef.current();
        later(() => doneRef.current(), 420);
        return;
      }

      const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)";
      const inOut = "cubic-bezier(0.76, 0, 0.24, 1)";
      const outQuint = "cubic-bezier(0.22, 1, 0.36, 1)";

      // 1. One strong beat.
      medallion.current?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.16)", offset: 0.32 },
          { transform: "scale(0.94)" },
        ],
        { duration: 620, easing: spring, fill: "forwards" },
      );
      ring.current?.animate(
        [
          { transform: "scale(1)", opacity: 0.8 },
          { transform: "scale(3.4)", opacity: 0 },
        ],
        { duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
      );
      flash.current?.animate(
        [{ opacity: 0 }, { opacity: 0.55, offset: 0.22 }, { opacity: 0 }],
        { duration: 760, easing: "ease-out" },
      );

      // 2. The monitor powers down; only the trace line remains.
      ui.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 440,
        delay: 340,
        easing: "ease-out",
        fill: "forwards",
      });
      seam.current?.animate(
        [
          { opacity: 0, transform: "scaleX(0.15)" },
          { opacity: 1, transform: "scaleX(1)" },
        ],
        { duration: 560, delay: 420, easing: outQuint, fill: "forwards" },
      );

      // 3. Split open along the line — the site starts revealing as it parts.
      later(() => {
        openRef.current();
        top.current?.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,-101%,0)" }],
          { duration: 1080, easing: inOut, fill: "forwards" },
        );
        bottom.current?.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,101%,0)" }],
          { duration: 1080, easing: inOut, fill: "forwards" },
        );
        seam.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 460,
          easing: "ease-out",
          fill: "forwards",
        });
      }, 960);

      later(() => {
        cancelAnimationFrame(raf);
        doneRef.current();
      }, 960 + 1120);
    };

    /* ---- Every R-peak ---- */
    const onBeat = () => {
      medallion.current?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.055)", offset: 0.18 },
          { transform: "scale(0.99)", offset: 0.45 },
          { transform: "scale(1)" },
        ],
        { duration: 660, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      ring.current?.animate(
        [
          { transform: "scale(1)", opacity: 0.5 },
          { transform: "scale(1.95)", opacity: 0 },
        ],
        { duration: 1150, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
      beatDot.current?.animate(
        [
          { opacity: 1, transform: "scale(1.5)" },
          { opacity: 0.35, transform: "scale(1)" },
        ],
        { duration: 560, easing: "ease-out" },
      );

      // Heart rate settles toward 72 with slight natural variability.
      if (progress > 0.1 && hrOut.current) {
        hr += (BPM - hr) * 0.35 + (Math.random() - 0.5) * 1.6;
        hrOut.current.textContent = String(Math.round(hr)).padStart(3, "0");
      }
      if (progress > 0.3 && spoOut.current && spoOut.current.textContent === "--") {
        spoOut.current.textContent = "98";
      }

      if (phase === "final") exit();
    };

    /* ---- Frame loop ---- */
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min(64, now - last);
      last = now;
      const elapsed = now - t0;
      const t = elapsed / 1000;

      if (!reduced && W > 0) {
        // Phosphor decay: the older trace fades rather than vanishing.
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${1 - Math.pow(0.55, dt / 1000)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";

        let d = t * speed;
        if (d - dPrev > W) dPrev = d - W; // tab was hidden — don't replay minutes
        const x = d % W;

        // Erase gap just ahead of the cursor, wrapping at the edge.
        const gap = 28;
        ctx.clearRect(x + 3, 0, gap, H);
        if (x + 3 + gap > W) ctx.clearRect(0, 0, x + 3 + gap - W, H);

        // New segment since last frame.
        ctx.beginPath();
        let prevX = -1;
        for (let s = dPrev; s <= d + 0.001; s += 1.25) {
          const sx = s % W;
          const sy = sampleY(s / speed);
          if (prevX < 0 || sx < prevX) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
          prevX = sx;
        }
        strokeStyle();
        ctx.stroke();
        ctx.shadowBlur = 0;
        dPrev = d;

        if (head.current) {
          head.current.style.opacity = "1";
          head.current.style.transform = `translate3d(${x}px, ${sampleY(t)}px, 0)`;
        }
      } else if (!reduced && W === 0) {
        resize(); // canvas couldn't measure yet (e.g. zero-size viewport) — retry
      }

      /* R-peak crossing → beat. Driven by time, not by the canvas, so the
         medallion and readouts keep their rhythm even if drawing is skipped. */
      if (!reduced) {
        const beatNo = Math.floor(t / PERIOD - R_PHASE);
        if (beatNo !== lastBeat) {
          lastBeat = beatNo;
          if (beatNo >= 0) onBeat();
        }
      }

      /* Progress follows time but can't outrun real readiness; once both
         signals land it completes. Target never decreases, so it's monotonic. */
      if (phase === "run") {
        const readiness = (fontsReady ? 0.5 : 0) + (loaded ? 0.5 : 0);
        let target = Math.min(elapsed / MIN, 1, 0.18 + 0.82 * readiness);
        if (elapsed > MAX) target = 1;

        progress += (target - progress) * (1 - Math.exp(-dt / 170));
        if (target === 1 && progress > 0.995) progress = 1;

        if (percent.current) {
          percent.current.textContent = String(Math.floor(progress * 100)).padStart(3, "0");
        }
        if (fill.current) fill.current.style.transform = `scaleX(${progress})`;

        let idx = 0;
        for (let i = 0; i < STATUS.length; i++) if (progress >= STATUS[i].at) idx = i;
        if (idx !== statusIdx && progress < 1) {
          statusIdx = idx;
          setStatus(STATUS[idx].label, `Loading ${BRAND.name}: ${STATUS[idx].label.toLowerCase()}`);
        }

        if (progress === 1) {
          phase = "final";
          setStatus("Vitals normal", `${BRAND.name} is ready`);
          if (spoOut.current) spoOut.current.textContent = "99";
          if (reduced) exit();
          // Wait for the next R-peak so the reveal lands on the beat —
          // but never more than one full cycle.
          else later(exit, PERIOD * 1000 + 80);
        }
      }
    };

    raf = requestAnimationFrame(frame);

    /* Watchdog. The MAX cap inside the frame loop only works while frames
       run — and requestAnimationFrame fires zero frames in a background tab
       or a JS-rendering crawler. If the loop has stalled, open the site
       without the visual sequence; if it's alive, give the graceful exit a
       moment to land before forcing it. A visitor is never left on a
       hidden page. */
    const hardOpen = () => {
      if (phase === "exit") return;
      phase = "exit";
      cancelAnimationFrame(raf);
      try {
        sessionStorage.setItem("dw-vitals", "1");
      } catch {
        /* private mode */
      }
      openRef.current();
      doneRef.current();
    };
    later(() => {
      if (phase === "exit") return;
      const stalled = performance.now() - last > 400;
      if (stalled) hardOpen();
      else later(hardOpen, 3000);
    }, MAX);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", resize);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div ref={root} className="dw-loader fixed inset-0 z-[100] overflow-hidden text-mint-100">
      {/* Split panels */}
      <div
        ref={top}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[calc(50%+1px)] will-change-transform"
        style={{ backgroundImage: PANEL_BG, backgroundSize: "100% 100vh", backgroundPosition: "top" }}
      />
      <div
        ref={bottom}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 will-change-transform"
        style={{
          backgroundImage: PANEL_BG,
          backgroundSize: "100% 100vh",
          backgroundPosition: "bottom",
        }}
      />

      {/* Monitor UI */}
      <div ref={ui} aria-hidden="true" className="absolute inset-0">
        {/* ECG graph paper, strongest through the centre band */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(92,188,167,0.075) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(92,188,167,0.075) 1px, transparent 1px)," +
              "linear-gradient(to right, rgba(92,188,167,0.035) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(92,188,167,0.035) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px",
            WebkitMaskImage:
              "radial-gradient(75% 55% at 50% 50%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
            maskImage:
              "radial-gradient(75% 55% at 50% 50%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
          }}
        />

        {/* Top bar */}
        <div className="u-shell absolute inset-x-0 top-0 flex items-start justify-between gap-6 pt-7 md:pt-9">
          <div>
            <Image
              src="/brand/dawana-wordmark-light.png"
              alt=""
              width={1804}
              height={783}
              priority
              className="h-auto w-[104px] md:w-[124px]"
            />
            <p className="u-eyebrow mt-3 text-mint-400/70">{BRAND.tagline}</p>
          </div>

          <div className="flex items-center gap-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-mint-300/60 md:gap-7">
            <span className="flex items-center gap-2">
              <span
                ref={beatDot}
                className="inline-block size-1.5 rounded-full bg-mint opacity-40 shadow-[0_0_10px_#5cbca7]"
              />
              Live
            </span>
            <span className="flex items-baseline gap-1.5">
              HR
              <span ref={hrOut} className="text-[0.95rem] tracking-tight text-mint-50 tabular-nums">
                ---
              </span>
              <span className="text-mint-400/50">bpm</span>
            </span>
            <span className="hidden items-baseline gap-1.5 sm:flex">
              SpO<sub className="text-[0.55rem]">2</sub>
              <span ref={spoOut} className="text-[0.95rem] tracking-tight text-mint-50 tabular-nums">
                --
              </span>
              <span className="text-mint-400/50">%</span>
            </span>
          </div>
        </div>

        {/* Trace band */}
        <div className="absolute inset-x-0 top-1/2 h-[min(34vh,320px)] -translate-y-1/2">
          <canvas ref={canvasRef} className="block h-full w-full" />
          <div
            ref={head}
            className="pointer-events-none absolute left-0 top-0 -ml-[7px] -mt-[7px] size-3.5 rounded-full opacity-0"
            style={{
              background:
                "radial-gradient(circle, #f0faf7 0%, #8ed4c2 35%, rgba(92,188,167,0) 70%)",
              boxShadow: "0 0 18px 4px rgba(92,188,167,0.55)",
            }}
          />
        </div>

        {/* Medallion */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div ref={medallion} className="relative grid size-40 place-items-center md:size-44">
            <div
              ref={ring}
              className="absolute inset-0 rounded-full border border-mint/50 opacity-0"
            />

            {/* Slow-turning dial ticks */}
            <svg
              viewBox="0 0 200 200"
              className="dw-dial absolute -inset-5 h-[calc(100%+2.5rem)] w-[calc(100%+2.5rem)]"
            >
              <circle
                cx="100"
                cy="100"
                r="96"
                fill="none"
                stroke="rgba(92,188,167,0.28)"
                strokeWidth="1"
                strokeDasharray="1 7.4"
              />
              <circle
                cx="100"
                cy="100"
                r="96"
                fill="none"
                stroke="#5cbca7"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="42 561"
              />
            </svg>

            {/* Glass disc */}
            <div
              className="absolute inset-0 rounded-full border border-mint/25 backdrop-blur-md"
              style={{
                background:
                  "radial-gradient(circle at 50% 38%, rgba(11,59,53,0.96) 0%, rgba(4,34,31,0.97) 58%, rgba(3,90,81,0.6) 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(219,243,236,0.12), inset 0 -18px 40px rgba(2,13,12,0.6), 0 24px 60px -18px rgba(0,0,0,0.7), 0 0 60px -10px rgba(92,188,167,0.3)",
              }}
            />

            <Image
              src="/brand/dawana-monogram-light.png"
              alt=""
              width={703}
              height={799}
              priority
              className="relative h-auto w-[60px] md:w-[66px]"
            />
          </div>
        </div>

        {/* Bottom readout */}
        <div className="u-shell absolute inset-x-0 bottom-0 pb-7 md:pb-9">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="u-eyebrow text-mint-400/60">Patient monitor · Lead II</p>
              <p
                ref={status}
                className="mt-3 truncate font-display text-[1.3rem] font-semibold tracking-tight text-mint-50 md:text-[1.65rem]"
              >
                Connecting leads
              </p>
            </div>
            <p className="shrink-0 font-mono leading-none tabular-nums text-mint-50">
              <span ref={percent} className="text-[2.5rem] tracking-tight md:text-[3.4rem]">
                000
              </span>
              <span className="ml-1 text-[1rem] text-mint-400">%</span>
            </p>
          </div>

          <div className="mt-5 h-px w-full overflow-hidden bg-[color:var(--color-night-line)]">
            <div
              ref={fill}
              className="h-full origin-left bg-gradient-to-r from-mint-700 via-mint to-mint-200"
              style={{ transform: "scaleX(0)" }}
            />
          </div>

          <div className="mt-4 flex justify-between gap-4 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-mint-300/40">
            <span>
              {BRAND.name} · {CONTACT.city} · Est. {BRAND.founded}
            </span>
            <span className="hidden sm:block">25 mm/s · 10 mm/mV</span>
          </div>
        </div>
      </div>

      {/* Final-beat flash */}
      <div
        ref={flash}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(40% 32% at 50% 50%, rgba(142,212,194,0.55) 0%, rgba(92,188,167,0.12) 50%, transparent 75%)",
        }}
      />

      {/* The incision line the screen splits along */}
      <div
        ref={seam}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #5cbca7 18%, #dbf3ec 50%, #5cbca7 82%, transparent 100%)",
          boxShadow: "0 0 14px 2px rgba(92,188,167,0.65)",
        }}
      />

      <p ref={live} role="status" aria-live="polite" className="sr-only">
        Loading {BRAND.name}
      </p>
    </div>
  );
}
