"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "mint" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-capsule font-medium " +
  "transition-[background-color,color,border-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-deep text-mint-50 hover:bg-mint-950 shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_10px_30px_-12px_rgba(3,90,81,0.6)]",
  mint: "bg-mint text-mint-950 hover:bg-mint-300",
  outline:
    "border border-[color:var(--color-hairline)] bg-transparent text-ink hover:border-mint-500 hover:bg-mint-50",
  ghost: "bg-transparent text-ink hover:bg-mint-50",
  danger: "bg-signal-bad text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[0.9375rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Adds the arrow that nudges on hover — reserve for forward navigation. */
  arrow?: boolean;
  loading?: boolean;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {}

const Inner = ({
  children,
  arrow,
  loading,
}: Pick<CommonProps, "children" | "arrow" | "loading">) => (
  <>
    {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
    <span className="inline-flex items-center gap-2">{children}</span>
    {arrow && !loading && (
      <ArrowUpRight
        className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    )}
  </>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, arrow, loading, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      <Inner arrow={arrow} loading={loading}>
        {children}
      </Inner>
    </button>
  );
});

export default Button;

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  arrow,
  external,
}: CommonProps & { href: string; external?: boolean }) {
  const cls = cn(base, variants[variant], sizes[size], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
        <Inner arrow={arrow}>{children}</Inner>
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  );
}
