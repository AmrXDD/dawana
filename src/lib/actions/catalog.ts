"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionError, assertAdmin, run } from "@/lib/auth/admin";
import { attachCollections } from "@/lib/product-collections";
import { slugify } from "@/lib/utils";
import type { Collection, Product } from "@/lib/types";

/**
 * Catalogue writes for the control room. Every action re-checks the session
 * and role server-side, then refreshes the public site so a newly published
 * product (or the last one unpublished) shows or hides straight away.
 */

const PRODUCT_FIELDS = [
  "sku", "name", "generic_name", "strength", "form", "pack_size",
  "description", "therapeutic_area", "manufacturer", "country_of_origin",
  "registration_no", "price", "currency", "stock", "image_url",
  "is_published", "is_featured",
] as const;

const COLLECTION_FIELDS = [
  "slug", "name", "description", "therapeutic_area", "accent", "cover_url",
  "position", "is_published",
] as const;

function pick<K extends string>(input: Record<string, unknown>, keys: readonly K[]) {
  const out: Partial<Record<K, unknown>> = {};
  for (const key of keys) if (key in input) out[key] = input[key];
  return out;
}

function fail(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "23505") {
    throw new ActionError(
      error.message.includes("sku")
        ? "Another product already uses that SKU."
        : error.message.includes("slug")
          ? "Another collection already uses that slug."
          : "That already exists.",
    );
  }
  throw new ActionError(error.message);
}

function refreshSite() {
  revalidatePath("/", "layout");
}

export async function listProducts() {
  return run(async () => {
    await assertAdmin("catalog");
    const db = createAdminClient();
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    fail(error);
    return attachCollections(db, (data ?? []) as Product[]);
  });
}

/** A page address no other product uses: the name, then name + SKU, then a random tail. */
async function uniqueSlug(db: SupabaseClient, name: string, sku: string) {
  const base = slugify(name).replace(/^-|-$/g, "") || slugify(sku) || "product";
  const candidates = [base, `${base}-${slugify(sku)}`.replace(/-+$/, ""), `${base}-${randomUUID().slice(0, 6)}`];
  for (const slug of candidates) {
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (!count) return slug;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

/**
 * Creates or updates a product and sets exactly which collections it's in.
 * The page address is fixed at creation so shared links keep working after
 * a rename.
 */
export async function saveProduct(
  input: Record<string, unknown>,
  collectionIds: string[],
  id?: string,
) {
  return run(async () => {
    await assertAdmin("catalog");
    const payload = pick(input, PRODUCT_FIELDS);
    const name = String(payload.name ?? "").trim();
    if (!name) throw new ActionError("Give the product a name.");

    const db = createAdminClient();
    const productId = id ?? randomUUID();

    if (id) {
      fail((await db.from("products").update(payload).eq("id", id)).error);
    } else {
      const slug = await uniqueSlug(db, name, String(payload.sku ?? ""));
      fail((await db.from("products").insert({ ...payload, id: productId, slug })).error);
    }

    fail((await db.from("product_collections").delete().eq("product_id", productId)).error);
    const unique = [...new Set(collectionIds.filter((c) => typeof c === "string" && c))];
    if (unique.length) {
      fail(
        (
          await db
            .from("product_collections")
            .insert(unique.map((collection_id) => ({ product_id: productId, collection_id })))
        ).error,
      );
    }

    refreshSite();
  });
}

export async function patchProduct(id: string, changes: Partial<Product>) {
  return run(async () => {
    await assertAdmin("catalog");
    const { error } = await createAdminClient()
      .from("products")
      .update(pick(changes as Record<string, unknown>, PRODUCT_FIELDS))
      .eq("id", id);
    fail(error);
    refreshSite();
  });
}

export async function deleteProduct(id: string) {
  return run(async () => {
    await assertAdmin("catalog");
    const { error } = await createAdminClient().from("products").delete().eq("id", id);
    fail(error);
    refreshSite();
  });
}

export async function listCollections() {
  return run(async () => {
    await assertAdmin("catalog");
    const { data, error } = await createAdminClient()
      .from("collections")
      .select("*")
      .order("position", { ascending: true });
    fail(error);
    return (data ?? []) as Collection[];
  });
}

export async function saveCollection(input: Record<string, unknown>, id?: string) {
  return run(async () => {
    await assertAdmin("catalog");
    const payload = pick(input, COLLECTION_FIELDS);
    if (!String(payload.name ?? "").trim()) throw new ActionError("Give the collection a name.");

    const db = createAdminClient().from("collections");
    const { error } = id ? await db.update(payload).eq("id", id) : await db.insert(payload);
    fail(error);
    refreshSite();
  });
}

export async function patchCollection(id: string, changes: Partial<Collection>) {
  return run(async () => {
    await assertAdmin("catalog");
    const { error } = await createAdminClient()
      .from("collections")
      .update(pick(changes as Record<string, unknown>, COLLECTION_FIELDS))
      .eq("id", id);
    fail(error);
    refreshSite();
  });
}

/** Persists a new order. Takes ids in display order. */
export async function reorderCollections(ids: string[]) {
  return run(async () => {
    await assertAdmin("catalog");
    const db = createAdminClient();
    const results = await Promise.all(
      ids.map((id, position) => db.from("collections").update({ position }).eq("id", id)),
    );
    fail(results.find((r) => r.error)?.error ?? null);
    refreshSite();
  });
}

export async function deleteCollection(id: string) {
  return run(async () => {
    await assertAdmin("catalog");
    const { error } = await createAdminClient().from("collections").delete().eq("id", id);
    fail(error);
    refreshSite();
  });
}
