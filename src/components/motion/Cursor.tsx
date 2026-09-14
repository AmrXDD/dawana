"use client";

import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   Cursor — a dot and a hairline ring.

   The dot is the true pointer position, so precision is never compromised.
   The ring trails it with a soft, frame-rate-independent lag, which is where
   the sense of weight comes from. States are quiet: the dot sinks into the
   ring over anything clickable, the ring tightens on press, and both step
   aside for the native caret over text fields. Colour flips to pale mint
   over dark surfaces so it never disappears.

   Plain requestAnimationFrame, not GSAP: SiteGate pauses GSAP's global
   timeline behind the loader, and the cursor has to work over the loader.
   ───────────────────────────────────────────────────────────────────────── */

const INTERACTIVE =
  'a[href], button, [role="button"], summary, label[for], select, [data-cursor="hover"]';

/* Native caret wins wherever the user needs character-level precision.
   iframes are included because pointer events stop at their edge — the
   custom cursor would otherwise freeze on the border of the embedded map. */
const TEXT =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"], iframe';

const DARK = [
  ".u-band-dark",
  ".u-band-descend",
  ".u-band-descend-dark",
  ".u-band-footer",
  ".u-fill-deep",
  ".bg-deep",
  ".bg-night",
  ".nav-card",
  ".dw-transition[data-active]",
  // Frame is full-bleed but shaped by clip-path; hit-testing respects the
  // clip, so this only matches over the visible photograph.
  ".scroll-expand__frame",
  '[data-cursor-theme="dark"]',
].join(", ");

type State = "idle" | "hover" | "text";

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch and pen-only devices keep their native behaviour entirely.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;

    // Only hide the system cursor once ours is live — if this effect never
    // runs, visitors keep a normal pointer rather than an invisible one.
    html.classList.add("has-custom-cursor");

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;
    let last = performance.now();
    let target: Element | null = null;
    let stale = true;
    let shown = false;

    const apply = (key: string, value: string) => {
      if (d.dataset[key] !== value) d.dataset[key] = value;
      if (r.dataset[key] !== value) r.dataset[key] = value;
    };

    const resolveState = () => {
      const el = target;
      let state: State = "idle";

      if (el?.closest(TEXT)) {
        state = "text";
      } else {
        const hit = el?.closest(INTERACTIVE) as HTMLButtonElement | null;
        if (hit && !hit.disabled && hit.getAttribute("aria-disabled") !== "true") {
          state = "hover";
        }
      }

      apply("state", state);
      apply("theme", el?.closest(DARK) ? "dark" : "light");
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      // Exponential smoothing normalised to 60fps, so the lag feels the same
      // on a 60Hz laptop and a 144Hz monitor.
      const k = reduced ? 1 : 1 - Math.pow(1 - 0.16, dt / 16.667);
      rx += (x - rx) * k;
      ry += (y - ry) * k;

      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

      if (stale) {
        stale = false;
        resolveState();
      }

      // Sleep once the ring has caught up — no idle 60fps loop.
      if (Math.abs(x - rx) > 0.08 || Math.abs(y - ry) > 0.08) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
      }
    };

    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;

      if (!shown) {
        // First sighting: place the ring on the pointer instead of sweeping
        // in from the corner.
        shown = true;
        rx = x;
        ry = y;
        apply("visible", "true");
      }

      // Targets can be document/window in edge cases, which have no closest().
      const next = e.target instanceof Element ? e.target : document.elementFromPoint(x, y);
      if (next !== target) {
        target = next;
        stale = true;
      }
      wake();
    };

    // Content can scroll under a stationary pointer — re-read what's beneath.
    const onScroll = () => {
      if (!shown) return;
      const under = document.elementFromPoint(x, y);
      if (under !== target) {
        target = under;
        stale = true;
        wake();
      }
    };

    const onDown = () => apply("pressed", "true");
    const onUp = () => apply("pressed", "false");

    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        shown = false;
        apply("visible", "false");
      }
    };
    const onBlur = () => {
      shown = false;
      apply("visible", "false");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseout", onOut);

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="dw-cursor dw-cursor--ring" aria-hidden="true">
        <span />
      </div>
      <div ref={dot} className="dw-cursor dw-cursor--dot" aria-hidden="true">
        <span />
      </div>
    </>
  );
}
