"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
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
}

function Metric({ label, value, hint }: MetricProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-term-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-sm tabular-nums text-term-ink">{value}</dd>
      <dd className="mt-0.5 text-[11px] leading-snug text-term-muted/80">{hint}</dd>
    </div>
  );
}

/**
 * "TechPYRE Edge Inspector": barra di telemetria con metriche reali del browser
 * e stato della connessione Edge → CRM, legato al toggle chaos.
 * Una sola riga; i dettagli si aprono su richiesta.
 */
export function EdgeInspector() {
  const telemetry = useTelemetry();
  const { crmDown, records } = useSandbox();
  const [expanded, setExpanded] = useState(false);

  const connection: EdgeConnectionState = crmDown ? "CRM DOWN SIMULATION" : "ONLINE";
  const waiting = records.filter((r) => r.status === "PENDING" || r.status === "QUEUED_FOR_RETRY" || r.status === "IN_FLIGHT").length;
  const dead = records.filter((r) => r.status === "DEAD_LETTER").length;
  const documentSize =
    telemetry.transferBytes === 0 && telemetry.encodedBodyBytes !== null
      ? `cache · ${formatBytes(telemetry.encodedBodyBytes)}`
      : formatBytes(telemetry.transferBytes);

  return (
    <div className="bg-term text-term-ink" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex min-h-11 max-w-6xl items-center gap-3 px-4 text-xs sm:px-6">
        <a href={TECHPYRE.url} className="flex shrink-0 items-center gap-2 font-medium text-term-ink" aria-label="TechPYRE — sito ufficiale">
          <span className="grid h-5 w-5 place-items-center rounded-sm bg-term-ink text-[10px] font-bold text-term">tP</span>
          <span className="hidden sm:inline">Edge Inspector</span>
        </a>

        <p className="flex min-w-0 items-center gap-1.5" role="status" aria-live="polite">
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full animate-pulse-dot ${crmDown ? "bg-red-400" : "bg-green-400"}`} aria-hidden="true" />
          <span className="truncate font-mono">
            <span className="sr-only">Edge → CRM: </span>
            {crmDown ? <span className="text-red-300">{connection}</span> : <span>CRM {connection.toLowerCase()}</span>}
          </span>
        </p>

        <p className="hidden min-w-0 flex-1 truncate font-mono tabular-nums text-term-muted md:block">
          TTFB {formatMs(telemetry.ttfbMs)} · LCP {formatMs(telemetry.lcpMs)} · idratazione {formatMs(telemetry.hydrationMs)}
        </p>

        <p className="ml-auto shrink-0 font-mono tabular-nums text-term-muted md:ml-0">
          coda {waiting}
          {dead > 0 ? <span className="text-amber-300"> · DLQ {dead}</span> : null}
        </p>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="edge-telemetry"
          className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-term-muted hover:text-term-ink"
        >
          Dettagli
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div id="edge-telemetry" hidden={!expanded} className="border-t border-term-line">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Idratazione client" value={formatMs(telemetry.hydrationMs)} hint="Reattività immediata ai click · performance.now()" />
            <Metric label="TTFB reale" value={formatMs(telemetry.ttfbMs)} hint="Zero attesa prima risposta · NavTiming" />
            <Metric label="LCP reale" value={formatMs(telemetry.lcpMs)} hint="Contenuto visibile istantaneo · PerformanceObserver" />
            <Metric label="Documento HTML" value={documentSize} hint="Ultra-leggero su mobile · transferSize" />
            <Metric label="Stadio 1: Coda locale" value={`${waiting} in coda · ${dead} DLQ`} hint="Outbox IndexedDB su disconnessione client" />
            <Metric label="Stadio 2: Edge → CRM" value={connection} hint="Coda server-side (simulata in sandbox locale)" />
          </dl>

          <div className="mt-3.5 rounded bg-term-line/20 p-2.5 text-[11px] leading-relaxed text-term-muted">
            <span className="font-semibold text-term-ink">Nota architetturale disaccoppiamento:</span> in produzione il flusso opera a doppio stadio: <strong>Stadio 1 (Client → Edge)</strong> tramite Outbox su IndexedDB per tolleranza alla perdita di rete del dispositivo; <strong>Stadio 2 (Edge → CRM)</strong> tramite coda persistente server-side (Cloudflare Queues / Redis) con retry e DLQ asincroni indipendenti dal browser. In questa sandbox dimostrativa, entrambi gli stadi sono eseguiti nel browser per permettere l&apos;ispezione interattiva in tempo reale senza mutare code cloud.
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-term-muted">
            <span>Reference Architecture #2 — metriche misurate nel tuo browser, non simulate.</span>
            <a href={TECHPYRE.url} className="inline-flex items-center gap-1 text-term-ink hover:underline">
              techpyre.eu <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a href={TECHPYRE.repoUrl} className="inline-flex items-center gap-1 text-term-ink hover:underline">
              <GithubMark /> Codice sorgente
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
