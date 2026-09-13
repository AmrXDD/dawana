"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Panel } from "@/components/admin/Shell";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { THERAPEUTIC_AREAS } from "@/lib/brand";
import { cn, formatMoney, slugify } from "@/lib/utils";
import type { Collection, Product } from "@/lib/types";

interface Props {
  initialProducts: Product[];
  collections: Collection[];
  configured: boolean;
}

const BLANK = {
  sku: "",
  name: "",
  generic_name: "",
  strength: "",
  form: "",
  pack_size: "",
  description: "",
  therapeutic_area: "",
  manufacturer: "",
  country_of_origin: "",
  registration_no: "",
  price: "",
  currency: "KWD",
  stock: "0",
  image_url: "",
  collection_id: "",
  is_published: false,
  is_featured: false,
};

type Draft = typeof BLANK;

export default function ProductsManager({
  initialProducts,
  collections,
  configured,
}: Props) {
  const [rows, setRows] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("products")
      .select("*, collection:collections(id,name,slug)")
      .order("created_at", { ascending: false });
    if (data) setRows(data as unknown as Product[]);
  }, [supabase]);

  // Close the editor on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = rows.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [p.name, p.sku, p.generic_name, p.manufacturer]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    const matchesArea = !area || p.therapeutic_area === area;
    return matchesQuery && matchesArea;
  });

  function startCreate() {
    setEditing(null);
    setDraft(BLANK);
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setDraft({
      sku: p.sku ?? "",
      name: p.name ?? "",
      generic_name: p.generic_name ?? "",
      strength: p.strength ?? "",
      form: p.form ?? "",
      pack_size: p.pack_size ?? "",
      description: p.description ?? "",
      therapeutic_area: p.therapeutic_area ?? "",
      manufacturer: p.manufacturer ?? "",
      country_of_origin: p.country_of_origin ?? "",
      registration_no: p.registration_no ?? "",
      price: p.price != null ? String(p.price) : "",
      currency: p.currency ?? "KWD",
      stock: String(p.stock ?? 0),
      image_url: p.image_url ?? "",
      collection_id: p.collection_id ?? "",
      is_published: p.is_published,
      is_featured: p.is_featured,
    });
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Connect Supabase to save products.");
      return;
    }

    const payload = {
      ...draft,
      sku: draft.sku.trim() || `DW-${slugify(draft.name).slice(0, 20).toUpperCase()}`,
      price: draft.price === "" ? null : Number(draft.price),
      stock: Number(draft.stock) || 0,
      collection_id: draft.collection_id || null,
      generic_name: draft.generic_name || null,
      strength: draft.strength || null,
      form: draft.form || null,
      pack_size: draft.pack_size || null,
      description: draft.description || null,
      therapeutic_area: draft.therapeutic_area || null,
      manufacturer: draft.manufacturer || null,
      country_of_origin: draft.country_of_origin || null,
      registration_no: draft.registration_no || null,
      image_url: draft.image_url || null,
    };

    setSaving(true);
    try {
      const { error } = editing
        ? await supabase.from("products").update(payload).eq("id", editing.id)
        : await supabase.from("products").insert(payload);

      if (error) throw new Error(error.message);

      toast.success(editing ? "Product updated." : "Product created.");
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(p: Product, changes: Partial<Product>) {
    if (!supabase) return;
    // Optimistic — the row flips instantly and rolls back on failure.
    setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, ...changes } : r)));
    const { error } = await supabase.from("products").update(changes).eq("id", p.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === p.id ? p : r)));
      toast.error(error.message);
    }
  }

  async function remove(p: Product) {
    if (!supabase) return;
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;

    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r.id !== p.id));
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      setRows(snapshot);
      toast.error(error.message);
    } else {
      toast.success("Product deleted.");
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mint-300/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, manufacturer…"
            aria-label="Search products"
            className="w-full rounded-tight border border-[color:var(--color-night-line)] bg-night-raised/70 py-2.5 pl-10 pr-4 text-sm text-mint-50 outline-none transition-colors placeholder:text-mint-300/35 focus:border-mint focus:ring-2 focus:ring-mint/25"
          />
        </div>

        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          aria-label="Filter by therapeutic area"
          className="cursor-pointer rounded-tight border border-[color:var(--color-night-line)] bg-night-raised/70 px-3.5 py-2.5 text-sm text-mint-50 outline-none focus:border-mint"
        >
          <option value="">All areas</option>
          {THERAPEUTIC_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <Button variant="mint" onClick={startCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Button>
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <p className="py-14 text-center text-[0.9rem] text-mint-200/45">
            {!configured
              ? "Connect Supabase to manage the catalogue."
              : rows.length === 0
                ? "No products yet. Create your first one."
                : "No products match this filter."}
          </p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-night-line)]">
                  {["Product", "Area", "Price", "Stock", "Status", ""].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="pb-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-mint-300/45"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-night-line)]">
                {filtered.map((p) => (
                  <tr key={p.id} className="group">
                    <td className="py-3.5 pr-4">
                      <span className="flex items-center gap-2">
                        {p.is_featured && (
                          <Star
                            className="size-3.5 shrink-0 fill-mint text-mint"
                            aria-label="Featured"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-mint-50">{p.name}</span>
                          <span className="mt-0.5 block font-mono text-[0.7rem] text-mint-300/40">
                            {p.sku}
                            {p.strength ? ` · ${p.strength}` : ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-[0.82rem] text-mint-200/60">
                      {THERAPEUTIC_AREAS.find((a) => a.id === p.therapeutic_area)?.name ??
                        p.therapeutic_area ??
                        "—"}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[0.82rem] tabular-nums text-mint-100">
                      {p.price != null ? formatMoney(p.price, p.currency) : "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cn(
                          "font-mono text-[0.82rem] tabular-nums",
                          p.stock === 0 ? "text-signal-bad" : "text-mint-100",
                        )}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <button
                        type="button"
                        onClick={() => patch(p, { is_published: !p.is_published })}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-capsule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors",
                          p.is_published
                            ? "bg-signal-good/12 text-signal-good hover:bg-signal-good/20"
                            : "bg-white/6 text-mint-300/60 hover:bg-white/10",
                        )}
                      >
                        {p.is_published ? (
                          <Eye className="size-3" aria-hidden="true" />
                        ) : (
                          <EyeOff className="size-3" aria-hidden="true" />
                        )}
                        {p.is_published ? "Live" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3.5">
                      <span className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => patch(p, { is_featured: !p.is_featured })}
                          aria-label={p.is_featured ? "Unfeature" : "Feature"}
                          className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
                        >
                          <Star
                            className={cn("size-4", p.is_featured && "fill-mint text-mint")}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p)}
                          aria-label={`Delete ${p.name}`}
                          className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Editor drawer */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Edit product" : "New product"}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <form
            onSubmit={save}
            className="u-scroll-slim relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[color:var(--color-night-line)] bg-night"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--color-night-line)] bg-night/95 px-6 py-4 backdrop-blur">
              <h2 className="font-display text-[1.15rem] font-semibold text-mint-50">
                {editing ? "Edit product" : "New product"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-tight text-mint-300/60 transition-colors hover:bg-white/6 hover:text-mint"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <TextField
                label="Product name"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Ferrovit Plus"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="SKU"
                  hint="Left blank, one is generated from the name."
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                />
                <TextField
                  label="Generic name"
                  value={draft.generic_name}
                  onChange={(e) => setDraft({ ...draft, generic_name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="Strength"
                  value={draft.strength}
                  onChange={(e) => setDraft({ ...draft, strength: e.target.value })}
                  placeholder="500 mg"
                />
                <TextField
                  label="Form"
                  value={draft.form}
                  onChange={(e) => setDraft({ ...draft, form: e.target.value })}
                  placeholder="Tablet"
                />
                <TextField
                  label="Pack size"
                  value={draft.pack_size}
                  onChange={(e) => setDraft({ ...draft, pack_size: e.target.value })}
                  placeholder="30s"
                />
              </div>

              <TextAreaField
                label="Description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Therapeutic area"
                  value={draft.therapeutic_area}
                  onChange={(e) => setDraft({ ...draft, therapeutic_area: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {THERAPEUTIC_AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Collection"
                  value={draft.collection_id}
                  onChange={(e) => setDraft({ ...draft, collection_id: e.target.value })}
                >
                  <option value="">None</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Manufacturer"
                  value={draft.manufacturer}
                  onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })}
                />
                <TextField
                  label="Country of origin"
                  value={draft.country_of_origin}
                  onChange={(e) =>
                    setDraft({ ...draft, country_of_origin: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <TextField
                  label="Price"
                  type="number"
                  step="0.001"
                  min="0"
                  className="sm:col-span-2"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
                <SelectField
                  label="Currency"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                >
                  {["KWD", "USD", "EUR", "AED", "SAR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <TextField
                  label="Stock"
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Registration no."
                  value={draft.registration_no}
                  onChange={(e) => setDraft({ ...draft, registration_no: e.target.value })}
                />
                <TextField
                  label="Image URL"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>

              <fieldset className="mt-2 flex flex-wrap gap-6 border-t border-[color:var(--color-night-line)] pt-5">
                <legend className="sr-only">Visibility</legend>
                {[
                  { key: "is_published" as const, label: "Published on the site" },
                  { key: "is_featured" as const, label: "Featured in the portfolio" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                      className="size-4 accent-[#5cbca7]"
                    />
                    <span className="text-[0.85rem] text-mint-100">{label}</span>
                  </label>
                ))}
              </fieldset>
            </div>

            <footer className="sticky bottom-0 flex gap-3 border-t border-[color:var(--color-night-line)] bg-night/95 px-6 py-4 backdrop-blur">
              <Button type="submit" variant="mint" loading={saving} className="flex-1">
                {editing ? "Save changes" : "Create product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
              >
                Cancel
              </Button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}
