import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { BRAND, CONTACT, PALETTE } from "@/lib/brand";
import "@/styles/globals.css";

/* Display face: a contemporary grotesque with real character in the
   counters — it sits beside the rounded logo without imitating it. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* Mono carries every eyebrow, reference number and figure — it is what
   makes the documents read as clinical records rather than marketing. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: `${BRAND.name} is a Kuwait-based pharmaceutical distributor delivering high-quality healthcare solutions across the private and government sectors since ${BRAND.founded}.`,
  keywords: [
    "pharmaceutical distributor Kuwait",
    "healthcare Kuwait",
    "Dawana",
    "medical supplies Kuwait",
    "nutraceuticals",
    "government tenders Kuwait",
  ],
  authors: [{ name: BRAND.legalName }],
  openGraph: {
    type: "website",
    locale: "en_KW",
    url: BRAND.url,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: `Kuwait's trusted pharmaceutical partner since ${BRAND.founded}.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PALETTE.white },
    { media: "(prefers-color-scheme: dark)", color: PALETTE.deep },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Never block zoom — it is an accessibility failure, not a polish win.
  maximumScale: 5,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.legalName,
  alternateName: BRAND.name,
  url: BRAND.url,
  slogan: BRAND.tagline,
  foundingDate: String(BRAND.founded),
  email: CONTACT.email,
  telephone: CONTACT.phonePrimary,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sharq, Arabiya Tower 17F",
    addressLocality: CONTACT.city,
    addressCountry: "KW",
  },
  sameAs: [CONTACT.instagramUrl],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${mono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only rounded-capsule focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-deep focus:px-5 focus:py-3 focus:text-sm focus:text-mint-50"
        >
          Skip to content
        </a>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: PALETTE.deep,
              color: "#dbf3ec",
              border: "1px solid rgba(92,188,167,0.24)",
              borderRadius: "14px",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
