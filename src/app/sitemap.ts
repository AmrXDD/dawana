import type { MetadataRoute } from "next";
import { BRAND, THERAPEUTIC_AREAS } from "@/lib/brand";
import { getCatalogPresence, getPublishedProductSlugs } from "@/lib/catalog";
import { hasCatalog } from "@/lib/catalog-presence";

// Refreshed with the rest of the site when the catalogue changes.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [presence, products] = await Promise.all([
    getCatalogPresence(),
    getPublishedProductSlugs(),
  ]);

  // Never point search engines at /products while it would 404.
  const routes = [
    "",
    "/about",
    "/therapeutics",
    ...(hasCatalog(presence) ? ["/products"] : []),
    "/partners",
    "/contact",
  ];

  return [
    ...routes.map((path) => ({
      url: `${BRAND.url}${path}`,
      lastModified: now,
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : 0.7,
    })),
    ...(presence.hasProducts
      ? THERAPEUTIC_AREAS.map((a) => ({
          url: `${BRAND.url}/products?area=${a.id}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        }))
      : []),
    ...products.map((p) => ({
      url: `${BRAND.url}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
