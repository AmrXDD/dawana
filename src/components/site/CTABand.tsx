import { Mail, Phone } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import Reveal from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import { ButtonLink } from "@/components/ui/Button";
import { CONTACT } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * @param enter  What sits directly above this band.  (the skyline
 *               plate) needs the ramp to start at night, otherwise the bone
 *               backdrop flashes through the transparent top edge.
 */
export default function CTABand({ enter = "light" }: { enter?: "light" | "dark" }) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden text-mint-50 u-grain u-grain-dark",
        enter === "dark" ? "u-band-descend-dark" : "u-band-descend",
      )}
    >
      {/* Corner bloom */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-[28rem] rounded-full bg-mint/14 blur-3xl"
      />

      <div className="u-shell relative z-10 u-band">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="u-eyebrow text-mint-400">Partner with Dawana</p>
            <SplitText
              as="h2"
              mode="words"
              className="mt-6 max-w-2xl font-display text-title font-semibold text-mint-50"
            >
              Bring your brand to Kuwait with a partner that knows the ground.
            </SplitText>

            <Reveal delay={0.1}>
              <p className="mt-7 max-w-xl text-lede text-mint-200/70">
                Registration, tendering, distribution and field promotion —
                handled by one team, under one standard.
              </p>
            </Reveal>

            <Reveal delay={0.16} className="mt-10 flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink href="/contact" size="lg" variant="mint" arrow>
                  Start a conversation
                </ButtonLink>
              </Magnetic>
              <ButtonLink
                href="/products"
                size="lg"
                variant="ghost"
                className="text-mint-100 hover:bg-white/8"
              >
                Browse the portfolio
              </ButtonLink>
            </Reveal>
          </div>

          {/* Direct lines */}
          <Reveal stagger each={0.08} className="flex flex-col gap-5">
            <a
              href={`tel:${CONTACT.phonePrimary.replace(/\s/g, "")}`}
              className="group flex items-center gap-4 border-b border-[color:var(--color-night-line)] pb-5 transition-colors duration-300 hover:border-mint"
            >
              <Phone className="size-5 text-mint" strokeWidth={1.6} aria-hidden="true" />
              <span>
                <span className="u-eyebrow block text-mint-400">Call</span>
                <span className="mt-1.5 block font-mono text-[1.05rem] tracking-tight text-mint-50">
                  {CONTACT.phonePrimary}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${CONTACT.email}`}
              className="group flex items-center gap-4 border-b border-[color:var(--color-night-line)] pb-5 transition-colors duration-300 hover:border-mint"
            >
              <Mail className="size-5 text-mint" strokeWidth={1.6} aria-hidden="true" />
              <span>
                <span className="u-eyebrow block text-mint-400">Email</span>
                <span className="mt-1.5 block break-all font-mono text-[1.05rem] tracking-tight text-mint-50">
                  {CONTACT.email}
                </span>
              </span>
            </a>

            <p className="text-[0.85rem] leading-relaxed text-mint-300/55">
              {CONTACT.address}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
