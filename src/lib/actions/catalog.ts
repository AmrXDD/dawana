"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionError, assertAdmin, run } from "@/lib/auth/admin";
import type { Collection, Product } from "@/lib/types";

/**
 * Catalogue writes for the control room. Every action re-checks the session
 * and role server-side, then refreshes the public site so a newly published
 * product (or the last one unpublished) shows or hides straight away.
 */

const PRODUCT_FIELDS = [
  "collection_id", "sku", "name", "generic_name", "strength", "form", "pack_size",
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

const PRODUCT_SELECT = "*, collection:collections(id,name,slug)";

export async function listProducts() {
  return run(async () => {
    await assertAdmin("catalog");
    const { data, error } = await createAdminClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    fail(error);
    return (data ?? []) as unknown as Product[];
  });
}

export async function saveProduct(input: Record<string, unknown>, id?: string) {
  return run(async () => {
    await assertAdmin("catalog");
    const payload = pick(input, PRODUCT_FIELDS);
    if (!String(payload.name ?? "").trim()) throw new ActionError("Give the product a name.");

    const db = createAdminClient().from("products");
    const { error } = id ? await db.update(payload).eq("id", id) : await db.insert(payload);
    fail(error);
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
