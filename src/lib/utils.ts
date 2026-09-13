import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. Our custom font sizes
 * (`text-title`, `text-lede`, …) look like `text-<color>` to it, so it treated
 * them as colour utilities and silently dropped them whenever a real colour
 * followed — e.g. `text-title text-deep` collapsed to just `text-deep`, and
 * every headline fell back to 16px.
 *
 * Registering them under `font-size` makes the two groups independent again.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["mega", "hero", "title", "head", "lede", "eyebrow"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Kuwaiti Dinar is a 3-decimal currency — getting this wrong on a
 *  receipt is a real accounting bug, so it is centralised here. */
export function formatKWD(value: number) {
  return new Intl.NumberFormat("en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatMoney(value: number, currency = "KWD") {
  const digits = currency === "KWD" || currency === "BHD" || currency === "OMR" ? 3 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(input: string | Date, style: "long" | "short" = "long") {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(d);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Sequential document reference, e.g. DW-RCP-2026-0042 */
export function docRef(prefix: "RCP" | "CTR" | "PRP", seq: number, year = new Date().getFullYear()) {
  return `DW-${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
