import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import ContactForm from "@/components/site/ContactForm";
import Reveal from "@/components/motion/Reveal";
import { BRAND, CONTACT, SIGNATORY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${BRAND.name} — ${CONTACT.address}. ${CONTACT.phonePrimary}.`,
};

const LINES = [
  {
    Icon: Phone,
    label: "Telephone",
    value: CONTACT.phonePrimary,
    href: `tel:${CONTACT.phonePrimary.replace(/\s/g, "")}`,
  },
  {
    Icon: Phone,
    label: "Direct",
    value: CONTACT.mobile,
    href: `tel:${CONTACT.mobile.replace(/\s/g, "")}`,
  },
  {
    Icon: Mail,
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
  {
    Icon: Instagram,
    label: "Instagram",
    value: CONTACT.instagram,
    href: CONTACT.instagramUrl,
  },
  {
    Icon: MapPin,
    label: "Office",
    value: CONTACT.address,
    href: `https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}`,
  },
  {
    Icon: Clock,
    label: "Hours",
    value: "Sunday – Thursday, 08:30 – 17:00 (AST)",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Let's talk about your route into Kuwait."
        lede="Whether you're a manufacturer seeking representation, an institution sourcing supply, or a candidate looking to join us — this reaches the right desk."
      />

      <section className="relative pb-8">
        <div className="u-shell">
          <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            {/* Form */}
            <Reveal>
              <div className="rounded-card border border-[color:var(--color-hairline)] bg-paper-pure/70 p-8 backdrop-blur-[2px] md:p-10">
                <h2 className="font-display text-[1.4rem] font-semibold tracking-tight text-deep">
                  Send us a message
                </h2>
                <p className="mt-2 text-[0.9rem] text-ink-soft">
                  Fields marked <span className="text-mint-600">*</span> are required.
                </p>
                <div className="mt-8">
                  {/* Suspense: the form reads ?product= to pre-fill a product enquiry. */}
                  <Suspense fallback={<div className="h-[30rem] animate-pulse rounded-tight bg-mint-50/60" />}>
                    <ContactForm />
                  </Suspense>
                </div>
              </div>
            </Reveal>

            {/* Direct lines */}
            <Reveal delay={0.1}>
              <div className="lg:sticky lg:top-32">
                <p className="u-eyebrow text-mint-600">Direct lines</p>

                <ul className="mt-8 space-y-6">
                  {LINES.map(({ Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-mint-50 text-mint-600"
                      >
                        <Icon className="size-[1.05rem]" strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0">
                        <span className="u-eyebrow block text-ink-faint">{label}</span>
                        {href ? (
                          <a
                            href={href}
                            {...(href.startsWith("http")
                              ? { target: "_blank", rel: "noreferrer noopener" }
                              : {})}
                            className="mt-1.5 block break-words text-[0.98rem] text-deep transition-colors duration-300 hover:text-mint-600"
                          >
                            {value}
                          </a>
                        ) : (
                          <span className="mt-1.5 block text-[0.98rem] text-deep">
                            {value}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="u-fill-deep mt-10 rounded-card p-7 text-mint-100">
                  <p className="u-eyebrow text-mint-400">Partnership enquiries</p>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-mint-200/80">
                    Distribution and registration proposals are reviewed
                    personally by {SIGNATORY.name}, {SIGNATORY.title}.
                  </p>
                  <a
                    href={`mailto:${CONTACT.emailDirector}`}
                    className="mt-5 inline-block break-all font-mono text-[0.85rem] text-mint transition-opacity duration-300 hover:opacity-75"
                  >
                    {CONTACT.emailDirector}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="relative u-band pt-16">
        <div className="u-shell">
          <Reveal>
            <div className="overflow-hidden rounded-card border border-[color:var(--color-hairline)]">
              <iframe
                title={`Map showing ${BRAND.name} at ${CONTACT.address}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT.address)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[22rem] w-full border-0 md:h-[28rem]"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
