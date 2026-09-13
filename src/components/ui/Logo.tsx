import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
  /** Width in px; height derives from the mark's native 1804×783 ratio. */
  width?: number;
  href?: string | null;
  withTagline?: boolean;
}

const RATIO = 783 / 1804;

/** The official lockup. Never re-typeset it — this is the supplied artwork. */
export function Wordmark({
  variant = "dark",
  className,
  width = 148,
}: Omit<LogoProps, "href" | "withTagline">) {
  return (
    <Image
      src={
        variant === "light"
          ? "/brand/dawana-wordmark-light.png"
          : "/brand/dawana-wordmark.png"
      }
      alt={`${BRAND.name} — ${BRAND.tagline}`}
      width={width}
      height={Math.round(width * RATIO)}
      priority
      className={cn("h-auto select-none", className)}
    />
  );
}

export function Monogram({
  variant = "dark",
  className,
  width = 40,
}: Omit<LogoProps, "href" | "withTagline">) {
  return (
    <Image
      src={
        variant === "light"
          ? "/brand/dawana-monogram-light.png"
          : "/brand/dawana-monogram.png"
      }
      alt=""
      aria-hidden="true"
      width={width}
      height={Math.round(width * (1094 / 773))}
      className={cn("h-auto select-none", className)}
    />
  );
}

export default function Logo({
  variant = "dark",
  className,
  width = 148,
  href = "/",
  withTagline = false,
}: LogoProps) {
  const inner = (
    <span className={cn("inline-flex flex-col gap-1.5", className)}>
      <Wordmark variant={variant} width={width} />
      {withTagline && (
        <span
          className={cn(
            "u-eyebrow",
            variant === "light" ? "text-mint-300" : "text-mint-600",
          )}
        >
          {BRAND.tagline}
        </span>
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      aria-label={`${BRAND.name} — home`}
      className="inline-block rounded transition-opacity duration-300 hover:opacity-70"
    >
      {inner}
    </Link>
  );
}
