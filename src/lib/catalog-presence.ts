import { NAV_LINKS } from "@/lib/brand";

/**
 * Whether the public catalogue has anything to show.
 *
 * Products and collections are managed in the admin, but until at least one
 * is *published* the public site shows no trace of them: no nav links, no
 * "View products" buttons, no /products page. Publishing the first one brings
 * all of it back exactly as designed.
 *
 * Pure and import-safe on both server and client.
 */
export interface CatalogPresence {
  hasProducts: boolean;
  hasCollections: boolean;
}

export const NO_CATALOG: CatalogPresence = { hasProducts: false, hasCollections: false };

/** The /products page exists if it has either products or collections to list. */
export function hasCatalog(presence: CatalogPresence) {
  return presence.hasProducts || presence.hasCollections;
}

/** Primary navigation with catalogue links removed while there's no catalogue. */
export function navLinksFor(presence: CatalogPresence) {
  return NAV_LINKS.filter((link) => link.href !== "/products" || hasCatalog(presence));
}
