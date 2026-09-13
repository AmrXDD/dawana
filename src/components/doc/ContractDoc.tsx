import Image from "next/image";
import {
  DocSheet,
  DocMasthead,
  DocFooter,
  DocSignature,
} from "@/components/doc/DocSheet";
import { formatDate, formatMoney } from "@/lib/utils";
import { BRAND, CONTACT, PALETTE, SIGNATORY } from "@/lib/brand";
import type { Contract } from "@/lib/types";

/**
 * Distribution contract, laid out on the letterhead from the brand book:
 * lockup and headline at the top, deep-teal clause numbering, dual signature
 * block, contact strip in the footer.
 *
 * Clauses flow across as many A4 sheets as needed — the first sheet carries
 * the masthead, continuation sheets carry a lighter running head.
 */
export default function ContractDoc({ contract }: { contract: Contract }) {
  const clauses = contract.clauses ?? [];
  const party = contract.counterparty ?? {};

  // Split so a long agreement paginates predictably rather than overflowing.
  const FIRST_PAGE = 4;
  const first = clauses.slice(0, FIRST_PAGE);
  const rest = clauses.slice(FIRST_PAGE);
  const restPages: typeof clauses[] = [];
  for (let i = 0; i < rest.length; i += 6) restPages.push(rest.slice(i, i + 6));

  const Clause = ({
    clause,
    index,
  }: {
    clause: { id: string; heading: string; body: string };
    index: number;
  }) => (
    <section key={clause.id} className="mt-[6mm] break-inside-avoid">
      <h3
        className="flex gap-3 text-[13px] font-bold"
        style={{ color: PALETTE.deep, fontFamily: "var(--font-bricolage)" }}
      >
        <span style={{ color: PALETTE.mint }} className="tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {clause.heading}
      </h3>
      <p className="mt-1.5 pl-[9mm] text-[11px] leading-[1.72] text-[#1d3b36]">
        {clause.body}
      </p>
    </section>
  );

  const meta: [string, string][] = [
    ["Reference", contract.ref],
    ["Effective date", formatDate(contract.effective_date)],
    ["Expiry", contract.end_date ? formatDate(contract.end_date) : "On notice"],
    [
      "Value",
      contract.value != null
        ? formatMoney(contract.value, contract.currency)
        : "As per Schedule B",
    ],
    ["Jurisdiction", contract.jurisdiction],
  ];

  return (
    <>
      <DocSheet>
        <DocMasthead title="Agreement" subtitle={contract.title} />

        <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[7mm]">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: PALETTE.mint }}
              >
                Between
              </p>
              <p className="mt-2 text-[13px] font-bold text-[#04221f]">
                {BRAND.legalName}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#3d5a55]">
                {CONTACT.address}
                <br />
                {CONTACT.phonePrimary} · {CONTACT.email}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: PALETTE.mint }}
              >
                And
              </p>
              <p className="mt-2 text-[13px] font-bold text-[#04221f]">
                {party.name || "Counterparty"}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#3d5a55]">
                {party.address}
                {party.address && <br />}
                {[party.contact, party.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {/* Key terms strip */}
          <dl
            className="mt-[7mm] grid grid-cols-5 gap-3 rounded-[8px] px-4 py-3"
            style={{ backgroundColor: "#f0faf7" }}
          >
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[8.5px] uppercase tracking-[0.12em] text-[#7d928d]">
                  {k}
                </dt>
                <dd className="mt-1 text-[10.5px] font-semibold leading-tight text-[#04221f]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className="mt-[7mm] h-[1.5px] w-full"
            style={{ backgroundColor: PALETTE.mint }}
          />

          {first.map((c, i) => (
            <Clause key={c.id} clause={c} index={i} />
          ))}
        </div>

        <DocFooter />
      </DocSheet>

      {restPages.map((page, p) => {
        const isLast = p === restPages.length - 1;
        return (
          <DocSheet key={p} watermark={isLast}>
            {/* Running head on continuation sheets */}
            <header className="relative z-10 flex items-center justify-between px-[16mm] pt-[13mm]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#7d928d]">
                {contract.title} · {contract.ref}
              </p>
              <Image
                src="/brand/dawana-wordmark.png"
                alt=""
                aria-hidden="true"
                width={1804}
                height={783}
                className="w-[26mm]"
              />
            </header>
            <div
              className="mx-[16mm] mt-3 h-[1px]"
              style={{ backgroundColor: "rgba(3,90,81,0.18)" }}
            />

            <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[2mm]">
              {page.map((c, i) => (
                <Clause key={c.id} clause={c} index={FIRST_PAGE + p * 6 + i} />
              ))}

              {/* Execution block lands on the final sheet */}
              {isLast && (
                <div className="mt-[14mm] break-inside-avoid">
                  <p className="text-[11px] leading-relaxed text-[#1d3b36]">
                    Agreed and executed by the duly authorised representatives of
                    the parties as of the Effective Date stated above.
                  </p>
                  <div className="mt-[8mm] flex justify-between gap-10">
                    <DocSignature
                      label={`For ${BRAND.name}`}
                      name={contract.signatory_name || SIGNATORY.name}
                      title={contract.signatory_title || SIGNATORY.title}
                    />
                    <DocSignature
                      label={`For ${party.name || "Counterparty"}`}
                      name=" "
                      title="Name & title"
                    />
                  </div>
                </div>
              )}
            </div>

            <DocFooter />
          </DocSheet>
        );
      })}

      {/* No continuation sheets: execute on sheet one */}
      {restPages.length === 0 && (
        <DocSheet>
          <header className="relative z-10 flex items-center justify-between px-[16mm] pt-[13mm]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7d928d]">
              {contract.title} · {contract.ref}
            </p>
            <Image
              src="/brand/dawana-wordmark.png"
              alt=""
              aria-hidden="true"
              width={1804}
              height={783}
              className="w-[26mm]"
            />
          </header>
          <div className="relative z-10 flex flex-1 flex-col px-[16mm] pt-[14mm]">
            <p className="text-[11px] leading-relaxed text-[#1d3b36]">
              Agreed and executed by the duly authorised representatives of the
              parties as of the Effective Date stated above.
            </p>
            <div className="mt-[10mm] flex justify-between gap-10">
              <DocSignature
                label={`For ${BRAND.name}`}
                name={contract.signatory_name || SIGNATORY.name}
                title={contract.signatory_title || SIGNATORY.title}
              />
              <DocSignature
                label={`For ${party.name || "Counterparty"}`}
                name=" "
                title="Name & title"
              />
            </div>
          </div>
          <DocFooter />
        </DocSheet>
      )}
    </>
  );
}
