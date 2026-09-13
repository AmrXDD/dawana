import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isResendConfigured } from "@/lib/resend";
import type { HealthCheck, HealthReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function timed<T>(fn: () => Promise<T>) {
  const started = performance.now();
  try {
    const value = await fn();
    return { value, ms: Math.round(performance.now() - started), error: null as string | null };
  } catch (e) {
    return {
      value: null,
      ms: Math.round(performance.now() - started),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Live health probe backing the Site Health dashboard.
 *
 * Each dependency is probed with a real query rather than an env-var check,
 * because "the key is present" and "the service answers" are different
 * failures and only the second one takes the site down.
 */
export async function GET() {
  const checks: HealthCheck[] = [];

  // --- Database ---
  if (!isSupabaseConfigured()) {
    checks.push({
      id: "database",
      label: "Supabase database",
      status: "unconfigured",
      latency_ms: null,
      detail: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not set.",
    });
  } else {
    const probe = await timed(async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return true;
    });

    checks.push({
      id: "database",
      label: "Supabase database",
      status: probe.error ? "down" : probe.ms > 1200 ? "degraded" : "ok",
      latency_ms: probe.ms,
      detail: probe.error ?? `Responded in ${probe.ms}ms.`,
    });
  }

  // --- Auth ---
  if (!isSupabaseConfigured()) {
    checks.push({
      id: "auth",
      label: "Authentication",
      status: "unconfigured",
      latency_ms: null,
      detail: "Supabase Auth is unavailable without project credentials.",
    });
  } else {
    const probe = await timed(async () => {
      const supabase = await createClient();
      const { error } = await supabase.auth.getUser();
      // A missing session is a valid answer; only transport errors count.
      if (error && error.status && error.status >= 500) throw new Error(error.message);
      return true;
    });

    checks.push({
      id: "auth",
      label: "Authentication",
      status: probe.error ? "down" : "ok",
      latency_ms: probe.ms,
      detail: probe.error ?? `Session endpoint healthy (${probe.ms}ms).`,
    });
  }

  // --- Storage ---
  if (!isSupabaseConfigured()) {
    checks.push({
      id: "storage",
      label: "Media storage",
      status: "unconfigured",
      latency_ms: null,
      detail: "Storage buckets require Supabase credentials.",
    });
  } else {
    const probe = await timed(async () => {
      const supabase = await createClient();
      const { error } = await supabase.storage.from("product-images").list("", { limit: 1 });
      if (error) throw new Error(error.message);
      return true;
    });

    checks.push({
      id: "storage",
      label: "Media storage",
      status: probe.error ? "degraded" : "ok",
      latency_ms: probe.ms,
      detail: probe.error ?? `Bucket reachable (${probe.ms}ms).`,
    });
  }

  // --- Transactional email ---
  checks.push({
    id: "email",
    label: "Transactional email",
    status: isResendConfigured() ? "ok" : "unconfigured",
    latency_ms: null,
    detail: isResendConfigured()
      ? `Resend configured. Sending as ${process.env.RESEND_FROM_EMAIL}.`
      : "RESEND_API_KEY / RESEND_FROM_EMAIL are not set. Contact form falls back to database only.",
  });

  // --- Runtime ---
  checks.push({
    id: "runtime",
    label: "Application runtime",
    status: "ok",
    latency_ms: null,
    detail: `Next.js on Node ${process.version}, ${process.env.VERCEL_ENV ?? "local"} environment.`,
  });

  const hasDown = checks.some((c) => c.status === "down");
  const hasDegraded = checks.some((c) => c.status === "degraded");

  const report: HealthReport = {
    checked_at: new Date().toISOString(),
    overall: hasDown ? "down" : hasDegraded ? "degraded" : "ok",
    checks,
    meta: {
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      region: process.env.VERCEL_REGION ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      node: process.version,
    },
  };

  return NextResponse.json(report, {
    status: report.overall === "down" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
