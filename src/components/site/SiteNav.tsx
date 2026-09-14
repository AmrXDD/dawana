"use client";

import { useMemo } from "react";
import CardNav from "@/components/CardNav";
import { useCatalogPresence } from "@/components/site/CatalogPresence";
import { BRAND, CONTACT, PALETTE, THERAPEUTIC_AREAS } from "@/lib/brand";
import { hasCatalog, type CatalogPresence } from "@/lib/catalog-presence";

/**
 * Brand-configured wrapper around react-bits CardNav.
 *
 * CardNav ships `position: absolute` and a 800px cap; the `.dawana-nav`
 * overrides in globals.css pin it and widen it. Everything else is themed
 * through its colour props.
 */
const itemsFor = (presence: CatalogPresence) => [
  {
    label: "Company",
    meta: `Est. ${BRAND.founded}`,
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
    meta: `${String(THERAPEUTIC_AREAS.length).padStart(2, "0")} areas`,
    bgColor: "#18564c",
    textColor: "#dbf3ec",
    grow: 1.55,
    // Every area is one click away, so the card reads full before anything
    // is published; catalogue links join once the admin publishes something.
    grid: THERAPEUTIC_AREAS.map((a) => ({
      label: a.name,
      index: a.index,
      href: `/therapeutics#${a.id}`,
    })),
    links: [
      { label: "All therapeutic areas", href: "/therapeutics", ariaLabel: "Therapeutic areas" },
      ...(hasCatalog(presence)
        ? [{ label: "Products", href: "/products", ariaLabel: "Product catalogue" }]
        : []),
      ...(presence.hasCollections
        ? [{ label: "Collections", href: "/products#collections", ariaLabel: "Collections" }]
        : []),
    ],
  },
  {
    label: "Contact",
    meta: CONTACT.city,
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
  const presence = useCatalogPresence();
  // Stable identity: CardNav rebuilds its timeline whenever `items` changes.
  const items = useMemo(() => itemsFor(presence), [presence]);

  return (
    <div className="dawana-nav">
      <CardNav
        logo="/brand/dawana-wordmark.png"
        logoAlt="Dawana — Your Everyday Remedy"
        items={items}
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
