export type DocStatus = "draft" | "sent" | "signed" | "paid" | "void" | "expired";

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  therapeutic_area: string | null;
  accent: string | null;
  cover_url: string | null;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  collection_id: string | null;
  sku: string;
  name: string;
  generic_name: string | null;
  strength: string | null;
  form: string | null;
  pack_size: string | null;
  description: string | null;
  therapeutic_area: string | null;
  manufacturer: string | null;
  country_of_origin: string | null;
  registration_no: string | null;
  price: number | null;
  currency: string;
  stock: number;
  image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  collection?: Pick<Collection, "id" | "name" | "slug"> | null;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  /** Percentage, 0–100. Applied per line before tax. */
  discount: number;
}

export interface Party {
  name: string;
  contact: string;
  address: string;
  email?: string;
}

export interface Receipt {
  id: string;
  ref: string;
  seq: number;
  payment_date: string;
  from_party: Party;
  bill_to: Party;
  items: LineItem[];
  payment_method: "Cash" | "Credit Card" | "Bank Transfer" | "Cheque";
  currency: string;
  tax_rate: number;
  notes: string | null;
  authorized_by: string;
  status: DocStatus;
  created_at: string;
  updated_at: string;
}

export interface ContractClause {
  id: string;
  heading: string;
  body: string;
}

export interface Contract {
  id: string;
  ref: string;
  seq: number;
  title: string;
  counterparty: Party;
  effective_date: string;
  end_date: string | null;
  jurisdiction: string;
  value: number | null;
  currency: string;
  clauses: ContractClause[];
  signatory_name: string;
  signatory_title: string;
  status: DocStatus;
  created_at: string;
  updated_at: string;
}

export interface ProposalSection {
  id: string;
  heading: string;
  body: string;
}

export interface ProposalDeliverable {
  id: string;
  name: string;
  detail: string;
  amount: number;
}

export interface Proposal {
  id: string;
  ref: string;
  seq: number;
  title: string;
  client: Party;
  prepared_by: string;
  valid_until: string;
  summary: string;
  sections: ProposalSection[];
  deliverables: ProposalDeliverable[];
  currency: string;
  tax_rate: number;
  status: DocStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  organisation: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

/** Shape returned by /api/health — drives the Site Health dashboard. */
export interface HealthCheck {
  id: string;
  label: string;
  status: "ok" | "degraded" | "down" | "unconfigured";
  latency_ms: number | null;
  detail: string;
}

export interface HealthReport {
  checked_at: string;
  overall: "ok" | "degraded" | "down";
  checks: HealthCheck[];
  meta: {
    environment: string;
    region: string | null;
    commit: string | null;
    node: string;
  };
}
