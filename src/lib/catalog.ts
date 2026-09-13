import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Collection, Product } from "@/lib/types";

/**
 * Public catalogue reads. RLS restricts anonymous access to published rows,
 * so these queries don't filter on `is_published` defensively — but they do
 * degrade to an empty, non-throwing result when Supabase isn't configured,
 * which keeps the marketing site renderable before the backend exists.
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
    const supabase = await createClient();

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
    const supabase = await createClient();
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("is_published", true)
      .order("position", { ascending: true });

    return { partners: data ?? [], configured: true };
  } catch {
    return { partners: [], configured: true };
  }
}
