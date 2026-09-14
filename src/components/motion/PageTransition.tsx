"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { NAV_LINKS } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────
   Page transition — a rising column of capsules.

   The App Router swaps pages the instant a link is clicked, so a transition
   that merely animates the new page can never cover the old one. This takes
   the click, runs the whole choreography, and navigates in the middle:

     cover    five full-height capsules (the pill from the brand mark) rise
              from below in a centre-out wave; the destination's name rises
              into place between them
     swap     with the screen fully covered: navigate, reset scroll, close
              the menu, and re-measure ScrollTrigger — all invisibly
     reveal   the capsules carry on upward and leave through the top, their
              rounded tails passing over the new page as it settles in

   Deliberately unlike the first-load handover (wordmark + heartbeat): this
   is the capsule, moving.

   Web Animations API, not GSAP, so it never competes with page timelines.
   ───────────────────────────────────────────────────────────────────────── */

const COLUMNS = 5;
const CENTRE = (COLUMNS - 1) / 2;
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

const COVER_MS = 720;
const REVEAL_MS = 780;
const WAVE_MS = 70; // per column away from the centre

type Phase = "idle" | "covering" | "covered" | "revealing";

function labelFor(pathname: string) {
  if (pathname === "/") return "Home";
  const hit = NAV_LINKS.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));
  if (hit) return hit.label;
  const seg = pathname.split("/").filter(Boolean).pop() ?? "";
  return seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const overlay = useRef<HTMLDivElement>(null);
  const columns = useRef<(HTMLDivElement | null)[]>([]);
  const eyebrow = useRef<HTMLParagraphElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const phase = useRef<Phase>("idle");
  const firstRender = useRef(true);
  const coveredAt = useRef(0);
  const safety = useRef<number | null>(null);
  const pendingHash = useRef("");
  const [label, setLabel] = useState("");

  /* Geometry: a capsule is the viewport's height plus a semicircular cap at
     each end. Parked just below the screen, covering with its caps hidden
     off-screen, or exited just above. */
  const geometry = () => {
    const vh = window.innerHeight;
    const colW = window.innerWidth / COLUMNS;
    const cap = colW / 2;
    /* Exit distance comes from the capsule's real height, not innerHeight.
       CSS sizes it with 100vh, which on mobile (address bar showing) is
       taller than innerHeight — using innerHeight left a strip of capsule
       parked at the top of the screen at the end of the reveal. */
    const height = columns.current[0]?.getBoundingClientRect().height ?? vh + colW;
    return { below: vh + cap, above: -(height - cap), cap };
  };

  const delayFor = (i: number) => Math.abs(i - CENTRE) * WAVE_MS;

  const cover = useCallback(() => {
    const el = overlay.current;
    if (!el) return Promise.resolve();
    const { below } = geometry();
    el.dataset.active = "true";

    const runs = columns.current.map((col, i) => {
      if (!col) return Promise.resolve();
      col.getAnimations().forEach((a) => a.cancel());
      return col
        .animate(
          [{ transform: `translate3d(0, ${below}px, 0)` }, { transform: "translate3d(0, 0, 0)" }],
          { duration: COVER_MS, delay: delayFor(i), easing: EASE, fill: "both" },
        )
        .finished.catch(() => undefined);
    });

    /* The label waits until every capsule has cleared the centre band (~560ms
       with the centre-out wave), so the white type only ever rises over solid
       teal — never over the still-visible old page between the capsules. */
    eyebrow.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 420,
      delay: 600,
      easing: EASE_OUT,
      fill: "both",
    });
    title.current?.animate(
      [{ transform: "translate3d(0, 110%, 0)" }, { transform: "translate3d(0, 0, 0)" }],
      { duration: 700, delay: 560, easing: EASE_OUT, fill: "both" },
    );

    return Promise.all(runs).then(() => undefined);
  }, []);

  const reveal = useCallback(() => {
    const el = overlay.current;
    if (!el) return;
    phase.current = "revealing";
    const { above } = geometry();

    title.current?.animate(
      [{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(0, -110%, 0)" }],
      { duration: 520, easing: EASE, fill: "forwards" },
    );
    eyebrow.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 280,
      easing: "ease-out",
      fill: "forwards",
    });

    const runs = columns.current.map((col, i) =>
      col
        ? col
            .animate(
              [{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(0, ${above}px, 0)` }],
              { duration: REVEAL_MS, delay: 140 + delayFor(i), easing: EASE, fill: "both" },
            )
            .finished.catch(() => undefined)
        : Promise.resolve(),
    );

    /* The new page settles up into place beneath the rising capsules. No
       `fill`, deliberately: once it ends no transform remains on this
       wrapper. A lingering transform would make it the containing block for
       position:fixed descendants and break ScrollTrigger pinning. */
    content.current?.animate(
      [
        { opacity: 0, transform: "translate3d(0, 48px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 1000, delay: 220, easing: EASE_OUT },
    );

    Promise.all(runs).then(() => {
      delete el.dataset.active;
      phase.current = "idle";
    });
  }, []);

  const navigate = useCallback(
    async (href: string, targetPath: string) => {
      phase.current = "covering";
      pendingHash.current = new URL(href, window.location.href).hash;
      setLabel(labelFor(targetPath));
      router.prefetch(href);

      await cover();

      // Fully covered: the swap happens out of sight.
      phase.current = "covered";
      coveredAt.current = performance.now();

      // Close the card menu if the click came from inside it.
      const menu = document.querySelector<HTMLElement>(".dawana-nav .card-nav.open .hamburger-menu");
      menu?.click();

      router.push(href, { scroll: false });

      /* If the route never commits (error, redirect to the same path), don't
         leave the visitor behind a curtain. Generous on purpose: the curtain
         names the destination, so on a slow connection it reads as a loading
         state — lifting early would flash the stale page before the new one
         swaps in. Matches the first-load loader's 8s ceiling. */
      if (safety.current) window.clearTimeout(safety.current);
      safety.current = window.setTimeout(() => {
        if (phase.current === "covered") reveal();
      }, 8000);
    },
    [cover, reveal, router],
  );

  /* ---- Take internal link clicks ----
     Capture phase on window runs before React's handlers; preventing the
     default here makes Next's <Link> skip its own navigation (it checks
     defaultPrevented) and stops plain <a> tags from doing a full reload. */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onClick = (e: MouseEvent) => {
      if (reduced) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;

      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // The admin has its own layout; the capsules would be torn down mid-
      // reveal with the site layout. Let those navigate normally.
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;
      // Same page (filters, anchors) stays instant.
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      if (phase.current !== "idle") return;
      navigate(url.pathname + url.search + url.hash, url.pathname);
    };

    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [navigate]);

  /* ---- New route committed ---- */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; // first load belongs to the heartbeat loader
      return;
    }

    if (phase.current === "covered") {
      if (safety.current) window.clearTimeout(safety.current);
      // Land on the in-page target for links like /about#mission, else the top.
      const anchor = pendingHash.current
        ? document.getElementById(decodeURIComponent(pendingHash.current.slice(1)))
        : null;
      window.scrollTo(0, anchor ? anchor.getBoundingClientRect().top + window.scrollY - 96 : 0);
      pendingHash.current = "";
      // Re-measure pins and triggers while nothing is visible to hitch.
      ScrollTrigger.refresh();

      // Hold long enough for the destination's name to read, and give the
      // new page two frames to paint before it's uncovered.
      const hold = Math.max(0, 260 - (performance.now() - coveredAt.current));
      const id = window.setTimeout(() => {
        requestAnimationFrame(() => requestAnimationFrame(reveal));
      }, hold);
      return () => window.clearTimeout(id);
    }

    // Back/forward or anything we didn't initiate: no curtain, just a
    // gentle settle so the page doesn't cut.
    if (phase.current === "idle" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      content.current?.animate(
        [
          { opacity: 0.35, transform: "translate3d(0, 16px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 520, easing: EASE_OUT },
      );
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [pathname, reveal]);

  useEffect(
    () => () => {
      if (safety.current) window.clearTimeout(safety.current);
    },
    [],
  );

  return (
    <>
      <div ref={overlay} className="dw-transition" aria-hidden="true">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <div
            key={i}
            ref={(node) => {
              columns.current[i] = node;
            }}
            className="dw-transition__capsule"
            style={{ left: `${(i * 100) / COLUMNS}%`, width: `calc(${100 / COLUMNS}% + 1px)` }}
          />
        ))}

        <div className="dw-transition__label">
          <p ref={eyebrow} className="u-eyebrow flex items-center gap-2.5 text-mint-300/80">
            <span className="inline-block size-1.5 rounded-full bg-mint" />
            Dawana
          </p>
          <div className="mt-4 overflow-hidden pb-[0.12em]">
            <h2
              ref={title}
              className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-none tracking-[-0.04em] text-mint-50"
            >
              {label}
            </h2>
          </div>
        </div>
      </div>

      <div ref={content}>{children}</div>
    </>
  );
}
