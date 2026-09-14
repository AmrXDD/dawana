import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, isAdminDataConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(200),
  organisation: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message is too short").max(5000),
  /** Address of the product page the enquiry started from, if any. */
  product: z.string().trim().max(200).optional().or(z.literal("")),
  // Honeypot — must stay empty.
  company_website: z.string().max(0).optional().or(z.literal("")),
});

/**
 * Website enquiries land in the contact_messages table and show up on the
 * control-room overview. Written with the service role on the server, so the
 * table needs no public insert policy at all.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 400 },
    );
  }

  const { company_website, product, ...data } = parsed.data;

  // Silently accept honeypot hits so bots don't learn the rule.
  if (company_website) return NextResponse.json({ ok: true });

  // With nowhere to store it the message would vanish — say so rather than
  // showing a success state that means nothing.
  if (!isAdminDataConfigured()) {
    return NextResponse.json(
      { error: "Messaging is not configured yet. Please email us directly while we finish setup." },
      { status: 503 },
    );
  }

  const db = createAdminClient();

  /* A product enquiry names the product from the database, not from the
     page, so the subject line in the admin is always accurate. */
  let subject = data.subject || null;
  if (product) {
    const { data: row } = await db
      .from("products")
      .select("name, sku, strength")
      .eq("slug", product)
      .eq("is_published", true)
      .maybeSingle();
    if (row) {
      subject = `Product enquiry — ${row.name}${row.strength ? ` ${row.strength}` : ""} (${row.sku})`.slice(0, 160);
    }
  }

  const { error } = await db.from("contact_messages").insert({
    name: data.name,
    email: data.email,
    organisation: data.organisation || null,
    subject,
    message: data.message,
    user_agent: request.headers.get("user-agent"),
  });

  if (error) {
    return NextResponse.json(
      { error: "We couldn't send that just now. Please try again or email us directly." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
