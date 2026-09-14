import Link from "next/link";
import { Wordmark } from "@/components/ui/Logo";
import Backdrop from "@/components/site/Backdrop";
import { getCatalogPresence } from "@/lib/catalog";
import { navLinksFor } from "@/lib/catalog-presence";

export default async function NotFound() {
  // Don't offer a way back to /products when it would 404 too.
  const links = navLinksFor(await getCatalogPresence());

  return (
    <>
      <Backdrop />
      <main className="relative grid min-h-screen place-items-center px-6 py-24">
        <div className="w-full max-w-lg text-center">
          <Wordmark width={140} className="mx-auto" />

          <p className="u-eyebrow mt-12 text-mint-600">Error 404</p>
          <h1 className="mt-5 font-display text-title font-semibold tracking-tight text-deep">
            This page has no pulse.
          </h1>
          <p className="mt-5 text-[1rem] leading-relaxed text-ink-soft">
            The page you were looking for has moved or never existed. Here are
            the ways back.
          </p>

          <nav aria-label="Recovery" className="mt-10 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="rounded-capsule bg-deep px-6 py-3 text-sm text-mint-50 transition-colors duration-300 hover:bg-mint-950"
            >
              Back to reception
            </Link>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-capsule border border-[color:var(--color-hairline)] px-5 py-3 text-sm text-ink-soft transition-colors duration-300 hover:border-mint-500 hover:bg-mint-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </>
  );
}
