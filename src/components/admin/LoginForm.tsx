"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = Object.fromEntries(
      new FormData(e.currentTarget),
    ) as Record<string, string>;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        // Don't leak whether the address exists.
        setError("Those credentials didn't work. Please try again.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the authentication service.");
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-card border border-signal-warn/35 bg-signal-warn/8 p-6">
        <AlertTriangle
          className="size-5 text-signal-warn"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        <h2 className="mt-4 font-display text-[1.05rem] font-semibold text-mint-50">
          Supabase not configured
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-mint-200/60">
          Set <code className="font-mono text-mint">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="font-mono text-mint">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
          then run the migration in{" "}
          <code className="font-mono text-mint">supabase/migrations</code>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@dawa-na.com"
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />

      {error && (
        <p
          role="alert"
          className="rounded-tight border border-signal-bad/35 bg-signal-bad/10 px-4 py-3 text-[0.82rem] text-signal-bad"
        >
          {error}
        </p>
      )}

      <Button type="submit" variant="mint" size="lg" loading={loading} className="mt-2">
        {loading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
