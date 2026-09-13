import Image from "next/image";
import {
  DocSheet,
  DocMasthead,
  DocFooter,
  DocSignature,
} from "@/components/doc/DocSheet";
import { deliverableTotals } from "@/lib/docs";
import { formatDate, formatMoney } from "@/lib/utils";
import { BRAND, CONTACT, PALETTE, SIGNATORY, THERAPEUTIC_AREAS } from "@/lib/brand";
import type { Proposal } from "@/lib/types";

/**
 * Commercial proposal: a cover sheet built on the letterhead (oversized
 * headline, mint eyebrow, capsule watermark) followed by the narrative and
 * a costed deliverables schedule.
 */
export default function ProposalDoc({ proposal }: { proposal: Proposal }) {
  const client = proposal.client ?? {};
  const sections = proposal.sections ?? [];
  const deliverables = proposal.deliverables ?? [];
  const { subtotal, tax, grand } = deliverableTotals(deliverables, proposal.tax_rate);

  return (
    <>
      {/* ---------- Cover ---------- */}
      <DocSheet>
        <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[18mm]">
          <Image
            src="/brand/dawana-wordmark.png"
            alt={BRAND.name}
            width={1804}
            height={783}
            className="w-[52mm]"
          />
          <p
            className="mt-3 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: PALETTE.deep }}
          >
            {BRAND.tagline}
          </p>

          <div className="mt-[34mm]">
            <p
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ color: PALETTE.mint }}
            >
              Commercial proposal
            </p>
            <h1
              className="mt-4 max-w-[140mm] text-[38px] font-bold leading-[1.06] tracking-[-0.02em]"
              style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
            >
              {proposal.title}
            </h1>

            {proposal.summary && (
              <p className="mt-6 max-w-[125mm] text-[12px] leading-[1.7] text-[#3d5a55]">
                {proposal.summary}
              </p>
            )}
          </div>

          <dl className="mt-auto mb-[6mm] grid grid-cols-4 gap-5 border-t border-[rgba(3,90,81,0.18)] pt-5">
            {[
              ["Prepared for", client.name || "—"],
              ["Prepared by", proposal.prepared_by || SIGNATORY.name],
              ["Reference", proposal.ref],
              [
                "Valid until",
                proposal.valid_until ? formatDate(proposal.valid_until) : "—",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[8.5px] uppercase tracking-[0.14em] text-[#7d928d]">
                  {k}
                </dt>
                <dd className="mt-1.5 text-[11px] font-semibold leading-tight text-[#04221f]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <DocFooter />
      </DocSheet>

      {/* ---------- Narrative ---------- */}
      <DocSheet watermark={false}>
        <DocMasthead title="Proposal" subtitle={proposal.ref} />

        <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[7mm]">
          {sections.map((section, i) => (
            <section key={section.id} className="mt-[7mm] break-inside-avoid first:mt-0">
              <h2
                className="flex gap-3 text-[14px] font-bold"
                style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
              >
                <span style={{ color: PALETTE.mint }} className="tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <p className="mt-2 pl-[9mm] text-[11px] leading-[1.75] text-[#1d3b36]">
                {section.body}
              </p>
            </section>
          ))}

          {/* Capability strip — factual, drawn from the company profile */}
          <div
            className="mt-[10mm] rounded-[10px] px-5 py-4"
            style={{ backgroundColor: "#f0faf7" }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.16em]"
              style={{ color: PALETTE.mint }}
            >
              Therapeutic coverage
            </p>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {THERAPEUTIC_AREAS.map((a) => (
                <span key={a.id} className="text-[10.5px] font-medium text-[#04221f]">
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DocFooter />
      </DocSheet>

      {/* ---------- Investment ---------- */}
      <DocSheet>
        <DocMasthead title="Investment" subtitle={proposal.ref} />

        <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[7mm]">
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${PALETTE.deep}` }}>
                <th
                  scope="col"
                  className="pb-2.5 text-left text-[12px] font-bold"
                  style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
                >
                  Deliverable
                </th>
                <th
                  scope="col"
                  className="w-[34mm] pb-2.5 text-right text-[12px] font-bold"
                  style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid rgba(3,90,81,0.14)" }}>
                  <td className="py-3 pr-6 align-top">
                    <p className="font-semibold text-[#04221f]">{d.name}</p>
                    {d.detail && (
                      <p className="mt-1 text-[10.5px] leading-relaxed text-[#3d5a55]">
                        {d.detail}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right align-top tabular-nums">
                    {formatMoney(d.amount, proposal.currency)}
                  </td>
                </tr>
              ))}

              {deliverables.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-[11px] text-[#7d928d]">
                    No deliverables added.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td className="pt-4 text-right text-[11px] text-[#3d5a55]">Subtotal</td>
                <td className="pt-4 text-right tabular-nums">
                  {formatMoney(subtotal, proposal.currency)}
                </td>
              </tr>
              {proposal.tax_rate > 0 && (
                <tr>
                  <td className="pt-1.5 text-right text-[11px] text-[#3d5a55]">
                    Tax ({proposal.tax_rate}%)
                  </td>
                  <td className="pt-1.5 text-right tabular-nums">
                    {formatMoney(tax, proposal.currency)}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  className="pt-3 text-right text-[13px] font-bold"
                  style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
                >
                  Total
                </td>
                <td
                  className="pt-3 text-right text-[13px] font-bold tabular-nums"
                  style={{ color: PALETTE.deep }}
                >
                  {formatMoney(grand, proposal.currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-6 text-[9.5px] leading-relaxed text-[#7d928d]">
            All amounts are stated in {proposal.currency}. This proposal is valid
            until{" "}
            {proposal.valid_until ? formatDate(proposal.valid_until) : "the date agreed in writing"}{" "}
            and is subject to the execution of a distribution agreement governed
            by the laws of the State of Kuwait.
          </p>

          <div className="mt-[16mm] flex justify-between gap-10">
            <DocSignature
              label={`For ${BRAND.name}`}
              name={proposal.prepared_by || SIGNATORY.name}
              title={SIGNATORY.title}
            />
            <DocSignature
              label={`For ${client.name || "Client"}`}
              name=" "
              title="Name & title"
            />
          </div>

          <p className="mt-[10mm] text-[10px] text-[#3d5a55]">
            Questions? {CONTACT.phonePrimary} · {CONTACT.email}
          </p>
        </div>

        <DocFooter />
      </DocSheet>
    </>
  );
}
