"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  FileSignature,
  FileText,
  LayoutGrid,
  Layers,
  Package,
  ExternalLink,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Wordmark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutGrid, exact: true },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/collections", label: "Collections", Icon: Layers },
  { href: "/admin/receipts", label: "Receipts", Icon: FileText },
  { href: "/admin/contracts", label: "Contracts", Icon: FileSignature },
  { href: "/admin/proposals", label: "Proposals", Icon: FileText },
  { href: "/admin/health", label: "Site health", Icon: Activity },
];

export default function Shell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <Link href="/admin" className="inline-block">
          <Wordmark variant="light" width={116} />
        </Link>
        <p className="u-eyebrow mt-3 text-mint-400/70">Control room</p>
      </div>

      <nav aria-label="Admin" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-tight px-3 py-2.5 text-[0.875rem] transition-colors duration-200",
                    active
                      ? "bg-mint/12 text-mint-50"
                      : "text-mint-200/60 hover:bg-white/4 hover:text-mint-100",
                  )}
                >
                  {/* Active rail marker */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-mint transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="size-[1.05rem] shrink-0" strokeWidth={1.7} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[color:var(--color-night-line)] p-4">
        <Link
          href="/"
          className="mb-1 flex items-center gap-2.5 rounded-tight px-3 py-2.5 text-[0.82rem] text-mint-200/60 transition-colors hover:bg-white/4 hover:text-mint-100"
        >
          <ExternalLink className="size-4" strokeWidth={1.7} aria-hidden="true" />
          View site
        </Link>

        {email && (
          <div className="mt-2 flex items-center gap-3 rounded-tight px-3 py-2.5">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-mint/15 text-[0.7rem] font-semibold text-mint"
            >
              {email.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.76rem] text-mint-100/80">
                {email}
              </span>
            </span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Sign out"
                className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
              >
                <LogOut className="size-4" strokeWidth={1.7} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-night text-mint-50">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] border-r border-[color:var(--color-night-line)] bg-night-raised/40 lg:block">
        {Sidebar}
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[color:var(--color-night-line)] bg-night/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Wordmark variant="light" width={96} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="grid size-10 place-items-center rounded-tight border border-[color:var(--color-night-line)] text-mint-100"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-[color:var(--color-night-line)] bg-night lg:hidden">
            {Sidebar}
          </aside>
        </>
      )}

      <div className="lg:pl-[16.5rem]">
        <div className="u-scroll-slim mx-auto max-w-[84rem] px-5 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Page header used by every admin screen. */
export function PageHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[color:var(--color-night-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[1.9rem] font-semibold tracking-tight text-mint-50">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-mint-200/55">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  children,
  className,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-[color:var(--color-night-line)] bg-night-raised/45",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-[color:var(--color-night-line)] px-5 py-4">
          <div>
            {title && (
              <h2 className="font-display text-[1.05rem] font-semibold text-mint-50">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[0.8rem] text-mint-200/50">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
