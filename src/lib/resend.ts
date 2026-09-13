import "server-only";
import { Resend } from "resend";
import { BRAND, CONTACT, PALETTE } from "@/lib/brand";

let client: Resend | null = null;

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? `noreply@${BRAND.domain}`;
const INBOX = () => process.env.CONTACT_INBOX_EMAIL ?? CONTACT.email;

/** Brand-consistent email chrome: bone paper, deep-teal masthead, mint rule. */
function shell(title: string, inner: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:32px 16px;background:#f5f2ed;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#04221f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid rgba(3,90,81,0.12);">
    <tr>
      <td style="background:${PALETTE.deep};padding:26px 32px;">
        <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${PALETTE.mint};">dawana</div>
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-top:6px;">${BRAND.tagline}</div>
      </td>
    </tr>
    <tr><td style="height:3px;background:linear-gradient(90deg,${PALETTE.mint},rgba(92,188,167,0));"></td></tr>
    <tr><td style="padding:32px;">${inner}</td></tr>
    <tr>
      <td style="padding:20px 32px;background:#f5f2ed;border-top:1px solid rgba(3,90,81,0.1);font-size:12px;line-height:1.7;color:#7d928d;">
        ${BRAND.legalName} · ${CONTACT.address}<br>
        ${CONTACT.phonePrimary} · <a href="mailto:${CONTACT.email}" style="color:${PALETTE.deep};text-decoration:none;">${CONTACT.email}</a> · <a href="${BRAND.url}" style="color:${PALETTE.deep};text-decoration:none;">${BRAND.domain}</a>
      </td>
    </tr>
  </table>
</body></html>`;
}

const h1 = (t: string) =>
  `<h1 style="margin:0 0 18px;font-size:21px;letter-spacing:-0.02em;color:#04221f;">${t}</h1>`;
const p = (t: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d5a55;">${t}</p>`;
const row = (k: string, v: string) =>
  `<tr><td style="padding:9px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#7d928d;width:36%;vertical-align:top;">${k}</td><td style="padding:9px 0;font-size:15px;color:#04221f;">${v}</td></tr>`;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export interface ContactPayload {
  name: string;
  email: string;
  organisation?: string | null;
  subject?: string | null;
  message: string;
}

/** Notifies the Dawana inbox and acknowledges the sender. */
export async function sendContactEmails(payload: ContactPayload) {
  const resend = getResend();
  if (!resend || !isResendConfigured()) {
    return { delivered: false as const, reason: "resend_not_configured" };
  }

  const subject = payload.subject?.trim() || "General enquiry";

  const notify = shell(
    "New enquiry",
    h1("New enquiry from the website") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(3,90,81,0.1);">
        ${row("Name", esc(payload.name))}
        ${row("Email", `<a href="mailto:${esc(payload.email)}" style="color:${PALETTE.deep};">${esc(payload.email)}</a>`)}
        ${row("Organisation", esc(payload.organisation || "—"))}
        ${row("Subject", esc(subject))}
      </table>
      <div style="margin-top:22px;padding:18px;background:#f5f2ed;border-radius:12px;border-left:3px solid ${PALETTE.mint};">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7d928d;margin-bottom:8px;">Message</div>
        <div style="font-size:15px;line-height:1.7;color:#04221f;white-space:pre-wrap;">${esc(payload.message)}</div>
      </div>`,
  );

  const ack = shell(
    "We received your message",
    h1(`Thank you, ${esc(payload.name.split(" ")[0] ?? payload.name)}`) +
      p("Your message has reached the Dawana team. We aim to respond within one business day.") +
      p(`For anything urgent, call us on <strong style="color:#04221f;">${CONTACT.phonePrimary}</strong>.`) +
      `<div style="margin-top:22px;padding:18px;background:#f5f2ed;border-radius:12px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7d928d;margin-bottom:8px;">Your message</div>
        <div style="font-size:14px;line-height:1.7;color:#3d5a55;white-space:pre-wrap;">${esc(payload.message)}</div>
      </div>`,
  );

  const [notifyRes, ackRes] = await Promise.allSettled([
    resend.emails.send({
      from: FROM(),
      to: INBOX(),
      replyTo: payload.email,
      subject: `[Website] ${subject} — ${payload.name}`,
      html: notify,
    }),
    resend.emails.send({
      from: FROM(),
      to: payload.email,
      subject: `We received your message — ${BRAND.name}`,
      html: ack,
    }),
  ]);

  return {
    delivered: notifyRes.status === "fulfilled",
    acknowledged: ackRes.status === "fulfilled",
  };
}

export interface DocumentEmailInput {
  to: string;
  kind: "receipt" | "contract" | "proposal";
  ref: string;
  title: string;
  message?: string;
  /** Public or signed URL to the rendered PDF. */
  viewUrl?: string;
}

/** Sends a generated document to a client from the admin dashboard. */
export async function sendDocumentEmail(input: DocumentEmailInput) {
  const resend = getResend();
  if (!resend || !isResendConfigured()) {
    return { delivered: false as const, reason: "resend_not_configured" };
  }

  const label = { receipt: "Payment Receipt", contract: "Contract", proposal: "Proposal" }[
    input.kind
  ];

  const html = shell(
    `${label} ${input.ref}`,
    h1(`${label} — ${esc(input.title)}`) +
      p(input.message ? esc(input.message) : `Please find your ${label.toLowerCase()} below.`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(3,90,81,0.1);">
        ${row("Reference", `<span style="font-family:ui-monospace,monospace;">${esc(input.ref)}</span>`)}
        ${row("Document", esc(label))}
      </table>` +
      (input.viewUrl
        ? `<div style="margin-top:26px;"><a href="${input.viewUrl}" style="display:inline-block;background:${PALETTE.deep};color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:14px;font-weight:600;">View ${label.toLowerCase()}</a></div>`
        : ""),
  );

  const res = await resend.emails.send({
    from: FROM(),
    to: input.to,
    subject: `${label} ${input.ref} — ${BRAND.name}`,
    html,
  });

  return { delivered: !res.error, id: res.data?.id, error: res.error?.message };
}
