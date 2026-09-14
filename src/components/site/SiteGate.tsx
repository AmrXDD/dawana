"use client";

import {
  createContext,
  useCallback,
  useContext,
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
 *   - unscrollable          (CSS `:has(.dw-loader)` locks html/body from first paint)
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

  const open = useCallback(() => {
    booted = true;
    window.scrollTo(0, 0);
    setReady(true);
    // Two frames: one for the gate to become visible, one for Lenis to
    // attach — then pins and triggers measure the real, live document.
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, []);

  const done = useCallback(() => setShowLoader(false), []);

  return (
    <ReadyContext.Provider value={ready}>
      {showLoader && <HeartbeatLoader onOpen={open} onDone={done} />}

      <div data-gate={ready ? "open" : "closed"} inert={!ready} aria-busy={!ready}>
        {children}
      </div>
    </ReadyContext.Provider>
  );
}
