"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import DocWorkbench from "@/components/admin/DocWorkbench";
import ProposalDoc from "@/components/doc/ProposalDoc";
import { Panel } from "@/components/admin/Shell";
import Button from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { saveDocument } from "@/lib/actions/documents";
import {
  DEFAULT_SECTIONS,
  deliverableTotals,
  emptyDeliverable,
  emptySection,
} from "@/lib/docs";
import { SIGNATORY } from "@/lib/brand";
import { docRef, formatMoney } from "@/lib/utils";
import type { Party, Proposal, ProposalDeliverable, ProposalSection } from "@/lib/types";

export default function ProposalGenerator({ configured }: { configured: boolean }) {
  const [seq] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [title, setTitle] = useState("Market Entry & Distribution Proposal");
  const [client, setClient] = useState<Party>({ name: "", contact: "", address: "", email: "" });
  const [preparedBy, setPreparedBy] = useState<string>(SIGNATORY.name);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [summary, setSummary] = useState(
    "A proposal for the registration, importation and nationwide distribution of your portfolio across Kuwait's public and private healthcare sectors.",
  );
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_SECTIONS);
  const [deliverables, setDeliverables] = useState<ProposalDeliverable[]>([
    { id: "d1", name: "Regulatory & registration", detail: "Dossier preparation and MoH submission.", amount: 0 },
  ]);
  const [currency, setCurrency] = useState("KWD");
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);

  const ref = useMemo(() => docRef("PRP", seq), [seq]);
  const sums = deliverableTotals(deliverables, taxRate);

  const proposal: Proposal = {
    id: "preview",
    ref,
    seq,
    title,
    client,
    prepared_by: preparedBy,
    valid_until: validUntil,
    summary,
    sections,
    deliverables,
    currency,
    tax_rate: taxRate,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  function moveSection(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  async function save() {
    if (!configured) return;
    if (!client.name.trim()) {
      toast.error("Add the client name.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveDocument("proposals", {
        title,
        client,
        prepared_by: preparedBy,
        valid_until: validUntil,
        summary,
        sections,
        deliverables,
        currency,
        tax_rate: taxRate,
      });
      if (!result.ok) throw new Error(result.error);

      toast.success(`Proposal ${result.data.ref} saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save proposal.");
    } finally {
      setSaving(false);
    }
  }

  const editor = (
    <div className="flex flex-col gap-5">
      <Panel title="Proposal">
        <div className="grid gap-4">
          <TextField
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextAreaField
            label="Executive summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            hint="Appears on the cover sheet beneath the title."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Prepared by"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
            />
            <TextField
              label="Valid until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Client">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            required
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
          />
          <TextField
            label="Contact"
            value={client.contact}
            onChange={(e) => setClient({ ...client, contact: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            value={client.email ?? ""}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
          />
          <TextField
            label="Address"
            value={client.address}
            onChange={(e) => setClient({ ...client, address: e.target.value })}
          />
        </div>
      </Panel>

      <Panel
        title="Narrative"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSections(DEFAULT_SECTIONS)}
              className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSections((p) => [...p, emptySection()])}
              className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </Button>
          </div>
        }
      >
        <ul className="flex flex-col gap-3">
          {sections.map((section, i) => (
            <li
              key={section.id}
              className="rounded-tight border border-[color:var(--color-night-line)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] tracking-[0.14em] text-mint-300/45">
                  SECTION {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSection(i, -1)}
                    disabled={i === 0}
                    aria-label="Move section up"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(i, 1)}
                    disabled={i === sections.length - 1}
                    aria-label="Move section down"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSections((p) => p.filter((s) => s.id !== section.id))}
                    aria-label="Delete section"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <TextField
                  label="Heading"
                  value={section.heading}
                  onChange={(e) =>
                    setSections((p) =>
                      p.map((s) => (s.id === section.id ? { ...s, heading: e.target.value } : s)),
                    )
                  }
                />
                <TextAreaField
                  label="Body"
                  value={section.body}
                  onChange={(e) =>
                    setSections((p) =>
                      p.map((s) => (s.id === section.id ? { ...s, body: e.target.value } : s)),
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Investment"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeliverables((p) => [...p, emptyDeliverable()])}
            className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add
          </Button>
        }
      >
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Currency"
            value={currency}
            onValueChange={(value) => setCurrency(value)}
          >
            {["KWD", "USD", "EUR", "AED", "SAR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
          <TextField
            label="Tax rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
          />
        </div>

        <ul className="flex flex-col gap-3">
          {deliverables.map((d, i) => (
            <li
              key={d.id}
              className="rounded-tight border border-[color:var(--color-night-line)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] tracking-[0.14em] text-mint-300/45">
                  ITEM {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setDeliverables((p) => p.filter((x) => x.id !== d.id))}
                  disabled={deliverables.length === 1}
                  aria-label={`Remove deliverable ${i + 1}`}
                  className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad disabled:opacity-25"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid gap-3">
                <TextField
                  label="Deliverable"
                  value={d.name}
                  onChange={(e) =>
                    setDeliverables((p) =>
                      p.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)),
                    )
                  }
                />
                <TextField
                  label="Detail"
                  value={d.detail}
                  onChange={(e) =>
                    setDeliverables((p) =>
                      p.map((x) => (x.id === d.id ? { ...x, detail: e.target.value } : x)),
                    )
                  }
                />
                <TextField
                  label="Amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={d.amount}
                  onChange={(e) =>
                    setDeliverables((p) =>
                      p.map((x) =>
                        x.id === d.id ? { ...x, amount: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-[color:var(--color-night-line)] pt-4 text-[0.85rem]">
          <div className="flex justify-between">
            <dt className="text-mint-200/55">Subtotal</dt>
            <dd className="font-mono tabular-nums text-mint-100">
              {formatMoney(sums.subtotal, currency)}
            </dd>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between">
              <dt className="text-mint-200/55">Tax ({taxRate}%)</dt>
              <dd className="font-mono tabular-nums text-mint-100">
                {formatMoney(sums.tax, currency)}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[color:var(--color-night-line)] pt-2">
            <dt className="font-medium text-mint-50">Total</dt>
            <dd className="font-mono text-[1rem] font-semibold tabular-nums text-mint">
              {formatMoney(sums.grand, currency)}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );

  return (
    <DocWorkbench
      reference={ref}
      editor={editor}
      preview={<ProposalDoc proposal={proposal} />}
      onSave={save}
      saving={saving}
      configured={configured}
      sheets={3}
    />
  );
}
