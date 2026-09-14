import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Phone, ShieldCheck } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import Reveal from "@/components/motion/Reveal";
import PulseLine from "@/components/motion/PulseLine";
import { getProduct } from "@/lib/catalog";
import { BRAND, CONTACT, THERAPEUTIC_AREAS } from "@/lib/brand";

/* Rendered on first visit and cached; the admin's save refreshes it. */
export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getProduct((await params).slug);
  if (!found) return { title: "Product" };
  const { product } = found;
  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ??
      `${product.name} — supplied in Kuwait by ${BRAND.name}. Enquire about availability.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const found = await getProduct((await params).slug);
  if (!found) notFound();

  const { product: p, related } = found;
  const area = THERAPEUTIC_AREAS.find((a) => a.id === p.therapeutic_area);
  const enquireHref = `/contact?product=${encodeURIComponent(p.slug)}&name=${encodeURIComponent(p.name)}`;

  const specs = [
    { label: "Generic name", value: p.generic_name },
    { label: "Strength", value: p.strength },
    { label: "Dosage form", value: p.form },
    { label: "Pack size", value: p.pack_size },
    { label: "Manufacturer", value: p.manufacturer },
    { label: "Country of origin", value: p.country_of_origin },
    { label: "MOH registration", value: p.registration_no },
  ].filter((s) => s.value);

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-36 md:pt-44">
        <div className="u-shell">
          {/* Way back, then where this product sits */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link
              href={area ? `/products?area=${area.id}` : "/products"}
              className="group inline-flex items-center gap-2.5 rounded-capsule border border-[color:var(--color-hairline)] bg-paper-pure/60 py-2 pl-3 pr-4 text-[0.8rem] text-ink-soft backdrop-blur-[2px] transition-colors duration-300 hover:border-mint-400 hover:bg-mint-50 hover:text-deep"
            >
              <ArrowLeft
                className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {area ? `Back to ${area.name}` : "Back to the portfolio"}
            </Link>
            <nav aria-label="Breadcrumb" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-faint">
              <Link href="/products" className="transition-colors hover:text-deep">
                Portfolio
              </Link>
              {area && (
                <>
                  <span className="mx-2 text-mint-500">/</span>
                  <Link href={`/products?area=${area.id}`} className="transition-colors hover:text-deep">
                    {area.name}
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            {/* Media */}
            <Reveal>
              <div className="relative aspect-square overflow-hidden rounded-card border border-[color:var(--color-hairline)] bg-gradient-to-br from-mint-50 via-paper-pure to-mint-100/60">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <Image
                      src="/brand/dawana-monogram.png"
                      alt=""
                      aria-hidden="true"
                      width={703}
                      height={799}
                      className="absolute left-1/2 top-[42%] w-32 -translate-x-1/2 -translate-y-1/2 opacity-30"
                    />
                    <PulseLine
                      className="absolute inset-x-0 bottom-[18%] h-16 w-full text-mint/35"
                      beats={3}
                      strokeWidth={1.5}
                      height={100}
                      width={800}
                      duration={2.4}
                      onScroll={false}
                      delay={0.4}
                    />
                  </>
                )}
                {p.is_featured && (
                  <span className="absolute left-4 top-4 rounded-capsule bg-deep px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-mint-50">
                    Featured
                  </span>
                )}
              </div>
            </Reveal>

            {/* Details */}
            <div className="flex flex-col">
              <p className="u-eyebrow flex items-center gap-3 text-mint-600">
                <span className="a-blip inline-block size-1.5 rounded-full bg-mint" />
                {area?.name ?? "Portfolio"}
              </p>

              <SplitText
                as="h1"
                immediate
                delay={0.1}
                mode="words"
                duration={1}
                className="mt-6 font-display text-title font-semibold text-deep"
              >
                {p.name}
              </SplitText>

              {(p.generic_name || p.strength) && (
                <Reveal delay={0.12}>
                  <p className="mt-4 text-lede text-ink-soft">
                    {[p.generic_name, p.strength].filter(Boolean).join(" · ")}
                  </p>
                </Reveal>
              )}

              {p.description && (
                <Reveal delay={0.16}>
                  <p className="mt-6 whitespace-pre-line text-[1rem] leading-relaxed text-ink-soft">
                    {p.description}
                  </p>
                </Reveal>
              )}

              {p.collections && p.collections.length > 0 && (
                <Reveal delay={0.18}>
                  <div className="mt-7 flex flex-wrap items-center gap-2">
                    <span className="u-eyebrow mr-1 text-ink-faint">Collections</span>
                    {p.collections.map((c) => (
                      <Link
                        key={c.id}
                        href={`/products?collection=${c.slug}`}
                        className="rounded-capsule border border-[color:var(--color-hairline)] px-3.5 py-1.5 text-[0.8rem] text-ink-soft transition-colors duration-300 hover:border-mint-500 hover:bg-mint-50 hover:text-deep"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </Reveal>
              )}

              {specs.length > 0 && (
                <Reveal delay={0.2}>
                  <dl className="mt-9 grid overflow-hidden rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 backdrop-blur-[2px] sm:grid-cols-2">
                    {specs.map((s) => (
                      <div
                        key={s.label}
                        className="border-b border-[color:var(--color-hairline)] px-5 py-4 last:border-b-0 sm:odd:border-r sm:last:odd:col-span-2 sm:last:odd:border-r-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                      >
                        <dt className="u-eyebrow text-ink-faint">{s.label}</dt>
                        <dd className="mt-1.5 text-[0.95rem] text-deep">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              )}

              {/* Enquiry — no basket, no price: supply goes through a person */}
              <Reveal delay={0.24}>
                <div className="u-fill-deep relative mt-8 overflow-hidden rounded-card p-7 text-mint-100 md:p-8">
                  <p className="u-eyebrow flex items-center gap-2 text-mint-400">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Professional supply enquiry
                  </p>
                  <h2 className="mt-4 font-display text-[1.45rem] font-semibold leading-tight tracking-tight text-mint-50">
                    Need {p.name} for your pharmacy or institution?
                  </h2>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-mint-200/75">
                    Contact us and a medical representative will confirm availability,
                    registration status and supply terms — usually within one business day.
                  </p>

                  <ul className="mt-5 grid gap-2 text-[0.86rem] text-mint-100/85 sm:grid-cols-2">
                    {["Stock availability & lead time", "MOH registration status", "Pharmacy & clinic supply", "Hospital & tender requirements"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-3.5 shrink-0 text-mint" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href={enquireHref}
                      className="group inline-flex h-12 items-center gap-2 rounded-capsule bg-mint px-6 text-[0.9rem] font-medium text-mint-950 transition-colors duration-300 hover:bg-mint-300"
                    >
                      Contact us about this product
                      <ArrowUpRight
                        className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                    <a
                      href={`tel:${CONTACT.phonePrimary.replace(/\s/g, "")}`}
                      className="inline-flex h-12 items-center gap-2 rounded-capsule border border-mint/30 px-5 text-[0.88rem] text-mint-100 transition-colors duration-300 hover:border-mint hover:bg-mint/10"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {CONTACT.phonePrimary}
                    </a>
                  </div>
                </div>
              </Reveal>

              <p className="mt-5 text-[0.76rem] leading-relaxed text-ink-faint">
                Product information is provided for healthcare professionals and trade
                customers in Kuwait. It is not medical advice — always consult a doctor
                or pharmacist before use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="relative pb-28">
          <div className="u-shell">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[color:var(--color-hairline)] pt-14">
              <h2 className="font-display text-head font-semibold text-deep">
                More in {area?.name ?? "the portfolio"}
              </h2>
              <Link
                href={area ? `/products?area=${area.id}` : "/products"}
                className="inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-deep transition-colors hover:text-mint-600"
              >
                See all
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <Reveal stagger each={0.06} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/products/${r.slug}`}
                  className="group flex flex-col rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-6 backdrop-blur-[2px] transition-colors duration-500 hover:border-mint-400"
                >
                  <h3 className="font-display text-[1.1rem] font-semibold tracking-tight text-deep">
                    {r.name}
                  </h3>
                  {(r.generic_name || r.strength) && (
                    <p className="mt-1.5 text-[0.84rem] text-ink-faint">
                      {[r.generic_name, r.strength].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-deep transition-colors group-hover:text-mint-600">
                    View details
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
