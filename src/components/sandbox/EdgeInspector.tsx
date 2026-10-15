"use client";

import { useState } from "react";
import { Activity, ChevronDown, ExternalLink, Radio, ServerCrash } from "lucide-react";
import { useSandbox } from "@/components/sandbox/SandboxProvider";
import { useTelemetry } from "@/hooks/useTelemetry";
import { formatBytes, formatMs } from "@/lib/format";
import { TECHPYRE } from "@/data/kinetix";
import type { EdgeConnectionState } from "@/types/telemetry";
import { GithubMark } from "@/components/ui/GithubMark";

interface MetricProps {
  label: string;
  value: string;
  hint: string;
  tone?: "cyan" | "emerald" | "amber";
}

function Metric({ label, value, hint, tone = "cyan" }: MetricProps) {
  const toneClass = tone === "emerald" ? "text-emerald-soft" : tone === "amber" ? "text-amber" : "text-cyan";
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-2" title={hint}>
      <dt className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className={`mt-0.5 truncate font-mono text-sm tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}

/**
 * "TechPYRE Edge Inspector": barra di telemetria con metriche reali del browser
 * e stato della connessione Edge → CRM, legato al toggle chaos.
 */
export function EdgeInspector() {
  const telemetry = useTelemetry();
  const { crmDown, records } = useSandbox();
  const [expanded, setExpanded] = useState(false);

  const connection: EdgeConnectionState = crmDown ? "CRM DOWN SIMULATION" : "ONLINE";
  const waiting = records.filter((r) => r.status === "PENDING" || r.status === "QUEUED_FOR_RETRY" || r.status === "IN_FLIGHT").length;
  const dead = records.filter((r) => r.status === "DEAD_LETTER").length;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/95 backdrop-blur supports-[backdrop-filter]:bg-void/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <a
          href={TECHPYRE.url}
          className="flex shrink-0 items-center gap-2 rounded font-mono text-xs font-semibold tracking-tight text-ink"
          aria-label="TechPYRE — sito ufficiale"
        >
          <span className="grid h-6 w-6 place-items-center rounded bg-ink text-[11px] font-bold text-void">tP</span>
          <span className="hidden sm:inline">TechPYRE Edge Inspector</span>
        </a>
        <p className="min-w-0 flex-1 truncate rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-[11px] font-medium text-emerald-soft">
          <span className="hidden md:inline">TechPYRE Reference Architecture #2 — High-Conversion &amp; Failover Sandbox</span>
          <span className="md:hidden">Reference Architecture #2 — Failover Sandbox</span>
        </p>
        <nav aria-label="Collegamenti esterni" className="flex shrink-0 items-center gap-1">
          <a
            href={TECHPYRE.url}
            className="hidden items-center gap-1 rounded px-2 py-1 text-xs text-ink-muted hover:text-ink sm:inline-flex"
          >
            techpyre.eu <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <a
            href={TECHPYRE.repoUrl}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-ink-muted hover:text-ink"
            aria-label="Codice sorgente su GitHub"
          >
            <GithubMark />
            <span className="hidden lg:inline">GitHub</span>
          </a>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls="edge-telemetry"
            className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-ink-muted hover:text-ink md:hidden"
          >
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{expanded ? "Nascondi" : "Mostra"} telemetria</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </nav>
      </div>

      <div
        id="edge-telemetry"
        className={`mx-auto max-w-7xl px-4 pb-2 sm:px-6 ${expanded ? "block" : "hidden"} md:block`}
      >
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          <Metric
            label="Idratazione client"
            value={formatMs(telemetry.hydrationMs)}
            hint="performance.now() al mount dei Client Components"
          />
          <Metric
            label="TTFB reale"
            value={formatMs(telemetry.ttfbMs)}
            hint="PerformanceNavigationTiming: responseStart − startTime"
          />
          <Metric
            label="LCP reale"
            value={formatMs(telemetry.lcpMs)}
            hint="PerformanceObserver('largest-contentful-paint')"
          />
          <Metric
            label="Documento HTML"
            value={
              telemetry.transferBytes === 0 && telemetry.encodedBodyBytes !== null
                ? `cache · ${formatBytes(telemetry.encodedBodyBytes)}`
                : formatBytes(telemetry.transferBytes)
            }
            hint="transferSize (encodedBodySize se servito da cache locale)"
          />
          <Metric
            label="Outbox locale"
            value={`${waiting} in coda · ${dead} DLQ`}
            hint="Record nell'outbox IndexedDB"
            tone={dead > 0 ? "amber" : "emerald"}
          />
          <div
            className={`min-w-0 rounded-md border px-3 py-2 ${
              crmDown ? "border-danger/50 bg-danger/10" : "border-emerald/40 bg-emerald/10"
            }`}
          >
            <dt className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">Edge → CRM</dt>
            <dd
              className={`mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-xs font-semibold ${crmDown ? "text-danger" : "text-emerald-soft"}`}
              role="status"
              aria-live="polite"
            >
              {crmDown ? (
                <ServerCrash className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full animate-pulse-dot ${crmDown ? "bg-danger" : "bg-emerald"}`} />
              <span className="truncate">{connection}</span>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
