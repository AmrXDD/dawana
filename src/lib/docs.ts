import type {
  ContractClause,
  LineItem,
  ProposalDeliverable,
  ProposalSection,
} from "@/lib/types";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyLine(): LineItem {
  return { id: uid(), description: "", quantity: 1, unit_price: 0, discount: 0 };
}

export function lineTotal(item: LineItem) {
  const gross = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  const disc = Math.min(Math.max(Number(item.discount) || 0, 0), 100);
  return gross * (1 - disc / 100);
}

/** Single source of truth for money maths — the UI and the PDF must agree. */
export function totals(items: LineItem[], taxRate = 0) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, tax, grand: subtotal + tax };
}

export function deliverableTotals(items: ProposalDeliverable[], taxRate = 0) {
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, tax, grand: subtotal + tax };
}

/**
 * Starting clause set for a distribution agreement.
 * These are drafting scaffolds, not legal advice — the admin UI says so, and
 * every clause is editable before a contract is issued.
 */
export const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: uid(),
    heading: "Appointment & Territory",
    body: "The Supplier appoints Dawana as its distributor for the Products within the State of Kuwait. Dawana shall promote, market and distribute the Products through the private, government and modern-trade channels described in Schedule A.",
  },
  {
    id: uid(),
    heading: "Product Registration",
    body: "Dawana shall, at the Supplier's cost, manage registration of the Products with the Kuwait Ministry of Health and maintain all marketing authorisations for the duration of this Agreement. The Supplier shall provide all technical dossiers, certificates of analysis and legalised documentation required.",
  },
  {
    id: uid(),
    heading: "Orders, Pricing & Payment",
    body: "Prices are those set out in Schedule B and are stated in the currency named on the face of this Agreement. Payment terms are net sixty (60) days from the date of invoice unless otherwise agreed in writing. Title passes on delivery to Dawana's nominated warehouse.",
  },
  {
    id: uid(),
    heading: "Storage & Cold Chain",
    body: "Dawana shall store and transport the Products in accordance with the Supplier's stated conditions and applicable Good Distribution Practice, maintaining validated temperature monitoring across the cold chain and retaining records for inspection.",
  },
  {
    id: uid(),
    heading: "Pharmacovigilance & Recall",
    body: "Each party shall notify the other within twenty-four (24) hours of becoming aware of any adverse event, quality defect or regulatory action concerning the Products, and shall co-operate fully in any recall or field-safety corrective action.",
  },
  {
    id: uid(),
    heading: "Term & Termination",
    body: "This Agreement commences on the Effective Date and continues for the term stated on its face, renewing automatically for successive twelve (12) month periods unless either party gives ninety (90) days' written notice. Either party may terminate immediately for material breach that remains uncured for thirty (30) days after written notice.",
  },
  {
    id: uid(),
    heading: "Confidentiality",
    body: "Each party shall keep confidential all non-public information disclosed by the other and shall use it solely for the purposes of this Agreement. This obligation survives termination for five (5) years.",
  },
  {
    id: uid(),
    heading: "Governing Law & Jurisdiction",
    body: "This Agreement is governed by the laws of the State of Kuwait. The parties submit to the exclusive jurisdiction of the courts of Kuwait in respect of any dispute arising out of or in connection with it.",
  },
];

/** Starting narrative for a commercial proposal. */
export const DEFAULT_SECTIONS: ProposalSection[] = [
  {
    id: uid(),
    heading: "Understanding",
    body: "Dawana understands that the objective is to establish and grow the presence of your portfolio within the Kuwaiti market across both the public and private healthcare sectors, with measurable coverage and consistent availability.",
  },
  {
    id: uid(),
    heading: "Our Approach",
    body: "We combine regulatory handling, tender participation, warehouse and cold-chain management, and a field force of medical and sales representatives. Each therapeutic area is assigned a dedicated team with quarterly performance reviews.",
  },
  {
    id: uid(),
    heading: "Market Access",
    body: "Our tenders department manages registration and submission across Kuwait's government health institutions, while our modern-trade promoters and merchandisers drive visibility and sell-through in retail pharmacy chains and co-operatives.",
  },
  {
    id: uid(),
    heading: "Reporting & Governance",
    body: "Monthly sell-in and sell-out reporting, stock cover analysis, and a named account lead. Escalation paths and service levels are agreed in advance and reviewed at each quarterly business review.",
  },
];

export function emptyClause(): ContractClause {
  return { id: uid(), heading: "", body: "" };
}

export function emptySection(): ProposalSection {
  return { id: uid(), heading: "", body: "" };
}

export function emptyDeliverable(): ProposalDeliverable {
  return { id: uid(), name: "", detail: "", amount: 0 };
}
