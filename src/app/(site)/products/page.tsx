import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";
import EmptyState from "@/components/site/EmptyState";
import Reveal from "@/components/motion/Reveal";
import SplitText from "@/components/motion/SplitText";
import { notFound } from "next/navigation";
import { getCatalog, getCatalogPresence } from "@/lib/catalog";
import { hasCatalog } from "@/lib/catalog-presence";
import { THERAPEUTIC_AREAS } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse the Dawana portfolio across six therapeutic areas, supplied to hospitals, clinics and pharmacies throughout Kuwait.",
};

/* Must be dynamic. The page reads searchParams (the area and collection
   filters), which are per-request. Without this, a build with an empty
   catalogue bails out via notFound() before reaching them, so Next prerenders
   a static 404 — and the first render after a product is published would
   then try to go dynamic at runtime and throw. */
export const dynamic = "force-dynamic";

const chip = (active: boolean) =>
  cn(
    "rounded-capsule border px-4 py-2 text-[0.82rem] transition-colors duration-300",
    active
      ? "border-deep bg-deep text-mint-50"
      : "border-[color:var(--color-hairline)] text-ink-soft hover:border-mint-500 hover:bg-mint-50",
  );

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; collection?: string }>;
}) {
  /* The page doesn't exist for visitors until something is published in the
     admin. Decided on the whole catalogue, not the current filter, so an
     empty therapeutic area still shows its "nothing here yet" state. */
  if (!hasCatalog(await getCatalogPresence())) notFound();

  const { area, collection } = await searchParams;
  const { products, collections, activeCollection, configured } = await getCatalog({
    area,
    collection,
  });

  const activeArea = THERAPEUTIC_AREAS.find((a) => a.id === area);
  const filtered = Boolean(activeArea || activeCollection);

  return (
    <>
      <PageHero
        eyebrow={activeCollection ? "Collection" : "Portfolio"}
        title={activeCollection?.name ?? activeArea?.name ?? "The Dawana portfolio."}
        lede={
          activeCollection?.description ??
          activeArea?.blurb ??
          "Registered, stored and distributed under one chain of custody — from the manufacturer's line to the dispensing counter."
        }
      >
        {/* Filter chips. Plain links so the filter is deep-linkable,
            shareable and works with the back button. */}
        <nav aria-label="Filter by therapeutic area" className="flex flex-wrap gap-2">
          <Link href="/products" aria-current={!filtered ? "page" : undefined} className={chip(!filtered)}>
            All products
          </Link>
          {THERAPEUTIC_AREAS.map((a) => (
            <Link
              key={a.id}
              href={`/products?area=${a.id}`}
              aria-current={area === a.id ? "page" : undefined}
              className={chip(area === a.id)}
            >
              {a.name}
            </Link>
          ))}
        </nav>

        {collections.length > 0 && (
          <nav aria-label="Filter by collection" className="mt-3 flex flex-wrap items-center gap-2">
            <span className="u-eyebrow mr-1 text-ink-faint">Collections</span>
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/products?collection=${c.slug}`}
                aria-current={collection === c.slug ? "page" : undefined}
                className={chip(collection === c.slug)}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </PageHero>

      <section className="relative pb-8">
        <div className="u-shell">
          {products.length === 0 ? (
            <EmptyState
              configured={configured}
              title={
                activeCollection
                  ? `Nothing in ${activeCollection.name} yet`
                  : activeArea
                    ? `No products in ${activeArea.name} yet`
                    : collection
                      ? "That collection isn't available"
                      : "No products published yet"
              }
              body={
                filtered || collection
                  ? "Nothing is published here at the moment. Try another area, or get in touch for the current line card."
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
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 backdrop-blur-[2px] transition-[border-color,box-shadow] duration-500 hover:border-mint-400 hover:shadow-[0_24px_50px_-30px_rgba(3,90,81,0.45)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-mint-50 to-paper">
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
                        {THERAPEUTIC_AREAS.find((a) => a.id === p.therapeutic_area)?.name ??
                          p.collections?.[0]?.name ??
                          "Portfolio"}
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
                      </dl>

                      <span className="mt-5 inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-deep transition-colors duration-300 group-hover:text-mint-600">
                        View product details
                        <ArrowUpRight
                          className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </Reveal>
            </>
          )}

          {/* Collections */}
          {!filtered && collections.length > 0 && (
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
                    href={`/products?collection=${c.slug}`}
                    className="group flex flex-col rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-7 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint-400"
                  >
                    <h3 className="font-display text-[1.2rem] font-semibold tracking-tight text-deep">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
                        {c.description}
                      </p>
                    )}
                    <span className="mt-6 inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-deep transition-colors duration-300 group-hover:text-mint-600">
                      Browse collection
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
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
