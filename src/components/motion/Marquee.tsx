"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Seconds for one full cycle. Longer = calmer. */
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Fade the leading/trailing edges into the background. */
  fade?: boolean;
}

/**
 * CSS-only infinite marquee. The track holds two identical copies and
 * translates -50%, so the loop is seamless with zero JS per frame.
 */
export default function Marquee({
  children,
  className,
  speed = 42,
  reverse = false,
  pauseOnHover = true,
  fade = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        pauseOnHover && "a-marquee-paused",
        className,
      )}
      style={
        fade
          ? {
              maskImage:
                "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            }
          : undefined
      }
    >
      <div
        className="a-marquee flex w-max"
        style={
          {
            "--speed": `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center" aria-hidden={false}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
