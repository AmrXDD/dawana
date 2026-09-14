"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import DocWorkbench from "@/components/admin/DocWorkbench";
import ContractDoc from "@/components/doc/ContractDoc";
import { Panel } from "@/components/admin/Shell";
import Button from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { saveDocument } from "@/lib/actions/documents";
import { DEFAULT_CLAUSES, emptyClause } from "@/lib/docs";
import { SIGNATORY } from "@/lib/brand";
import { docRef } from "@/lib/utils";
import type { Contract, ContractClause, Party } from "@/lib/types";

export default function ContractGenerator({ configured }: { configured: boolean }) {
  const [seq] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [title, setTitle] = useState("Exclusive Distribution Agreement");
  const [counterparty, setCounterparty] = useState<Party>({
    name: "",
    contact: "",
    address: "",
    email: "",
  });
  const [effective, setEffective] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [jurisdiction, setJurisdiction] = useState("State of Kuwait");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("KWD");
  const [clauses, setClauses] = useState<ContractClause[]>(DEFAULT_CLAUSES);
  const [signatory, setSignatory] = useState<string>(SIGNATORY.name);
  const [signatoryTitle, setSignatoryTitle] = useState<string>(SIGNATORY.title);
  const [saving, setSaving] = useState(false);

  const ref = useMemo(() => docRef("CTR", seq), [seq]);

  const contract: Contract = {
    id: "preview",
    ref,
    seq,
    title,
    counterparty,
    effective_date: effective,
    end_date: endDate || null,
    jurisdiction,
    value: value === "" ? null : Number(value),
    currency,
    clauses,
    signatory_name: signatory,
    signatory_title: signatoryTitle,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Sheet count mirrors ContractDoc's pagination (4 on sheet one, 6 after).
  const sheets = 1 + Math.max(1, Math.ceil(Math.max(0, clauses.length - 4) / 6));

  function updateClause(id: string, patch: Partial<ContractClause>) {
    setClauses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= clauses.length) return;
    const next = [...clauses];
    [next[index], next[target]] = [next[target], next[index]];
    setClauses(next);
  }

  async function save() {
    if (!configured) return;
    if (!counterparty.name.trim()) {
      toast.error("Add the counterparty name.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveDocument("contracts", {
        title,
        counterparty,
        effective_date: effective,
        end_date: endDate || null,
        jurisdiction,
        value: value === "" ? null : Number(value),
        currency,
        clauses,
        signatory_name: signatory,
        signatory_title: signatoryTitle,
      });
      if (!result.ok) throw new Error(result.error);

      toast.success(`Contract ${result.data.ref} saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save contract.");
    } finally {
      setSaving(false);
    }
  }

  const editor = (
    <div className="flex flex-col gap-5">
      <Panel title="Agreement">
        <div className="grid gap-4">
          <TextField
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Effective date"
              type="date"
              value={effective}
              onChange={(e) => setEffective(e.target.value)}
            />
            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Leave blank for rolling renewal on notice."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Contract value"
              type="number"
              min="0"
              step="0.001"
              className="sm:col-span-2"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              hint="Blank prints 'As per Schedule B'."
            />
            <SelectField
              label="Currency"
              value={currency}
              onValueChange={(value) => setCurrency(value)}
            >
              {["KWD", "USD", "EUR", "AED", "SAR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectField>
          </div>
          <TextField
            label="Jurisdiction"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
          />
        </div>
      </Panel>

      <Panel title="Counterparty">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Legal name"
            required
            value={counterparty.name}
            onChange={(e) => setCounterparty({ ...counterparty, name: e.target.value })}
          />
          <TextField
            label="Contact"
            value={counterparty.contact}
            onChange={(e) => setCounterparty({ ...counterparty, contact: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            value={counterparty.email ?? ""}
            onChange={(e) => setCounterparty({ ...counterparty, email: e.target.value })}
          />
          <TextField
            label="Registered address"
            value={counterparty.address}
            onChange={(e) => setCounterparty({ ...counterparty, address: e.target.value })}
          />
        </div>
      </Panel>

      <Panel
        title="Clauses"
        description="Starting scaffolds — review every clause with counsel before issuing."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setClauses(DEFAULT_CLAUSES)}
              className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setClauses((p) => [...p, emptyClause()])}
              className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </Button>
          </div>
        }
      >
        <ul className="flex flex-col gap-3">
          {clauses.map((clause, i) => (
            <li
              key={clause.id}
              className="rounded-tight border border-[color:var(--color-night-line)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] tracking-[0.14em] text-mint-300/45">
                  CLAUSE {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move clause up"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === clauses.length - 1}
                    aria-label="Move clause down"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint disabled:opacity-25"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setClauses((p) => p.filter((c) => c.id !== clause.id))}
                    aria-label="Delete clause"
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <TextField
                  label="Heading"
                  value={clause.heading}
                  onChange={(e) => updateClause(clause.id, { heading: e.target.value })}
                />
                <TextAreaField
                  label="Body"
                  value={clause.body}
                  onChange={(e) => updateClause(clause.id, { body: e.target.value })}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Execution">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Signatory name"
            value={signatory}
            onChange={(e) => setSignatory(e.target.value)}
          />
          <TextField
            label="Signatory title"
            value={signatoryTitle}
            onChange={(e) => setSignatoryTitle(e.target.value)}
          />
        </div>
      </Panel>
    </div>
  );

  return (
    <DocWorkbench
      reference={ref}
      editor={editor}
      preview={<ContractDoc contract={contract} />}
      onSave={save}
      saving={saving}
      configured={configured}
      sheets={sheets}
    />
  );
}
