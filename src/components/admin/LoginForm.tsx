"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { Field, Input, TextField } from "@/components/ui/Field";
import { signIn } from "@/lib/actions/auth";

/** Only ever return somewhere inside the control room. */
function safeNext(value: string | null) {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export default function LoginForm({ configured }: { configured: boolean }) {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const result = await signIn({
        username: String(data.get("username") ?? ""),
        password: String(data.get("password") ?? ""),
      });

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // A full navigation, so the new session cookie is sent with every
      // request from here on and no stale signed-out render is reused.
      window.location.assign(next);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
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
          Sign-in isn&apos;t set up yet
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-mint-200/60">
          Add <code className="font-mono text-mint">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="font-mono text-mint">SUPABASE_SERVICE_ROLE_KEY</code> and{" "}
          <code className="font-mono text-mint">ADMIN_SESSION_SECRET</code>, run the
          database SQL, then redeploy.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        autoFocus
        placeholder="Your username"
      />

      <Field label="Password" required>
        {(id, describedBy) => (
          <div className="relative">
            <Input
              id={id}
              aria-describedby={describedBy}
              name="password"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>

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
