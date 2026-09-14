"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import DocWorkbench from "@/components/admin/DocWorkbench";
import ReceiptDoc from "@/components/doc/ReceiptDoc";
import { Panel } from "@/components/admin/Shell";
import Button from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { saveDocument } from "@/lib/actions/documents";
import { emptyLine, lineTotal, totals } from "@/lib/docs";
import { BRAND, CONTACT, SIGNATORY } from "@/lib/brand";
import { docRef, formatMoney } from "@/lib/utils";
import type { LineItem, Party, Receipt } from "@/lib/types";

const DAWANA_PARTY: Party = {
  name: BRAND.legalName,
  contact: CONTACT.phonePrimary,
  address: CONTACT.address,
  email: CONTACT.email,
};

export default function ReceiptGenerator({ configured }: { configured: boolean }) {
  const [seq] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [billTo, setBillTo] = useState<Party>({ name: "", contact: "", address: "", email: "" });
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [method, setMethod] = useState<Receipt["payment_method"]>("Bank Transfer");
  const [currency, setCurrency] = useState("KWD");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState<string>(SIGNATORY.name);
  const [saving, setSaving] = useState(false);

  const ref = useMemo(() => docRef("RCP", seq), [seq]);
  const sums = totals(items, taxRate);

  const receipt: Receipt = {
    id: "preview",
    ref,
    seq,
    payment_date: paymentDate,
    from_party: DAWANA_PARTY,
    bill_to: billTo,
    items,
    payment_method: method,
    currency,
    tax_rate: taxRate,
    notes: notes || null,
    authorized_by: authorizedBy,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function save() {
    if (!configured) return;
    if (!billTo.name.trim()) {
      toast.error("Add who this receipt is billed to.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveDocument("receipts", {
        payment_date: paymentDate,
        from_party: DAWANA_PARTY,
        bill_to: billTo,
        items,
        payment_method: method,
        currency,
        tax_rate: taxRate,
        notes: notes || null,
        authorized_by: authorizedBy,
      });
      if (!result.ok) throw new Error(result.error);

      toast.success(`Receipt ${result.data.ref} saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save receipt.");
    } finally {
      setSaving(false);
    }
  }

  const editor = (
    <div className="flex flex-col gap-5">
      <Panel title="Payment">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Payment date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <SelectField
            label="Payment method"
            value={method}
            onValueChange={(value) => setMethod(value as Receipt["payment_method"])}
          >
            {["Cash", "Credit Card", "Bank Transfer", "Cheque"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectField>
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
            hint="Kuwait has no VAT today — leave at 0 unless billing cross-border."
          />
        </div>
      </Panel>

      <Panel title="Bill to">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            required
            value={billTo.name}
            onChange={(e) => setBillTo({ ...billTo, name: e.target.value })}
            placeholder="Client or institution"
          />
          <TextField
            label="Contact"
            value={billTo.contact}
            onChange={(e) => setBillTo({ ...billTo, contact: e.target.value })}
            placeholder="+965 …"
          />
          <TextField
            label="Email"
            type="email"
            value={billTo.email ?? ""}
            onChange={(e) => setBillTo({ ...billTo, email: e.target.value })}
          />
          <TextField
            label="Address"
            value={billTo.address}
            onChange={(e) => setBillTo({ ...billTo, address: e.target.value })}
          />
        </div>
      </Panel>

      <Panel
        title="Line items"
        actions={
          <Button size="sm" variant="outline" onClick={() => setItems((p) => [...p, emptyLine()])}
            className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6">
            <Plus className="size-3.5" aria-hidden="true" />
            Add line
          </Button>
        }
      >
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="rounded-tight border border-[color:var(--color-night-line)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] tracking-[0.14em] text-mint-300/45">
                  LINE {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.8rem] tabular-nums text-mint-100">
                    {formatMoney(lineTotal(item), currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))}
                    disabled={items.length === 1}
                    aria-label={`Remove line ${i + 1}`}
                    className="grid size-7 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-signal-bad/12 hover:text-signal-bad disabled:opacity-25"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <TextField
                  label="Description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Product or service"
                />
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Quantity"
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                    }
                  />
                  <TextField
                    label="Unit price"
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                    }
                  />
                  <TextField
                    label="Discount %"
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) =>
                      updateItem(item.id, { discount: Number(e.target.value) || 0 })
                    }
                  />
                </div>
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
            <dt className="font-medium text-mint-50">Total paid</dt>
            <dd className="font-mono text-[1rem] font-semibold tabular-nums text-mint">
              {formatMoney(sums.grand, currency)}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Authorisation">
        <div className="flex flex-col gap-4">
          <TextField
            label="Authorised by"
            value={authorizedBy}
            onChange={(e) => setAuthorizedBy(e.target.value)}
          />
          <TextAreaField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note printed under the payment method."
          />
        </div>
      </Panel>
    </div>
  );

  return (
    <DocWorkbench
      reference={ref}
      editor={editor}
      preview={<ReceiptDoc receipt={receipt} />}
      onSave={save}
      saving={saving}
      configured={configured}
      sheets={1}
    />
  );
}
