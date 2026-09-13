"use client";

import CardNav from "@/components/CardNav";
import { CONTACT, PALETTE } from "@/lib/brand";

/**
 * Brand-configured wrapper around react-bits CardNav.
 *
 * CardNav ships `position: absolute` and a 800px cap; the `.dawana-nav`
 * overrides in globals.css pin it and widen it. Everything else is themed
 * through its colour props so the vendor file stays unforked.
 */
const ITEMS = [
  {
    label: "Company",
    bgColor: PALETTE.deep,
    textColor: "#dbf3ec",
    links: [
      { label: "About Dawana", href: "/about", ariaLabel: "About Dawana" },
      { label: "Mission & Vision", href: "/about#mission", ariaLabel: "Mission and vision" },
      { label: "Partners", href: "/partners", ariaLabel: "Our partners" },
    ],
  },
  {
    label: "Portfolio",
    bgColor: "#18564c",
    textColor: "#dbf3ec",
    links: [
      { label: "Therapeutics", href: "/therapeutics", ariaLabel: "Therapeutic areas" },
      { label: "Products", href: "/products", ariaLabel: "Product catalogue" },
      { label: "Collections", href: "/products#collections", ariaLabel: "Collections" },
    ],
  },
  {
    label: "Contact",
    bgColor: "#266e5f",
    textColor: "#dbf3ec",
    links: [
      { label: CONTACT.email, href: `mailto:${CONTACT.email}`, ariaLabel: "Email Dawana" },
      { label: CONTACT.phonePrimary, href: `tel:${CONTACT.phonePrimary.replace(/\s/g, "")}`, ariaLabel: "Call Dawana" },
      { label: CONTACT.instagram, href: CONTACT.instagramUrl, ariaLabel: "Dawana on Instagram" },
    ],
  },
];

export default function SiteNav() {
  return (
    <div className="dawana-nav">
      <CardNav
        logo="/brand/dawana-wordmark.png"
        logoAlt="Dawana — Your Everyday Remedy"
        items={ITEMS}
        baseColor="rgba(245,242,237,0.88)"
        menuColor={PALETTE.deep}
        buttonBgColor={PALETTE.deep}
        buttonTextColor="#dbf3ec"
        ctaLabel="Partner with us"
        ctaHref="/contact"
        ease="power3.out"
      />
    </div>
  );
}
