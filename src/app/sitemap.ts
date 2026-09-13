import type { MetadataRoute } from "next";
import { BRAND, THERAPEUTIC_AREAS } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/about", "/therapeutics", "/products", "/partners", "/contact"];

  return [
    ...routes.map((path) => ({
      url: `${BRAND.url}${path}`,
      lastModified: now,
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : 0.7,
    })),
    ...THERAPEUTIC_AREAS.map((a) => ({
      url: `${BRAND.url}/products?area=${a.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
