import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendContactEmails, isResendConfigured } from "@/lib/resend";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(200),
  organisation: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message is too short").max(5000),
  // Honeypot — must stay empty.
  company_website: z.string().max(0).optional().or(z.literal("")),
});

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

  const { company_website, ...data } = parsed.data;

  // Silently accept honeypot hits so bots don't learn the rule.
  if (company_website) return NextResponse.json({ ok: true });

  const results = { stored: false, emailed: false };

  // Persist first — an email failure must never lose the enquiry.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        organisation: data.organisation || null,
        subject: data.subject || null,
        message: data.message,
        user_agent: request.headers.get("user-agent"),
      });
      results.stored = !error;
    } catch {
      results.stored = false;
    }
  }

  if (isResendConfigured()) {
    try {
      const sent = await sendContactEmails(data);
      results.emailed = Boolean(sent.delivered);
    } catch {
      results.emailed = false;
    }
  }

  // If neither sink is configured the message would vanish — say so rather
  // than showing a success state that means nothing.
  if (!results.stored && !results.emailed) {
    return NextResponse.json(
      {
        error:
          "Messaging is not configured yet. Please email us directly while we finish setup.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, ...results });
}
