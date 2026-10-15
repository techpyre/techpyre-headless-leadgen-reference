"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Eraser, ListRestart, RotateCcw, ServerCrash, Skull, Terminal, Wifi, WifiOff } from "lucide-react";
import type { LogLevel, QueueRecord, QueueStatus } from "@/types/lead";
import { useSandbox } from "@/components/sandbox/SandboxProvider";
import { useNow } from "@/hooks/useNow";
import { DEFAULT_BACKOFF_POLICY } from "@/lib/backoff";
import { IDEMPOTENCY_HEADER, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/hmac";

const STATUS_STYLE: Record<QueueStatus, string> = {
  PENDING: "border-cyan/40 bg-cyan/10 text-cyan",
  IN_FLIGHT: "border-cyan/40 bg-cyan/10 text-cyan",
  QUEUED_FOR_RETRY: "border-amber/40 bg-amber/10 text-amber",
  DELIVERED: "border-emerald/40 bg-emerald/10 text-emerald-soft",
  DEAD_LETTER: "border-danger/50 bg-danger/10 text-danger",
};

const LOG_STYLE: Record<LogLevel, string> = {
  info: "text-ink-muted",
  success: "text-emerald-soft",
  warn: "text-amber",
  error: "text-danger",
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
    <li
      className={`rounded-lg border p-3 transition-colors ${selected ? "border-cyan/60 bg-surface-raised" : "border-line bg-void/60"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="min-w-0 truncate rounded text-left font-mono text-xs text-ink hover:text-cyan"
        >
          {record.payload.contact.company} · {record.id.slice(0, 8)}
        </button>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${STATUS_STYLE[record.status]}`}>
          {statusLabel(record)}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <div>
          <dt className="text-ink-faint">tentativi</dt>
          <dd className="tabular-nums text-ink">
            {record.attempts}/{record.maxAttempts}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">ultimo HTTP</dt>
          <dd className={`tabular-nums ${record.lastHttpStatus === 200 ? "text-emerald-soft" : record.lastHttpStatus ? "text-danger" : "text-ink"}`}>
            {record.lastHttpStatus ?? "—"}
            {record.lastLatencyMs !== null ? ` · ${record.lastLatencyMs} ms` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">{record.status === "DELIVERED" ? "CRM id" : "prossimo retry"}</dt>
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
          className="mt-2 inline-flex items-center gap-1 rounded border border-danger/50 px-2 py-1 font-mono text-[11px] text-danger transition-colors hover:bg-danger/10"
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

  return (
    <div id="failover" className="flex h-full flex-col rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Terminal className="h-5 w-5 text-cyan" aria-hidden="true" /> Chaos &amp; Failover Inspector
          </h3>
          <span className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 font-mono text-[10px] text-ink-muted">
            <Database className="h-3 w-3" aria-hidden="true" /> {backend === "indexeddb" ? "IndexedDB" : backend === "memory" ? "Memoria (fallback)" : "…"}
          </span>
        </div>

        <div
          className={`mt-4 flex items-start justify-between gap-4 rounded-lg border p-3 ${
            crmDown ? "border-danger/50 bg-danger/10" : "border-line bg-void/60"
          }`}
        >
          <div className="min-w-0">
            <p id="chaos-label" className="flex items-center gap-2 text-sm font-semibold text-ink">
              {crmDown ? (
                <WifiOff className="h-4 w-4 text-danger" aria-hidden="true" />
              ) : (
                <Wifi className="h-4 w-4 text-emerald-soft" aria-hidden="true" />
              )}
              Simula Disconnessione / Crash del CRM Aziendale
            </p>
            <p id="chaos-desc" className="mt-0.5 text-xs text-ink-muted">
              HubSpot/Salesforce risponde HTTP 503: il webhook rifiuta ogni consegna finché il toggle è attivo.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={crmDown}
            aria-labelledby="chaos-label"
            aria-describedby="chaos-desc"
            onClick={() => setCrmDown(!crmDown)}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
              crmDown ? "border-danger bg-danger/80" : "border-line-strong bg-line"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-ink shadow transition-transform ${crmDown ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={restoreAndFlush}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald/60 bg-emerald/10 px-4 py-2.5 text-sm font-semibold text-emerald-soft transition-colors hover:bg-emerald/20"
        >
          <ListRestart className="h-4 w-4" aria-hidden="true" /> Ripristina Connessione CRM &amp; Esegui Flush della Coda
        </button>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
          <div className="rounded border border-line bg-void/60 py-1.5">
            <dt className="text-ink-faint">in coda</dt>
            <dd className="text-sm tabular-nums text-amber">{counts.waiting}</dd>
          </div>
          <div className="rounded border border-line bg-void/60 py-1.5">
            <dt className="text-ink-faint">consegnati</dt>
            <dd className="text-sm tabular-nums text-emerald-soft">{counts.delivered}</dd>
          </div>
          <div className="rounded border border-line bg-void/60 py-1.5">
            <dt className="text-ink-faint">dead-letter</dt>
            <dd className="text-sm tabular-nums text-danger">{counts.dead}</dd>
          </div>
        </dl>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-faint">
          Policy: backoff esponenziale {DEFAULT_BACKOFF_POLICY.baseDelayMs / 1000}s × {DEFAULT_BACKOFF_POLICY.factor}
          ^n (max {DEFAULT_BACKOFF_POLICY.maxDelayMs / 1000}s) + jitter 50–100% · DLQ dopo {DEFAULT_BACKOFF_POLICY.maxAttempts}{" "}
          tentativi
        </p>
      </div>

      <div className="grid flex-1 gap-0 lg:grid-rows-[auto_auto_1fr]">
        <section aria-label="Record dell'outbox" className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Outbox</h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={redriveAll}
                disabled={counts.dead === 0}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                <Skull className="h-3 w-3" aria-hidden="true" /> Re-drive DLQ
              </button>
              <button
                type="button"
                onClick={clearDelivered}
                disabled={counts.delivered === 0}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                <Eraser className="h-3 w-3" aria-hidden="true" /> Archivia consegnati
              </button>
              <button
                type="button"
                onClick={resetQueue}
                disabled={records.length === 0}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-muted transition-colors hover:text-danger disabled:opacity-40"
              >
                <ServerCrash className="h-3 w-3" aria-hidden="true" /> Svuota
              </button>
            </div>
          </div>
          {records.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-faint">
              Nessun lead nell&apos;outbox. Attiva il chaos e invia il form per osservare retry e Dead-Letter Queue.
            </p>
          ) : (
            <ul className="terminal-scroll mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
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
        </section>

        <section aria-label="Payload salvato in IndexedDB" className="border-b border-line p-4 sm:p-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Payload persistito {selected ? `· ${selected.id.slice(0, 8)}` : ""}
          </h4>
          <pre className="terminal-scroll mt-2 max-h-60 overflow-auto rounded-lg border border-line bg-void p-3 font-mono text-[11px] leading-relaxed text-cyan">
            {selected
              ? JSON.stringify({ status: selected.status, headers: headersPreview, body: selected.payload }, null, 2)
              : "// In attesa del primo invio del form"}
          </pre>
        </section>

        <section aria-label="Log del worker" className="flex min-h-0 flex-col p-4 sm:p-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Log del worker</h4>
          <ol
            ref={logRef}
            className="terminal-scroll mt-2 h-56 overflow-y-auto rounded-lg border border-line bg-void p-3 font-mono text-[11px] leading-relaxed"
            aria-live="polite"
            aria-relevant="additions"
          >
            {logs.length === 0 ? <li className="text-ink-faint">$ in attesa di eventi…</li> : null}
            {logs.map((entry) => (
              <li key={entry.id} className={LOG_STYLE[entry.level]}>
                <span className="text-ink-faint">{entry.timestamp}</span> {entry.message}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
