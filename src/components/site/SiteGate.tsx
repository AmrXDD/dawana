"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeartbeatLoader from "@/components/site/HeartbeatLoader";

gsap.registerPlugin(ScrollTrigger);

const ReadyContext = createContext(true);

/** True once the heartbeat loader has opened. Components that start work on
 *  mount without GSAP (Lenis, WebGL) must wait for this. */
export const useSiteReady = () => useContext(ReadyContext);

/* Survives client-side navigation: the loader plays once per page load, not
   every time the site layout remounts (e.g. returning from /admin). */
let booted = false;

/**
 * Holds the whole site back until the heartbeat loader finishes.
 *
 * The site is still server-rendered underneath — search engines and no-JS
 * visitors get real content — but until the gate opens it is:
 *   - invisible and inert   (`data-gate="closed"` + `inert`: no focus, no clicks)
 *   - unscrollable          (scroll input blocked in JS; the scrollbar stays put)
 *   - frozen                (GSAP's global timeline is paused, so every entrance
 *                            animation waits at its start state and plays fresh
 *                            on reveal instead of finishing unseen)
 *   - idle                  (Lenis and WebGL gate on `useSiteReady`; CSS
 *                            marquees are paused via the data-gate selector)
 */
export default function SiteGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => booted);
  const [showLoader, setShowLoader] = useState(() => !booted);

  /* Layout effect so the pause lands in the same commit as the children's
     useGSAP setup — before the ticker's next frame could advance anything. */
  useLayoutEffect(() => {
    if (ready) return;

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    gsap.globalTimeline.pause();

    // Runs when the gate opens — and also if the site unmounts mid-load,
    // so the rest of the app is never left with GSAP frozen.
    return () => {
      gsap.globalTimeline.resume();
    };
  }, [ready]);

  /* Scroll lock without overflow:hidden. Hiding the root overflow removes the
     scrollbar, and giving it back at the end of the handover shifts the whole
     page sideways. Instead the scrollbar stays put and scroll input is
     swallowed while the loader is up; a drag on the scrollbar itself is
     snapped back. The page width never changes, so nothing can jump. */
  useEffect(() => {
    if (!showLoader) return;

    const KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if (KEYS.has(e.key)) e.preventDefault();
    };
    const pin = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", pin, { passive: true });

    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", pin);
    };
  }, [showLoader]);

  const open = useCallback(() => {
    booted = true;
    window.scrollTo(0, 0);
    setReady(true);
  }, []);

  /* ScrollTrigger.refresh() re-measures every pin and trigger — a synchronous
     layout pass that would hitch the wordmark mid-glide if run on open.
     Nothing can scroll until the loader unmounts, so measure then instead. */
  const done = useCallback(() => {
    setShowLoader(false);
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, []);

  return (
    <ReadyContext.Provider value={ready}>
      {showLoader && <HeartbeatLoader onOpen={open} onDone={done} />}

      <div data-gate={ready ? "open" : "closed"} inert={!ready} aria-busy={!ready}>
        {children}
      </div>
    </ReadyContext.Provider>
  );
}
