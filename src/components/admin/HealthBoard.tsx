"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  CircleSlash,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Panel } from "@/components/admin/Shell";
import { cn } from "@/lib/utils";
import type { HealthCheck, HealthReport } from "@/lib/types";

const TONE = {
  ok: {
    Icon: CheckCircle2,
    text: "text-signal-good",
    ring: "border-signal-good/35 bg-signal-good/8",
    label: "Operational",
  },
  degraded: {
    Icon: TriangleAlert,
    text: "text-signal-warn",
    ring: "border-signal-warn/35 bg-signal-warn/8",
    label: "Degraded",
  },
  down: {
    Icon: XCircle,
    text: "text-signal-bad",
    ring: "border-signal-bad/35 bg-signal-bad/8",
    label: "Down",
  },
  unconfigured: {
    Icon: CircleSlash,
    text: "text-mint-300/50",
    ring: "border-[color:var(--color-night-line)] bg-white/2",
    label: "Not configured",
  },
} as const;

export default function HealthBoard() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setReport((await res.json()) as HealthReport);
    } catch {
      setError("Could not reach the health endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll slowly — this is a status board, not a monitor.
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const overall = report ? TONE[report.overall] : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-card border px-6 py-5",
          overall ? overall.ring : "border-[color:var(--color-night-line)]",
        )}
      >
        <div className="flex items-center gap-4">
          {overall ? (
            <overall.Icon
              className={cn("size-7", overall.text)}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          ) : (
            <Activity className="size-7 animate-pulse text-mint-300/50" strokeWidth={1.6} />
          )}
          <div>
            <p className="font-display text-[1.2rem] font-semibold text-mint-50">
              {loading && !report
                ? "Checking…"
                : overall
                  ? `All systems ${overall.label.toLowerCase()}`
                  : "Unknown"}
            </p>
            {report && (
              <p className="mt-1 font-mono text-[0.74rem] text-mint-300/45">
                Checked {new Date(report.checked_at).toLocaleTimeString()} ·{" "}
                {report.meta.environment}
                {report.meta.region ? ` · ${report.meta.region}` : ""}
                {report.meta.commit ? ` · ${report.meta.commit}` : ""}
              </p>
            )}
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={load} loading={loading}
          className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Re-run checks
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-tight border border-signal-bad/35 bg-signal-bad/10 px-4 py-3 text-[0.85rem] text-signal-bad">
          {error}
        </p>
      )}

      {/* Checks */}
      <Panel title="Dependencies">
        <ul className="divide-y divide-[color:var(--color-night-line)]">
          {(report?.checks ?? []).map((check: HealthCheck) => {
            const tone = TONE[check.status];
            return (
              <li key={check.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <tone.Icon
                  className={cn("mt-0.5 size-5 shrink-0", tone.text)}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-[0.95rem] font-medium text-mint-50">{check.label}</p>
                    <span className={cn("u-eyebrow", tone.text)}>{tone.label}</span>
                    {check.latency_ms != null && (
                      <span className="font-mono text-[0.72rem] tabular-nums text-mint-300/45">
                        {check.latency_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 break-words text-[0.82rem] leading-relaxed text-mint-200/50">
                    {check.detail}
                  </p>
                </div>
              </li>
            );
          })}

          {!report && loading && (
            <li className="space-y-3 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-tight bg-white/4" />
              ))}
            </li>
          )}
        </ul>
      </Panel>

      <Panel title="Runtime" description="Values reported by the hosting environment.">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Environment", report?.meta.environment ?? "—"],
            ["Region", report?.meta.region ?? "—"],
            ["Commit", report?.meta.commit ?? "—"],
            ["Node", report?.meta.node ?? "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="u-eyebrow text-mint-300/45">{k}</dt>
              <dd className="mt-2 font-mono text-[0.85rem] text-mint-50">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
