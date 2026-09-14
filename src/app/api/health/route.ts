import { NextResponse } from "next/server";
import { createAdminClient, createPublicClient, isAdminDataConfigured, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { can } from "@/lib/auth/roles";
import { sessionSecret } from "@/lib/auth/session";
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
 * failures and only the second one takes the site down. Admin-only: the
 * report names the runtime, region and commit.
 */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || !can(admin.role, "health")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  const checks: HealthCheck[] = [];

  // --- Public catalogue (anon key + RLS) ---
  if (!isSupabaseConfigured()) {
    checks.push({
      id: "database",
      label: "Public catalogue",
      status: "unconfigured",
      latency_ms: null,
      detail: "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.",
    });
  } else {
    const probe = await timed(async () => {
      const { error } = await createPublicClient()
        .from("products")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return true;
    });

    checks.push({
      id: "database",
      label: "Public catalogue",
      status: probe.error ? "down" : probe.ms > 1200 ? "degraded" : "ok",
      latency_ms: probe.ms,
      detail: probe.error ?? `Supabase answered the public key in ${probe.ms}ms.`,
    });
  }

  // --- Control-room data (service role) ---
  if (!isAdminDataConfigured()) {
    checks.push({
      id: "admin-data",
      label: "Control-room database",
      status: "unconfigured",
      latency_ms: null,
      detail: "SUPABASE_SERVICE_ROLE_KEY is not set, so the admin can't save anything.",
    });
  } else {
    const probe = await timed(async () => {
      const { error } = await createAdminClient()
        .from("receipts")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return true;
    });

    checks.push({
      id: "admin-data",
      label: "Control-room database",
      status: probe.error ? "down" : probe.ms > 1200 ? "degraded" : "ok",
      latency_ms: probe.ms,
      detail: probe.error ?? `Service key accepted in ${probe.ms}ms.`,
    });
  }

  // --- Sign-in ---
  if (!sessionSecret() || !isAdminDataConfigured()) {
    checks.push({
      id: "auth",
      label: "Admin sign-in",
      status: "unconfigured",
      latency_ms: null,
      detail: "ADMIN_SESSION_SECRET must be set (32+ characters) alongside the service key.",
    });
  } else {
    const probe = await timed(async () => {
      const { count, error } = await createAdminClient()
        .from("admin_accounts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw new Error(error.message);
      return count ?? 0;
    });

    checks.push({
      id: "auth",
      label: "Admin sign-in",
      status: probe.error ? "down" : "ok",
      latency_ms: probe.ms,
      detail:
        probe.error ??
        `${probe.value} active account${probe.value === 1 ? "" : "s"} can sign in.`,
    });
  }

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
