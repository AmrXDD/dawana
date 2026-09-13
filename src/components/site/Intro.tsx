import Link from "next/link";
import SplitText from "@/components/motion/SplitText";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import PulseLine from "@/components/motion/PulseLine";
import { ABOUT, BRAND } from "@/lib/brand";

const FIGURES = [
  { value: BRAND.founded, label: "Established in Kuwait", decimals: 0, plain: true },
  { value: 25, suffix: "+", label: "Years of leadership experience" },
  { value: 6, label: "Therapeutic areas served", pad: true },
  { value: 10, suffix: "+", label: "Operating departments" },
];

export default function Intro() {
  return (
    <section id="intro" className="relative u-band">
      <div className="u-shell">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          {/* Left rail — label + trace */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="u-eyebrow text-mint-600">About Dawana</p>
            <PulseLine
              className="mt-8 h-20 w-full max-w-[16rem] text-mint/45"
              beats={2}
              strokeWidth={1.5}
              height={120}
              width={400}
              duration={2}
            />
            <Link
              href="/about"
              className="mt-8 inline-block border-b border-mint pb-1 text-sm text-deep transition-colors duration-300 hover:border-deep"
            >
              Read the full story
            </Link>
          </div>

          {/* Right — the lede carries the weight */}
          <div>
            <SplitText
              as="h2"
              mode="words"
              duration={1.05}
              className="font-display text-title font-semibold text-deep"
            >
              {ABOUT.lede}
            </SplitText>

            <Reveal delay={0.1}>
              <p className="mt-9 max-w-2xl text-lede text-ink-soft">{ABOUT.body}</p>
            </Reveal>

            <Reveal
              stagger
              each={0.08}
              className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
            >
              {FIGURES.map((f) => (
                <div key={f.label} className="border-t border-[color:var(--color-hairline)] pt-5">
                  <div className="font-display text-[2.1rem] font-semibold leading-none tracking-tight text-deep">
                    {f.plain ? (
                      <span className="tabular-nums">{f.value}</span>
                    ) : (
                      <>
                        {f.pad && (
                          <span className="text-mint-400" aria-hidden="true">
                            0
                          </span>
                        )}
                        <Counter to={f.value} suffix={f.suffix} duration={1.8} />
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-[0.82rem] leading-snug text-ink-faint">
                    {f.label}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
