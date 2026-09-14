"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { ActionError, assertAdmin, run } from "@/lib/auth/admin";
import { docRef } from "@/lib/utils";

/**
 * Saves a generated receipt, contract or proposal.
 *
 * The sequence number comes from next_doc_seq() inside the database, so two
 * people saving at the same moment can never mint the same reference.
 */

const KINDS = {
  receipts: {
    prefix: "RCP",
    fields: [
      "payment_date", "from_party", "bill_to", "items", "payment_method",
      "currency", "tax_rate", "notes", "authorized_by",
    ],
  },
  contracts: {
    prefix: "CTR",
    fields: [
      "title", "counterparty", "effective_date", "end_date", "jurisdiction",
      "value", "currency", "clauses", "signatory_name", "signatory_title",
    ],
  },
  proposals: {
    prefix: "PRP",
    fields: [
      "title", "client", "prepared_by", "valid_until", "summary", "sections",
      "deliverables", "currency", "tax_rate",
    ],
  },
} as const;

export type DocKind = keyof typeof KINDS;

export async function saveDocument(kind: DocKind, input: Record<string, unknown>) {
  return run(async () => {
    const admin = await assertAdmin("documents");
    const spec = KINDS[kind];
    if (!spec) throw new ActionError("Unknown document type.");

    const db = createAdminClient();
    const year = new Date().getFullYear();

    const { data: seq, error: seqError } = await db.rpc("next_doc_seq", {
      p_kind: kind,
      p_year: year,
    });
    if (seqError) throw new ActionError(seqError.message);

    const ref = docRef(spec.prefix, seq as number, year);
    const row: Record<string, unknown> = { ref, seq, status: "draft", created_by: admin.id };
    for (const key of spec.fields) if (key in input) row[key] = input[key];

    const { error } = await db.from(kind).insert(row);
    if (error) throw new ActionError(error.message);

    return { ref };
  });
}
