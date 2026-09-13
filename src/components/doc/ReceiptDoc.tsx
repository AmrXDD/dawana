import {
  DocSheet,
  DocMasthead,
  DocRule,
  DocField,
  DocParty,
  DocFooter,
  DocSignature,
} from "@/components/doc/DocSheet";
import { lineTotal, totals } from "@/lib/docs";
import { formatDate, formatMoney } from "@/lib/utils";
import { PALETTE, SIGNATORY } from "@/lib/brand";
import type { Receipt } from "@/lib/types";

/** Blank rows keep the ruled table height identical to the printed pad. */
const MIN_ROWS = 10;

/**
 * Payment Receipt — a direct translation of the receipt artwork in the
 * "Beyond The Logo" brand book: title left / lockup right, mint rules,
 * rounded deep-teal table, Amount Paid bar, capsule watermark.
 */
export default function ReceiptDoc({ receipt }: { receipt: Receipt }) {
  const items = receipt.items ?? [];
  const { subtotal, tax, grand } = totals(items, receipt.tax_rate);
  const blanks = Math.max(0, MIN_ROWS - items.length);

  const cellBorder = `1.2px solid ${PALETTE.deep}`;

  return (
    <DocSheet>
      <DocMasthead title="Payment Receipt" subtitle={receipt.ref} />

      <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[7mm]">
        {/* Date / number */}
        <div className="grid grid-cols-2 gap-10">
          <DocField
            label="Payment Date:"
            value={receipt.payment_date ? formatDate(receipt.payment_date) : ""}
          />
          <DocField label="Receipt No:" value={receipt.ref} />
        </div>

        <DocRule />

        {/* Parties */}
        <div className="grid grid-cols-2 gap-10">
          <DocParty heading="From:" party={receipt.from_party ?? {}} />
          <DocParty heading="Bill To:" party={receipt.bill_to ?? {}} />
        </div>

        <DocRule />

        {/* Ruled table with rounded outer corners, as printed */}
        <div
          className="overflow-hidden"
          style={{ border: cellBorder, borderRadius: "10px" }}
        >
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {[
                  { label: "Description", w: "auto", align: "left" as const },
                  { label: "Quantity", w: "22mm", align: "center" as const },
                  { label: "Unit Price", w: "28mm", align: "center" as const },
                  { label: "Total", w: "30mm", align: "center" as const },
                ].map((col, i) => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      width: col.w,
                      borderBottom: cellBorder,
                      borderLeft: i === 0 ? "none" : cellBorder,
                      color: PALETTE.deep,
                      fontFamily: "var(--font-bricolage)",
                    }}
                    className={`px-3 py-2.5 text-[14px] font-bold ${
                      col.align === "left" ? "text-left" : "text-center"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td
                    style={{ borderBottom: cellBorder }}
                    className="px-3 py-2 align-top leading-snug"
                  >
                    {item.description}
                    {item.discount > 0 && (
                      <span className="ml-2 text-[10px] text-[#7d928d]">
                        −{item.discount}%
                      </span>
                    )}
                  </td>
                  <td
                    style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                    className="px-3 py-2 text-center tabular-nums"
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                    className="px-3 py-2 text-center tabular-nums"
                  >
                    {formatMoney(item.unit_price, receipt.currency)}
                  </td>
                  <td
                    style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                    className="px-3 py-2 text-center font-medium tabular-nums"
                  >
                    {formatMoney(lineTotal(item), receipt.currency)}
                  </td>
                </tr>
              ))}

              {Array.from({ length: blanks }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td style={{ borderBottom: cellBorder }} className="h-[8.2mm] px-3" />
                  <td style={{ borderBottom: cellBorder, borderLeft: cellBorder }} />
                  <td style={{ borderBottom: cellBorder, borderLeft: cellBorder }} />
                  <td style={{ borderBottom: cellBorder, borderLeft: cellBorder }} />
                </tr>
              ))}

              {/* Subtotal / tax only appear when they carry information */}
              {receipt.tax_rate > 0 && (
                <>
                  <tr>
                    <td colSpan={2} style={{ borderBottom: cellBorder }} />
                    <td
                      style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                      className="px-3 py-1.5 text-center text-[11px] text-[#3d5a55]"
                    >
                      Subtotal
                    </td>
                    <td
                      style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                      className="px-3 py-1.5 text-center tabular-nums"
                    >
                      {formatMoney(subtotal, receipt.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ borderBottom: cellBorder }} />
                    <td
                      style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                      className="px-3 py-1.5 text-center text-[11px] text-[#3d5a55]"
                    >
                      Tax ({receipt.tax_rate}%)
                    </td>
                    <td
                      style={{ borderBottom: cellBorder, borderLeft: cellBorder }}
                      className="px-3 py-1.5 text-center tabular-nums"
                    >
                      {formatMoney(tax, receipt.currency)}
                    </td>
                  </tr>
                </>
              )}

              {/* Amount Paid bar */}
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-2.5 text-[15px] font-bold"
                  style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
                >
                  Amount Paid
                </td>
                <td
                  style={{ borderLeft: cellBorder }}
                  className="px-3 py-2.5 text-center text-[15px] font-bold"
                >
                  <span style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}>
                    Total Paid
                  </span>
                </td>
                <td
                  style={{ borderLeft: cellBorder }}
                  className="px-3 py-2.5 text-center text-[13.5px] font-bold tabular-nums"
                >
                  {formatMoney(grand, receipt.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Method + authorisation */}
        <div className="mt-[8mm] grid grid-cols-2 gap-10">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: PALETTE.deep }}>
              Payment Method:
            </h2>
            <p className="mt-2 text-[12.5px]">{receipt.payment_method}</p>

            {receipt.notes && (
              <p className="mt-4 max-w-[80mm] text-[10.5px] leading-relaxed text-[#3d5a55]">
                {receipt.notes}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-[15px] font-bold" style={{ color: PALETTE.deep }}>
              Authorized By:
            </h2>
            <div className="mt-1">
              <DocSignature
                label=""
                name={receipt.authorized_by || SIGNATORY.name}
                title={SIGNATORY.title}
              />
            </div>
          </div>
        </div>
      </div>

      <DocFooter note="Thank you for choosing Dawana!" />
    </DocSheet>
  );
}
