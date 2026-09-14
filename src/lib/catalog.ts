import { cache } from "react";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NO_CATALOG, type CatalogPresence } from "@/lib/catalog-presence";
import type { Collection, Product } from "@/lib/types";

/**
 * Is there anything published to show publicly?
 *
 * Uses the cookie-less anon client, so every public page stays statically
 * renderable. RLS already limits anon reads to published rows, and head-only
 * counts keep it cheap. Wrapped in React cache() so the layout, CTA band and
 * pages share one lookup per render. Any failure reads as "nothing to show" —
 * the safe direction, since it hides links rather than pointing at an empty
 * page.
 */
export const getCatalogPresence = cache(async (): Promise<CatalogPresence> => {
  if (!isSupabaseConfigured()) return NO_CATALOG;

  try {
    const supabase = createPublicClient();
    const [products, collections] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("collections").select("id", { count: "exact", head: true }).eq("is_published", true),
    ]);
    return {
      hasProducts: !products.error && (products.count ?? 0) > 0,
      hasCollections: !collections.error && (collections.count ?? 0) > 0,
    };
  } catch {
    return NO_CATALOG;
  }
});

/**
 * Public catalogue reads. They filter on `is_published` explicitly as well as
 * relying on RLS, and degrade to an empty, non-throwing result when Supabase
 * isn't configured, which keeps the marketing site renderable before the
 * backend exists.
 */

export interface CatalogResult {
  products: Product[];
  collections: Collection[];
  configured: boolean;
}

export async function getCatalog(area?: string): Promise<CatalogResult> {
  if (!isSupabaseConfigured()) {
    return { products: [], collections: [], configured: false };
  }

  try {
    const supabase = createPublicClient();

    let productQuery = supabase
      .from("products")
      .select("*, collection:collections(id,name,slug)")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    if (area) productQuery = productQuery.eq("therapeutic_area", area);

    const [products, collections] = await Promise.all([
      productQuery,
      supabase
        .from("collections")
        .select("*")
        .eq("is_published", true)
        .order("position", { ascending: true }),
    ]);

    return {
      products: (products.data ?? []) as unknown as Product[],
      collections: (collections.data ?? []) as Collection[],
      configured: true,
    };
  } catch {
    return { products: [], collections: [], configured: true };
  }
}

export async function getPartners() {
  if (!isSupabaseConfigured()) return { partners: [], configured: false };

  try {
    const { data } = await createPublicClient()
      .from("partners")
      .select("*")
      .eq("is_published", true)
      .order("position", { ascending: true });

    return { partners: data ?? [], configured: true };
  } catch {
    return { partners: [], configured: true };
  }
}
