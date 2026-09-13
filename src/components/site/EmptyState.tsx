import Link from "next/link";
import { Database, Inbox } from "lucide-react";

/**
 * Honest empty state.
 *
 * Distinguishes "the backend isn't connected yet" from "connected, but this
 * filter has no rows" — conflating the two is how a broken deployment ends
 * up looking like an empty catalogue.
 */
export default function EmptyState({
  configured,
  title,
  body,
  cta,
}: {
  configured: boolean;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  const Icon = configured ? Inbox : Database;

  return (
    <div className="rounded-card border border-dashed border-[color:var(--color-hairline)] bg-paper-pure/50 px-8 py-16 text-center backdrop-blur-[2px]">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-full bg-mint-50 text-mint-600"
      >
        <Icon className="size-5" strokeWidth={1.6} />
      </span>

      <h3 className="mt-6 font-display text-[1.25rem] font-semibold tracking-tight text-deep">
        {configured ? title : "Catalogue not connected"}
      </h3>

      <p className="mx-auto mt-3 max-w-md text-[0.92rem] leading-relaxed text-ink-soft">
        {configured
          ? body
          : "Add your Supabase environment variables and run the migration in supabase/migrations to publish products here."}
      </p>

      {cta && configured && (
        <Link
          href={cta.href}
          className="mt-7 inline-block rounded-capsule bg-deep px-6 py-3 text-sm text-mint-50 transition-colors duration-300 hover:bg-mint-950"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
