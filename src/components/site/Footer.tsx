import Link from "next/link";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/ui/Logo";
import SeamPulse from "@/components/site/SeamPulse";
import { BRAND, CONTACT, NAV_LINKS, THERAPEUTIC_AREAS } from "@/lib/brand";

/* The footer mirrors the printed letterhead: contact block with icons on the
   left, ECG trace crossing the full width, deep-teal ground. */
export default function Footer() {
  const year = new Date().getFullYear();

  const contactRows = [
    { Icon: Phone, label: CONTACT.phonePrimary, href: `tel:${CONTACT.phonePrimary.replace(/\s/g, "")}` },
    { Icon: Phone, label: CONTACT.mobile, href: `tel:${CONTACT.mobile.replace(/\s/g, "")}` },
    { Icon: Mail, label: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { Icon: Instagram, label: CONTACT.instagram, href: CONTACT.instagramUrl },
    { Icon: MapPin, label: CONTACT.address, href: null },
  ];

  return (
    <footer className="u-band-footer relative isolate text-mint-100 u-grain u-grain-dark">
      <SeamPulse className="pointer-events-none absolute inset-x-0 -top-16 h-32 md:-top-20 md:h-40" />

      <div className="u-shell relative z-10 pb-10 pt-28 md:pt-36">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr_1fr]">
          {/* Identity */}
          <div>
            <Wordmark variant="light" width={176} />
            <p className="u-eyebrow mt-5 text-mint-400">{BRAND.tagline}</p>
            <p className="mt-7 max-w-sm text-[0.95rem] leading-relaxed text-mint-200/70">
              A Kuwait-based pharmaceutical partner delivering quality healthcare
              solutions to the private and government sectors since {BRAND.founded}.
            </p>
          </div>

          {/* Navigate */}
          <nav aria-label="Footer">
            <h2 className="u-eyebrow text-mint-400">Navigate</h2>
            <ul className="mt-6 space-y-3.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.95rem] text-mint-100/85 transition-colors duration-300 hover:text-mint"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin"
                  className="text-[0.95rem] text-mint-100/45 transition-colors duration-300 hover:text-mint"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="u-eyebrow text-mint-400">Contact</h2>
            <ul className="mt-6 space-y-4">
              {contactRows.map(({ Icon, label, href }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-[1.05rem] shrink-0 text-mint"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  {href ? (
                    <a
                      href={href}
                      {...(href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                      className="text-[0.92rem] leading-snug text-mint-100/85 transition-colors duration-300 hover:text-mint"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="text-[0.92rem] leading-snug text-mint-100/70">
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Therapeutic index — doubles as an internal-link band */}
        <div className="mt-20 border-t border-[color:var(--color-night-line)] pt-8">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {THERAPEUTIC_AREAS.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/therapeutics#${a.id}`}
                  className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-mint-300/55 transition-colors duration-300 hover:text-mint"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[color:var(--color-night-line)] pt-7 text-[0.78rem] text-mint-300/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {BRAND.legalName}. All rights reserved.
          </p>
          <p className="font-mono tracking-tight">
            {CONTACT.city}, {CONTACT.country} · {BRAND.domain}
          </p>
        </div>
      </div>
    </footer>
  );
}
