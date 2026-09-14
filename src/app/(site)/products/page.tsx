import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import EmptyState from "@/components/site/EmptyState";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import { notFound } from "next/navigation";
import { getCatalog, getCatalogPresence } from "@/lib/catalog";
import { hasCatalog } from "@/lib/catalog-presence";
import { THERAPEUTIC_AREAS } from "@/lib/brand";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse the Dawana portfolio across six therapeutic areas, supplied to hospitals, clinics and pharmacies throughout Kuwait.",
};

/* Must be dynamic. The page reads searchParams (the area filter), which is
   per-request. Without this, a build with an empty catalogue bails out via
   notFound() before reaching it,
   so Next prerenders a static 404 — and the first render after a product is
   published would then try to go dynamic at runtime and throw. */
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  /* The page doesn't exist for visitors until something is published in the
     admin. Decided on the whole catalogue, not the current filter, so an
     empty therapeutic area still shows its "nothing here yet" state. */
  if (!hasCatalog(await getCatalogPresence())) notFound();

  const { area } = await searchParams;
  const { products, collections, configured } = await getCatalog(area);

  const activeArea = THERAPEUTIC_AREAS.find((a) => a.id === area);

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title={activeArea ? activeArea.name : "The Dawana portfolio."}
        lede={
          activeArea
            ? activeArea.blurb
            : "Registered, stored and distributed under one chain of custody — from the manufacturer's line to the dispensing counter."
        }
      >
        {/* Filter chips. Plain links so the filter is deep-linkable,
            shareable and works with the back button. */}
        <nav aria-label="Filter by therapeutic area" className="flex flex-wrap gap-2">
          <Link
            href="/products"
            aria-current={!area ? "page" : undefined}
            className={cn(
              "rounded-capsule border px-4 py-2 text-[0.82rem] transition-colors duration-300",
              !area
                ? "border-deep bg-deep text-mint-50"
                : "border-[color:var(--color-hairline)] text-ink-soft hover:border-mint-500 hover:bg-mint-50",
            )}
          >
            All areas
          </Link>
          {THERAPEUTIC_AREAS.map((a) => (
            <Link
              key={a.id}
              href={`/products?area=${a.id}`}
              aria-current={area === a.id ? "page" : undefined}
              className={cn(
                "rounded-capsule border px-4 py-2 text-[0.82rem] transition-colors duration-300",
                area === a.id
                  ? "border-deep bg-deep text-mint-50"
                  : "border-[color:var(--color-hairline)] text-ink-soft hover:border-mint-500 hover:bg-mint-50",
              )}
            >
              {a.name}
            </Link>
          ))}
        </nav>
      </PageHero>

      <section className="relative pb-8">
        <div className="u-shell">
          {products.length === 0 ? (
            <EmptyState
              configured={configured}
              title={activeArea ? `No products in ${activeArea.name} yet` : "No products published yet"}
              body={
                activeArea
                  ? "This therapeutic area has no published products at the moment. Try another area, or get in touch for the current line card."
                  : "Products added in the control room will appear here once published."
              }
              cta={{ href: "/contact", label: "Request the line card" }}
            />
          ) : (
            <>
              <p className="u-eyebrow mb-8 text-ink-faint">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>

              <Reveal
                stagger
                each={0.05}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {products.map((p) => (
                  <article
                    key={p.id}
                    className="group relative flex flex-col overflow-hidden rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint-400"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-mint-50">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                        />
                      ) : (
                        <Image
                          src="/brand/dawana-monogram.png"
                          alt=""
                          aria-hidden="true"
                          width={703}
                          height={799}
                          className="absolute left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 opacity-20"
                        />
                      )}

                      {p.is_featured && (
                        <span className="absolute left-3 top-3 rounded-capsule bg-deep px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-mint-50">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-mint-600">
                        {p.therapeutic_area ?? p.collection?.name ?? "Portfolio"}
                      </p>

                      <h2 className="mt-3 font-display text-[1.2rem] font-semibold leading-snug tracking-tight text-deep">
                        {p.name}
                      </h2>

                      {(p.generic_name || p.strength) && (
                        <p className="mt-1.5 text-[0.85rem] text-ink-faint">
                          {[p.generic_name, p.strength].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      {p.description && (
                        <p className="mt-3 line-clamp-3 text-[0.88rem] leading-relaxed text-ink-soft">
                          {p.description}
                        </p>
                      )}

                      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[color:var(--color-hairline)] pt-5 text-[0.78rem]">
                        {p.form && (
                          <div>
                            <dt className="text-ink-faint">Form</dt>
                            <dd className="mt-0.5 text-deep">{p.form}</dd>
                          </div>
                        )}
                        {p.pack_size && (
                          <div>
                            <dt className="text-ink-faint">Pack</dt>
                            <dd className="mt-0.5 text-deep">{p.pack_size}</dd>
                          </div>
                        )}
                        {p.manufacturer && (
                          <div className="col-span-2">
                            <dt className="text-ink-faint">Manufacturer</dt>
                            <dd className="mt-0.5 text-deep">{p.manufacturer}</dd>
                          </div>
                        )}
                      </dl>

                      {p.price != null && (
                        <p className="mt-4 font-mono text-[0.95rem] tabular-nums text-deep">
                          {formatMoney(p.price, p.currency)}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </Reveal>
            </>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <div id="collections" className="mt-24 scroll-mt-32">
              <SplitText
                as="h2"
                mode="words"
                className="font-display text-title font-semibold text-deep"
              >
                Collections
              </SplitText>

              <Reveal
                stagger
                each={0.06}
                className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?area=${c.therapeutic_area ?? ""}`}
                    className="group rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-7 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint-400"
                  >
                    <h3 className="font-display text-[1.2rem] font-semibold tracking-tight text-deep">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
                        {c.description}
                      </p>
                    )}
                  </Link>
                ))}
              </Reveal>
            </div>
          )}
        </div>
      </section>

      <CTABand />
    </>
  );
}
