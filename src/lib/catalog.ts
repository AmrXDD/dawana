import { cache } from "react";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NO_CATALOG, type CatalogPresence } from "@/lib/catalog-presence";
import { attachCollections } from "@/lib/product-collections";
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
  /** The collection being filtered by, when it exists and is published. */
  activeCollection: Collection | null;
  configured: boolean;
}

export async function getCatalog(filter: {
  area?: string;
  collection?: string;
} = {}): Promise<CatalogResult> {
  if (!isSupabaseConfigured()) {
    return { products: [], collections: [], activeCollection: null, configured: false };
  }

  try {
    const supabase = createPublicClient();

    const { data: collectionRows } = await supabase
      .from("collections")
      .select("*")
      .eq("is_published", true)
      .order("position", { ascending: true });
    const collections = (collectionRows ?? []) as Collection[];
    const activeCollection = filter.collection
      ? (collections.find((c) => c.slug === filter.collection) ?? null)
      : null;

    let productQuery = supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    if (filter.area) productQuery = productQuery.eq("therapeutic_area", filter.area);

    if (filter.collection) {
      // An unknown or unpublished collection shows nothing rather than everything.
      const { data: links } = activeCollection
        ? await supabase
            .from("product_collections")
            .select("product_id")
            .eq("collection_id", activeCollection.id)
        : { data: [] };
      const ids = (links ?? []).map((l) => l.product_id as string);
      if (ids.length === 0) {
        return { products: [], collections, activeCollection, configured: true };
      }
      productQuery = productQuery.in("id", ids);
    }

    const { data } = await productQuery;
    const products = await attachCollections(supabase, (data ?? []) as Product[]);

    return { products, collections, activeCollection, configured: true };
  } catch {
    return { products: [], collections: [], activeCollection: null, configured: true };
  }
}

/** One published product by its page address, with a few from the same area. */
export async function getProduct(slug: string) {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;

    const [product] = await attachCollections(supabase, [data as Product]);

    let related: Product[] = [];
    if (product.therapeutic_area) {
      const { data: rows } = await supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .eq("therapeutic_area", product.therapeutic_area)
        .neq("id", product.id)
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true })
        .limit(3);
      related = (rows ?? []) as Product[];
    }

    return { product, related };
  } catch {
    return null;
  }
}

/** Published product addresses, for the sitemap. */
export async function getPublishedProductSlugs() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient()
      .from("products")
      .select("slug, updated_at")
      .eq("is_published", true);
    return (data ?? []) as { slug: string; updated_at: string }[];
  } catch {
    return [];
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
