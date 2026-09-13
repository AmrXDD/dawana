"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Panel } from "@/components/admin/Shell";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { THERAPEUTIC_AREAS } from "@/lib/brand";
import { cn, slugify } from "@/lib/utils";
import type { Collection } from "@/lib/types";

const BLANK = {
  name: "",
  slug: "",
  description: "",
  therapeutic_area: "",
  cover_url: "",
  is_published: false,
};

type Draft = typeof BLANK;

export default function CollectionsManager({
  initialCollections,
  configured,
}: {
  initialCollections: Collection[];
  configured: boolean;
}) {
  const [rows, setRows] = useState<Collection[]>(initialCollections);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("collections")
      .select("*")
      .order("position", { ascending: true });
    if (data) setRows(data as Collection[]);
  }, [supabase]);

  function startCreate() {
    setEditing(null);
    setDraft(BLANK);
    setOpen(true);
  }

  function startEdit(c: Collection) {
    setEditing(c);
    setDraft({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      therapeutic_area: c.therapeutic_area ?? "",
      cover_url: c.cover_url ?? "",
      is_published: c.is_published,
    });
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Connect Supabase to save collections.");
      return;
    }

    const payload = {
      ...draft,
      slug: draft.slug.trim() || slugify(draft.name),
      description: draft.description || null,
      therapeutic_area: draft.therapeutic_area || null,
      cover_url: draft.cover_url || null,
      position: editing?.position ?? rows.length,
    };

    setSaving(true);
    try {
      const { error } = editing
        ? await supabase.from("collections").update(payload).eq("id", editing.id)
        : await supabase.from("collections").insert(payload);

      if (error) throw new Error(error.message);
      toast.success(editing ? "Collection updated." : "Collection created.");
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(c: Collection) {
    if (!supabase) return;
    const next = !c.is_published;
    setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, is_published: next } : r)));
    const { error } = await supabase
      .from("collections")
      .update({ is_published: next })
      .eq("id", c.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === c.id ? c : r)));
      toast.error(error.message);
    }
  }

  /** Reorders by swapping positions with the neighbour, then persists both. */
  async function move(c: Collection, dir: -1 | 1) {
    const index = rows.findIndex((r) => r.id === c.id);
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const repositioned = next.map((r, i) => ({ ...r, position: i }));
    setRows(repositioned);

    if (!supabase) return;
    const { error } = await supabase
      .from("collections")
      .upsert(repositioned.map(({ id, position }) => ({ id, position })));
    if (error) toast.error(error.message);
  }

  async function remove(c: Collection) {
    if (!supabase) return;
    if (!confirm(`Delete "${c.name}"? Products in it will be unassigned.`)) return;

    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r.id !== c.id));
    const { error } = await supabase.from("collections").delete().eq("id", c.id);
    if (error) {
      setRows(snapshot);
      toast.error(error.message);
    } else {
      toast.success("Collection deleted.");
    }
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button variant="mint" onClick={startCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New collection
        </Button>
      </div>

      {rows.length === 0 ? (
        <Panel>
          <p className="py-14 text-center text-[0.9rem] text-mint-200/45">
            {configured
              ? "No collections yet. Create one to group the portfolio."
              : "Connect Supabase to manage collections."}
          </p>
        </Panel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((c, i) => (
            <li
              key={c.id}
              className="group rounded-card border border-[color:var(--color-night-line)] bg-night-raised/45 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[0.7rem] tabular-nums text-mint-300/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="truncate font-display text-[1.15rem] font-semibold text-mint-50">
                      {c.name}
                    </h2>
                  </div>
                  <p className="mt-1 font-mono text-[0.72rem] text-mint-300/40">
                    /{c.slug}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => togglePublish(c)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-capsule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors",
                    c.is_published
                      ? "bg-signal-good/12 text-signal-good hover:bg-signal-good/20"
                      : "bg-white/6 text-mint-300/60 hover:bg-white/10",
                  )}
                >
                  {c.is_published ? (
                    <Eye className="size-3" aria-hidden="true" />
                  ) : (
                    <EyeOff className="size-3" aria-hidden="true" />
                  )}
                  {c.is_published ? "Live" : "Draft"}
                </button>
              </div>

              {c.description && (
                <p className="mt-4 line-clamp-2 text-[0.85rem] leading-relaxed text-mint-200/55">
                  {c.description}
                </p>
              )}

              {c.therapeutic_area && (
                <p className="u-eyebrow mt-4 text-mint-400">
                  {THERAPEUTIC_AREAS.find((a) => a.id === c.therapeutic_area)?.name ??
                    c.therapeutic_area}
                </p>
              )}

              <div className="mt-5 flex items-center gap-1 border-t border-[color:var(--color-night-line)] pt-4">
                <span className="mr-auto flex items-center gap-0.5">
                  <GripVertical
                    className="size-4 text-mint-300/25"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => move(c, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(c, 1)}
                    disabled={i === rows.length - 1}
                    aria-label="Move down"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    ↓
                  </button>
                </span>

                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.name}`}
                  className="grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Edit collection" : "New collection"}
          className="fixed inset-0 z-50 grid place-items-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <form
            onSubmit={save}
            className="relative w-full max-w-lg rounded-card border border-[color:var(--color-night-line)] bg-night p-6"
          >
            <header className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-[1.15rem] font-semibold text-mint-50">
                {editing ? "Edit collection" : "New collection"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-tight text-mint-300/60 transition-colors hover:bg-white/6"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex flex-col gap-4">
              <TextField
                label="Name"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <TextField
                label="Slug"
                hint="Left blank, it's generated from the name."
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
              <TextAreaField
                label="Description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
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

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={draft.is_published}
                  onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                  className="size-4 accent-[#5cbca7]"
                />
                <span className="text-[0.85rem] text-mint-100">Published on the site</span>
              </label>
            </div>

            <div className="mt-7 flex gap-3">
              <Button type="submit" variant="mint" loading={saving} className="flex-1">
                {editing ? "Save changes" : "Create collection"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
