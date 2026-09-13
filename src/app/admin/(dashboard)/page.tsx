import Link from "next/link";
import {
  ArrowUpRight,
  FileSignature,
  FileText,
  Layers,
  Mail,
  Package,
} from "lucide-react";
import { PageHead, Panel } from "@/components/admin/Shell";
import { getCollections, getDocSummary, getMessages, getProducts } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  draft: "text-mint-300/60 bg-white/6",
  sent: "text-signal-warn bg-signal-warn/12",
  paid: "text-signal-good bg-signal-good/12",
  signed: "text-signal-good bg-signal-good/12",
  void: "text-signal-bad bg-signal-bad/12",
  expired: "text-signal-bad bg-signal-bad/12",
};

export default async function AdminOverview() {
  const [products, collections, messages, receipts, contracts, proposals] =
    await Promise.all([
      getProducts({ limit: 1 }),
      getCollections(),
      getMessages(5),
      getDocSummary("receipts"),
      getDocSummary("contracts"),
      getDocSummary("proposals"),
    ]);

  const configured = products.configured;

  const stats = [
    { label: "Products", value: products.count, href: "/admin/products", Icon: Package },
    { label: "Collections", value: collections.count, href: "/admin/collections", Icon: Layers },
    { label: "Receipts", value: receipts.total, href: "/admin/receipts", Icon: FileText },
    { label: "Contracts", value: contracts.total, href: "/admin/contracts", Icon: FileSignature },
  ];

  const recent = [
    ...receipts.recent.map((r) => ({ ...r, kind: "Receipt", href: "/admin/receipts" })),
    ...contracts.recent.map((r) => ({ ...r, kind: "Contract", href: "/admin/contracts" })),
    ...proposals.recent.map((r) => ({ ...r, kind: "Proposal", href: "/admin/proposals" })),
  ]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  return (
    <>
      <PageHead
        title="Overview"
        description={`Everything happening across ${BRAND.name} — catalogue, documents and enquiries.`}
      />

      {!configured && (
        <div className="mb-6 rounded-card border border-signal-warn/35 bg-signal-warn/8 px-6 py-5">
          <h2 className="font-display text-[1.05rem] font-semibold text-mint-50">
            Supabase isn&apos;t connected yet
          </h2>
          <p className="mt-2 max-w-2xl text-[0.85rem] leading-relaxed text-mint-200/60">
            The dashboard is running in preview mode. Add your environment
            variables and run{" "}
            <code className="font-mono text-mint">supabase/migrations/0001_init.sql</code>{" "}
            to bring the catalogue and document stores online. The generators
            below still work — they just can&apos;t save yet.
          </p>
          <Link
            href="/admin/health"
            className="mt-4 inline-flex items-center gap-1.5 text-[0.85rem] text-mint transition-opacity hover:opacity-75"
          >
            Check site health
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-card border border-[color:var(--color-night-line)] bg-night-raised/45 p-6 transition-colors duration-300 hover:border-mint/40"
          >
            <div className="flex items-start justify-between">
              <Icon className="size-5 text-mint" strokeWidth={1.6} aria-hidden="true" />
              <ArrowUpRight
                className="size-4 text-mint-300/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-mint"
                aria-hidden="true"
              />
            </div>
            <p className="mt-8 font-display text-[2.2rem] font-semibold leading-none tabular-nums text-mint-50">
              {configured ? value : "—"}
            </p>
            <p className="u-eyebrow mt-3 text-mint-300/50">{label}</p>
          </Link>
        ))}
      </div>

      {/* Generators */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {[
          {
            href: "/admin/receipts",
            title: "Receipt generator",
            body: "Issue a branded payment receipt, ready to print or email.",
            Icon: FileText,
            count: receipts.draft,
          },
          {
            href: "/admin/contracts",
            title: "Contract generator",
            body: "Draft a distribution agreement from the standard clause set.",
            Icon: FileSignature,
            count: contracts.draft,
          },
          {
            href: "/admin/proposals",
            title: "Proposal generator",
            body: "Build a costed commercial proposal on the letterhead.",
            Icon: FileText,
            count: proposals.draft,
          },
        ].map(({ href, title, body, Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-card border border-[color:var(--color-night-line)] bg-night-raised/45 p-6 transition-colors duration-300 hover:border-mint/40"
          >
            <Icon className="size-5 text-mint" strokeWidth={1.6} aria-hidden="true" />
            <h3 className="mt-5 font-display text-[1.1rem] font-semibold text-mint-50">
              {title}
            </h3>
            <p className="mt-2 flex-1 text-[0.85rem] leading-relaxed text-mint-200/55">
              {body}
            </p>
            {configured && count > 0 && (
              <p className="u-eyebrow mt-5 text-mint-400">
                {count} draft{count === 1 ? "" : "s"}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Recent + messages */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Recent documents">
          {recent.length === 0 ? (
            <p className="py-8 text-center text-[0.88rem] text-mint-200/45">
              {configured
                ? "No documents generated yet."
                : "Connect Supabase to see saved documents."}
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-night-line)]">
              {recent.map((d) => (
                <li key={`${d.kind}-${d.id}`}>
                  <Link
                    href={d.href}
                    className="flex items-center justify-between gap-4 py-3.5 transition-opacity hover:opacity-75"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9rem] text-mint-50">
                        {d.title}
                      </span>
                      <span className="mt-1 block font-mono text-[0.72rem] text-mint-300/45">
                        {d.kind} · {d.ref} · {formatDate(d.created_at, "short")}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-capsule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] ${
                        STATUS_TONE[d.status] ?? STATUS_TONE.draft
                      }`}
                    >
                      {d.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Enquiries" description="Latest messages from the website form.">
          {messages.rows.length === 0 ? (
            <div className="py-8 text-center">
              <Mail
                className="mx-auto size-6 text-mint-300/35"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="mt-3 text-[0.88rem] text-mint-200/45">
                {configured ? "No enquiries yet." : "Connect Supabase to receive enquiries."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-night-line)]">
              {messages.rows.map((m) => (
                <li key={m.id} className="py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[0.9rem] text-mint-50">{m.name}</p>
                    <span className="shrink-0 font-mono text-[0.68rem] text-mint-300/40">
                      {formatDate(m.created_at, "short")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[0.78rem] text-mint-300/50">
                    {m.subject || "General enquiry"}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed text-mint-200/50">
                    {m.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
