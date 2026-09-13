import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Collection, ContactMessage, Product } from "@/lib/types";

/**
 * Read helpers for the admin screens.
 *
 * Every function degrades to an empty result (plus a `configured` flag) when
 * Supabase env vars are absent, so the dashboard is explorable before the
 * project is wired up rather than throwing a 500.
 */

export interface Listing<T> {
  rows: T[];
  count: number;
  configured: boolean;
  error: string | null;
}

const empty = <T,>(configured: boolean, error: string | null = null): Listing<T> => ({
  rows: [],
  count: 0,
  configured,
  error,
});

export async function getProducts(opts?: {
  search?: string;
  area?: string;
  limit?: number;
}): Promise<Listing<Product>> {
  if (!isSupabaseConfigured()) return empty<Product>(false);

  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("*, collection:collections(id,name,slug)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 100);

    if (opts?.search) {
      const q = `%${opts.search}%`;
      query = query.or(
        `name.ilike.${q},sku.ilike.${q},generic_name.ilike.${q},manufacturer.ilike.${q}`,
      );
    }
    if (opts?.area) query = query.eq("therapeutic_area", opts.area);

    const { data, error, count } = await query;
    if (error) return empty<Product>(true, error.message);

    return {
      rows: (data ?? []) as unknown as Product[],
      count: count ?? 0,
      configured: true,
      error: null,
    };
  } catch (e) {
    return empty<Product>(true, e instanceof Error ? e.message : "Unknown error");
  }
}

export async function getCollections(): Promise<Listing<Collection>> {
  if (!isSupabaseConfigured()) return empty<Collection>(false);

  try {
    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from("collections")
      .select("*", { count: "exact" })
      .order("position", { ascending: true });

    if (error) return empty<Collection>(true, error.message);
    return {
      rows: (data ?? []) as Collection[],
      count: count ?? 0,
      configured: true,
      error: null,
    };
  } catch (e) {
    return empty<Collection>(true, e instanceof Error ? e.message : "Unknown error");
  }
}

export async function getMessages(limit = 20): Promise<Listing<ContactMessage>> {
  if (!isSupabaseConfigured()) return empty<ContactMessage>(false);

  try {
    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return empty<ContactMessage>(true, error.message);
    return {
      rows: (data ?? []) as ContactMessage[],
      count: count ?? 0,
      configured: true,
      error: null,
    };
  } catch (e) {
    return empty<ContactMessage>(true, e instanceof Error ? e.message : "Unknown error");
  }
}

export interface DocSummary {
  kind: "receipts" | "contracts" | "proposals";
  total: number;
  draft: number;
  recent: { id: string; ref: string; title: string; status: string; created_at: string }[];
}

export async function getDocSummary(
  kind: DocSummary["kind"],
): Promise<DocSummary & { configured: boolean }> {
  const base = { kind, total: 0, draft: 0, recent: [], configured: false };
  if (!isSupabaseConfigured()) return base;

  try {
    const supabase = await createClient();
    const titleCol = kind === "receipts" ? "ref" : "title";

    const [{ count: total }, { count: draft }, { data }] = await Promise.all([
      supabase.from(kind).select("id", { count: "exact", head: true }),
      supabase
        .from(kind)
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from(kind)
        .select(`id, ref, status, created_at, ${titleCol}`)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      kind,
      total: total ?? 0,
      draft: draft ?? 0,
      recent: ((data ?? []) as Record<string, string>[]).map((r) => ({
        id: r.id,
        ref: r.ref,
        title: r[titleCol] ?? r.ref,
        status: r.status,
        created_at: r.created_at,
      })),
      configured: true,
    };
  } catch {
    return { ...base, configured: true };
  }
}
