import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/ui/Logo";
import { PulseTicker } from "@/components/motion/PulseLine";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { getCurrentAdmin, isAdminAuthConfigured } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in with a live account? Straight through.
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <main className="relative grid min-h-screen bg-night text-mint-50 lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Wordmark variant="light" width={132} />
          <p className="u-eyebrow mt-4 text-mint-400/70">Control room</p>

          <h1 className="mt-10 font-display text-[1.8rem] font-semibold tracking-tight text-mint-50">
            Sign in
          </h1>
          <p className="mt-2.5 text-[0.9rem] leading-relaxed text-mint-200/55">
            Use the username and password your {BRAND.name} administrator gave you.
          </p>

          <div className="mt-8">
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-card bg-night-raised/50" />}
            >
              <LoginForm configured={isAdminAuthConfigured()} />
            </Suspense>
          </div>

          <p className="mt-10 text-[0.76rem] leading-relaxed text-mint-300/40">
            Forgotten your password? An administrator can reset it from Team access.
          </p>
        </div>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-[color:var(--color-night-line)] lg:block">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-[34rem] rounded-full bg-mint/10 blur-3xl"
        />
        <PulseTicker
          className="absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 text-mint"
          opacity={0.2}
          speed={30}
        />

        <div className="relative z-10 flex h-full flex-col justify-end p-14">
          <blockquote className="max-w-md font-display text-[1.9rem] font-semibold leading-tight tracking-tight text-mint-50">
            Quality as the best after-sales service.
          </blockquote>
          <p className="u-eyebrow mt-5 text-mint-400">
            {BRAND.name} — value 05
          </p>
        </div>
      </aside>
    </main>
  );
}
