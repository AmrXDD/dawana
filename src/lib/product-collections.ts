import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collection, Product } from "@/lib/types";

/**
 * Attaches `collections` to each product from the product_collections join
 * table. Done as two plain queries rather than a PostgREST embed so it reads
 * the same under the public key (where RLS hides unpublished links) and the
 * service key (where the admin sees everything).
 */
export async function attachCollections(db: SupabaseClient, products: Product[]) {
  if (products.length === 0) return products;

  const { data: links } = await db
    .from("product_collections")
    .select("product_id, collection_id")
    .in("product_id", products.map((p) => p.id));

  const ids = [...new Set((links ?? []).map((l) => l.collection_id as string))];
  const { data: collections } = ids.length
    ? await db.from("collections").select("id, name, slug, position").in("id", ids)
    : { data: [] as (Pick<Collection, "id" | "name" | "slug"> & { position: number })[] };

  const byId = new Map((collections ?? []).map((c) => [c.id, c]));

  return products.map((p) => ({
    ...p,
    collections: (links ?? [])
      .filter((l) => l.product_id === p.id)
      .map((l) => byId.get(l.collection_id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .sort((a, b) => a.position - b.position)
      .map(({ id, name, slug }) => ({ id, name, slug })),
  }));
}
