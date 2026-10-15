"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ListRestart, RotateCcw } from "lucide-react";
import type { LogLevel, QueueRecord, QueueStatus } from "@/types/lead";
import { useSandbox } from "@/components/sandbox/SandboxProvider";
import { useNow } from "@/hooks/useNow";
import { DEFAULT_BACKOFF_POLICY } from "@/lib/backoff";
import { IDEMPOTENCY_HEADER, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/hmac";

const STATUS_STYLE: Record<QueueStatus, string> = {
  PENDING: "bg-panel text-muted",
  IN_FLIGHT: "bg-panel text-ink",
  QUEUED_FOR_RETRY: "bg-warn/10 text-warn",
  DELIVERED: "bg-ok/10 text-ok",
  DEAD_LETTER: "bg-bad/10 text-bad",
};

const LOG_STYLE: Record<LogLevel, string> = {
  info: "text-term-ink",
  success: "text-green-400",
  warn: "text-amber-300",
  error: "text-red-400",
};

function statusLabel(record: QueueRecord): string {
  if (record.status === "DELIVERED") return `DELIVERED (HTTP ${record.lastHttpStatus ?? 200} OK)`;
  return record.status;
}

function RecordRow({
  record,
  now,
  selected,
  onSelect,
  onRedrive,
}: {
  record: QueueRecord;
  now: number;
  selected: boolean;
  onSelect: () => void;
  onRedrive: () => void;
}) {
  const countdown =
    record.status === "QUEUED_FOR_RETRY" && record.nextAttemptAt !== null && now > 0
      ? Math.max(0, (record.nextAttemptAt - now) / 1000)
      : null;
  return (
    <li className={`px-3 py-2.5 ${selected ? "bg-panel" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="min-h-9 min-w-0 truncate text-left text-sm font-medium text-ink hover:underline"
        >
          {record.payload.contact.company} <span className="font-mono text-xs font-normal text-faint">{record.id.slice(0, 8)}</span>
        </button>
        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${STATUS_STYLE[record.status]}`}>
          {statusLabel(record)}
        </span>
      </div>
      <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-faint">
        <div className="flex gap-1">
          <dt>tentativi</dt>
          <dd className="tabular-nums text-ink">
            {record.attempts}/{record.maxAttempts}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>HTTP</dt>
          <dd className={`tabular-nums ${record.lastHttpStatus === 200 ? "text-ok" : record.lastHttpStatus ? "text-bad" : "text-ink"}`}>
            {record.lastHttpStatus ?? "—"}
            {record.lastLatencyMs !== null ? ` · ${record.lastLatencyMs} ms` : ""}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>{record.status === "DELIVERED" ? "CRM id" : "retry"}</dt>
          <dd className="tabular-nums text-ink">
            {record.status === "DELIVERED"
              ? record.crmId
              : countdown !== null
                ? `${countdown.toFixed(1)} s`
                : record.status === "IN_FLIGHT"
                  ? "in corso…"
                  : "—"}
          </dd>
        </div>
      </dl>
      {record.status === "DEAD_LETTER" ? (
        <button
          type="button"
          onClick={onRedrive}
          className="mt-2 inline-flex min-h-9 items-center gap-1 rounded border border-bad/40 px-2.5 text-xs font-medium text-bad hover:bg-bad/5"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Re-drive
        </button>
      ) : null}
    </li>
  );
}

/**
 * "Chaos & Failover Inspector": toggle di disconnessione del CRM, stato dell'outbox,
 * payload firmato salvato in IndexedDB, Dead-Letter Queue e log del worker.
 */
export function ChaosConsole() {
  const { crmDown, setCrmDown, records, logs, backend, restoreAndFlush, redrive, redriveAll, clearDelivered, resetQueue } =
    useSandbox();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hasTimers = records.some((record) => record.status === "QUEUED_FOR_RETRY");
  const now = useNow(200, hasTimers);
  const logRef = useRef<HTMLOListElement>(null);

  const selected = useMemo(
    () => records.find((record) => record.id === selectedId) ?? records[0] ?? null,
    [records, selectedId],
  );

  const counts = useMemo(() => {
    const result = { waiting: 0, delivered: 0, dead: 0 };
    for (const record of records) {
      if (record.status === "DELIVERED") result.delivered += 1;
      else if (record.status === "DEAD_LETTER") result.dead += 1;
      else result.waiting += 1;
    }
    return result;
  }, [records]);

  useEffect(() => {
    const list = logRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [logs]);

  const headersPreview = selected
    ? {
        [SIGNATURE_HEADER]: selected.signature,
        [TIMESTAMP_HEADER]: String(selected.signatureTimestamp),
        [IDEMPOTENCY_HEADER]: selected.id,
      }
    : null;

  const toolButton =
    "inline-flex min-h-9 items-center rounded px-2 text-xs text-muted transition-colors hover:bg-panel hover:text-ink disabled:pointer-events-none disabled:opacity-40";

  return (
    <div id="failover" className="flex h-full min-w-0 flex-col rounded-lg border border-line bg-paper">
      <div className="p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">Chaos &amp; Failover Inspector</h3>
          <span className="shrink-0 font-mono text-xs text-faint">
            {backend === "indexeddb" ? "IndexedDB" : backend === "memory" ? "memoria" : "…"}
          </span>
        </div>
        <p className="mt-1 text-[15px] text-muted">Spegni il CRM, invia il form e guarda la coda.</p>

        <div className={`mt-4 flex items-center justify-between gap-4 rounded-md border px-4 py-3 ${crmDown ? "border-bad/40 bg-bad/5" : "border-line"}`}>
          <div className="min-w-0">
            <p id="chaos-label" className="text-[15px] font-medium text-ink">
              Simula CRM offline
            </p>
            <p id="chaos-desc" className="text-sm text-muted">
              {crmDown ? "Il webhook risponde HTTP 503." : "HubSpot/Salesforce raggiungibile."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={crmDown}
            aria-labelledby="chaos-label"
            aria-describedby="chaos-desc"
            onClick={() => setCrmDown(!crmDown)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors before:absolute before:-inset-2 before:content-[''] ${
              crmDown ? "bg-bad" : "bg-line-strong"
            }`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${crmDown ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <button type="button" onClick={restoreAndFlush} className="btn-secondary mt-3 w-full">
          <ListRestart className="h-4 w-4" aria-hidden="true" /> Ripristina CRM e svuota la coda
        </button>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-md border border-line text-center">
          <div className="py-2">
            <dt className="text-xs text-faint">in coda</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{counts.waiting}</dd>
          </div>
          <div className="py-2">
            <dt className="text-xs text-faint">consegnati</dt>
            <dd className="text-lg font-semibold tabular-nums text-ok">{counts.delivered}</dd>
          </div>
          <div className="py-2">
            <dt className="text-xs text-faint">dead-letter</dt>
            <dd className={`text-lg font-semibold tabular-nums ${counts.dead > 0 ? "text-bad" : "text-ink"}`}>{counts.dead}</dd>
          </div>
        </dl>
      </div>

      <section aria-label="Record dell'outbox" className="border-t border-line">
        <div className="flex flex-wrap items-center justify-between gap-x-2 px-4 pt-3 sm:px-6">
          <h4 className="text-sm font-semibold text-ink">Outbox</h4>
          <div className="-mr-2 flex flex-wrap">
            <button type="button" onClick={redriveAll} disabled={counts.dead === 0} className={toolButton}>
              Re-drive DLQ
            </button>
            <button type="button" onClick={clearDelivered} disabled={counts.delivered === 0} className={toolButton}>
              Archivia consegnati
            </button>
            <button type="button" onClick={resetQueue} disabled={records.length === 0} className={`${toolButton} hover:text-bad`}>
              Svuota
            </button>
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 sm:px-6">
          {records.length === 0 ? (
            <p className="rounded-md border border-dashed border-line-strong px-4 py-5 text-center text-sm text-faint">
              Nessun lead in coda. Invia il form per iniziare.
            </p>
          ) : (
            <ul className="terminal-scroll max-h-56 divide-y divide-line overflow-y-auto rounded-md border border-line">
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  now={now}
                  selected={selected?.id === record.id}
                  onSelect={() => setSelectedId(record.id)}
                  onRedrive={() => redrive(record.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Log del worker" className="flex min-h-0 flex-1 flex-col border-t border-line px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
        <h4 className="text-sm font-semibold text-ink">Log del worker</h4>
        <ol
          ref={logRef}
          className="terminal-scroll mt-2 h-48 overflow-y-auto rounded-md bg-term p-3 font-mono text-xs leading-relaxed sm:h-56"
          aria-live="polite"
          aria-relevant="additions"
        >
          {logs.length === 0 ? <li className="text-term-muted">$ in attesa di eventi…</li> : null}
          {logs.map((entry) => (
            <li key={entry.id} className={`break-words ${LOG_STYLE[entry.level]}`}>
              <span className="text-term-muted">{entry.timestamp}</span> {entry.message}
            </li>
          ))}
        </ol>

        <details className="group mt-3 rounded-md border border-line">
          <summary className="flex min-h-11 items-center justify-between gap-3 px-3 text-sm font-medium text-ink">
            <span>
              Payload salvato{selected ? <span className="font-mono text-xs font-normal text-faint"> · {selected.id.slice(0, 8)}</span> : null}
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <pre className="terminal-scroll max-h-64 overflow-auto rounded-b-md bg-term p-3 font-mono text-[11px] leading-relaxed text-term-ink">
            {selected
              ? JSON.stringify({ status: selected.status, headers: headersPreview, body: selected.payload }, null, 2)
              : "// In attesa del primo invio del form"}
          </pre>
        </details>

        <details className="group mt-2 rounded-md border border-line">
          <summary className="flex min-h-11 items-center justify-between gap-3 px-3 text-sm font-medium text-ink">
            Politica di retry
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <p className="border-t border-line px-3 py-3 font-mono text-xs leading-relaxed text-muted">
            Backoff esponenziale {DEFAULT_BACKOFF_POLICY.baseDelayMs / 1000}s × {DEFAULT_BACKOFF_POLICY.factor}^n (max{" "}
            {DEFAULT_BACKOFF_POLICY.maxDelayMs / 1000}s) + jitter 50–100% · DLQ dopo {DEFAULT_BACKOFF_POLICY.maxAttempts} tentativi
          </p>
        </details>
      </section>
    </div>
  );
}
