import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BRAND, CONTACT, PALETTE } from "@/lib/brand";

/**
 * A4 page shell shared by every generated document.
 *
 * Fixed at 210×297mm so what appears on screen is exactly what prints.
 * The capsule watermark and ECG footer rule are lifted from the printed
 * stationery in the brand book, not reinvented.
 */
export function DocSheet({
  children,
  className,
  watermark = true,
}: {
  children: ReactNode;
  className?: string;
  watermark?: boolean;
}) {
  return (
    <div
      className={cn(
        "doc-sheet relative mx-auto flex flex-col overflow-hidden bg-white text-[#04221f]",
        "w-[210mm] min-h-[297mm] shadow-[0_24px_70px_-24px_rgba(3,90,81,0.35)]",
        className,
      )}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {watermark && (
        <Image
          src="/brand/dawana-monogram.png"
          alt=""
          aria-hidden="true"
          width={773}
          height={1094}
          className="pointer-events-none absolute -bottom-10 -right-12 w-[58mm] opacity-[0.13]"
        />
      )}
      {children}
    </div>
  );
}

/** Title block: document name left, official lockup right, mint rule beneath. */
export function DocMasthead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="relative z-10 px-[16mm] pt-[15mm]">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1
            className="text-[30px] font-bold uppercase leading-none tracking-[0.01em]"
            style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#7d928d]">
              {subtitle}
            </p>
          )}
        </div>

        <Image
          src="/brand/dawana-wordmark.png"
          alt={BRAND.name}
          width={1804}
          height={783}
          className="mt-1 w-[42mm] shrink-0"
        />
      </div>

      <div
        className="mt-4 h-[2px] w-full"
        style={{ backgroundColor: PALETTE.mint }}
        aria-hidden="true"
      />
    </header>
  );
}

/** Thin divider matching the receipt's section rules. */
export function DocRule({ tone = "mint" }: { tone?: "mint" | "faint" }) {
  return (
    <div
      className="my-[6mm] h-[1.5px] w-full"
      style={{
        backgroundColor: tone === "mint" ? PALETTE.mint : "rgba(3,90,81,0.18)",
      }}
      aria-hidden="true"
    />
  );
}

/** Label + value pair with the dotted rule used on the printed receipt. */
export function DocField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className="shrink-0 text-[13px] font-semibold"
        style={{ color: PALETTE.deep }}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 border-b border-dotted border-[#9fb5b0] pb-0.5 text-[13px] text-[#04221f]">
        {value || " "}
      </span>
    </div>
  );
}

/** Party block — "From:" / "Bill To:" on the receipt. */
export function DocParty({
  heading,
  party,
}: {
  heading: string;
  party: { name?: string; contact?: string; address?: string; email?: string };
}) {
  const lines = [party.name, party.contact, party.email, party.address].filter(
    Boolean,
  ) as string[];

  return (
    <div>
      <h2
        className="text-[15px] font-bold"
        style={{ color: PALETTE.deep }}
      >
        {heading}
      </h2>
      <div className="mt-2 space-y-1">
        {lines.length ? (
          lines.map((line, i) => (
            <p key={i} className="text-[12.5px] leading-snug text-[#04221f]">
              {line}
            </p>
          ))
        ) : (
          <>
            <p className="text-[12.5px] text-[#9fb5b0]">Name</p>
            <p className="text-[12.5px] text-[#9fb5b0]">Contact</p>
            <p className="text-[12.5px] text-[#9fb5b0]">Address</p>
          </>
        )}
      </div>
    </div>
  );
}

/** Footer carrying the stationery contact strip. */
export function DocFooter({ note }: { note?: string }) {
  return (
    <footer className="relative z-10 mt-auto px-[16mm] pb-[13mm] pt-[8mm]">
      {note && (
        <p
          className="mb-4 text-[13px] font-semibold"
          style={{ color: PALETTE.deep }}
        >
          {note}
        </p>
      )}
      <div
        className="h-[1px] w-full"
        style={{ backgroundColor: "rgba(3,90,81,0.18)" }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[9.5px] text-[#7d928d]">
        <span>{BRAND.legalName}</span>
        <span>·</span>
        <span>{CONTACT.address}</span>
        <span>·</span>
        <span>{CONTACT.phonePrimary}</span>
        <span>·</span>
        <span>{CONTACT.email}</span>
        <span>·</span>
        <span>{BRAND.domain}</span>
      </div>
    </footer>
  );
}

/** Signature rule used across contracts, proposals and receipts. */
export function DocSignature({
  label,
  name,
  title,
}: {
  label: string;
  name?: string;
  title?: string;
}) {
  return (
    <div className="w-[70mm]">
      <p
        className="text-[11px] uppercase tracking-[0.16em]"
        style={{ color: PALETTE.mint }}
      >
        {label}
      </p>
      <div className="mt-[14mm] border-t border-dashed border-[#7d928d]" />
      {name && (
        <p className="mt-2 text-[12.5px] font-semibold text-[#04221f]">{name}</p>
      )}
      {title && <p className="text-[11px] text-[#7d928d]">{title}</p>}
    </div>
  );
}
