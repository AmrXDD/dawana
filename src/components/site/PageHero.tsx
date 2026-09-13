import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import PulseLine from "@/components/motion/PulseLine";
import Reveal from "@/components/motion/Reveal";

/**
 * Shared masthead for inner pages. Keeps the eyebrow → headline → lede →
 * trace rhythm identical everywhere, so the site reads as one system.
 */
export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-14 pt-40 md:pb-20 md:pt-48">
      <div className="u-shell">
        {/* Home, in the register of the rest of the site — a healthcare
            company's front door is its reception, not a "homepage". */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2.5 rounded-capsule border border-[color:var(--color-hairline)] bg-paper-pure/60 py-2 pl-3 pr-4 text-[0.8rem] text-ink-soft backdrop-blur-[2px] transition-colors duration-300 hover:border-mint-400 hover:bg-mint-50 hover:text-deep"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to reception
        </Link>

        <p className="u-eyebrow flex items-center gap-3 text-mint-600">
          <span className="a-blip inline-block size-1.5 rounded-full bg-mint" />
          {eyebrow}
        </p>

        <SplitText
          as="h1"
          immediate
          delay={0.12}
          mode="words"
          duration={1.05}
          className="mt-7 max-w-4xl font-display text-title font-semibold text-deep"
        >
          {title}
        </SplitText>

        {lede && (
          <Reveal delay={0.14}>
            <p className="mt-8 max-w-2xl text-lede text-ink-soft">{lede}</p>
          </Reveal>
        )}

        {children && <div className="mt-10">{children}</div>}

        <PulseLine
          className="mt-14 h-14 w-full text-mint/40"
          beats={5}
          strokeWidth={1.5}
          height={100}
          width={1400}
          duration={2.6}
          onScroll={false}
          delay={0.5}
        />
      </div>
    </section>
  );
}
