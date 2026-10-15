"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConsoleLogEntry,
  CrmWebhookResponse,
  LeadPayload,
  LeadQueueStore,
  LogLevel,
  QueueBackend,
  QueueRecord,
} from "@/types/lead";
import { DEFAULT_BACKOFF_POLICY } from "@/lib/backoff";
import {
  CHAOS_HEADER,
  CHAOS_VALUE,
  DEMO_WEBHOOK_SECRET,
  IDEMPOTENCY_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  signWebhook,
} from "@/lib/hmac";
import {
  createLeadQueueStore,
  createQueueRecord,
  expediteRecord,
  isDue,
  markDelivered,
  markFailed,
  markInFlight,
  recoverInterrupted,
  redriveRecord,
  type SignedBody,
} from "@/lib/queue";

const WEBHOOK_URL = "/api/crm/webhook";
const WORKER_TICK_MS = 250;
const MAX_LOG_ENTRIES = 200;

export interface EnqueueResult {
  record: QueueRecord;
  /** Millisecondi tra il submit e la persistenza confermata nell'outbox. */
  confirmationMs: number;
}

export interface LeadOutbox {
  ready: boolean;
  backend: QueueBackend | null;
  records: QueueRecord[];
  logs: ConsoleLogEntry[];
  crmDown: boolean;
  setCrmDown: (down: boolean) => void;
  enqueue: (payload: LeadPayload, startedAt: number) => Promise<EnqueueResult>;
  restoreAndFlush: () => void;
  redrive: (id: string) => void;
  redriveAll: () => void;
  clearDelivered: () => void;
  resetQueue: () => void;
}

async function signBody(body: string): Promise<SignedBody> {
  const signatureTimestamp = Math.floor(Date.now() / 1000);
  const signature = await signWebhook(DEMO_WEBHOOK_SECRET, signatureTimestamp, body);
  return { body, signature, signatureTimestamp };
}

const shortId = (id: string): string => id.slice(0, 8);

/**
 * Outbox pattern lato client: ogni lead viene prima persistito (IndexedDB), poi un worker
 * a timer lo consegna al webhook CRM con retry, backoff esponenziale + jitter e DLQ.
 */
export function useLeadOutbox(): LeadOutbox {
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<QueueBackend | null>(null);
  const [records, setRecords] = useState<QueueRecord[]>([]);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [crmDown, setCrmDownState] = useState(false);

  const storeRef = useRef<LeadQueueStore | null>(null);
  const recordsRef = useRef<Map<string, QueueRecord>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const crmDownRef = useRef(false);
  const logIdRef = useRef(0);

  const log = useCallback((level: LogLevel, message: string) => {
    logIdRef.current += 1;
    const entry: ConsoleLogEntry = {
      id: logIdRef.current,
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    setLogs((previous) => {
      const next = [...previous, entry];
      return next.length > MAX_LOG_ENTRIES ? next.slice(next.length - MAX_LOG_ENTRIES) : next;
    });
  }, []);

  const publish = useCallback(() => {
    setRecords(Array.from(recordsRef.current.values()).sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const persist = useCallback(
    async (record: QueueRecord) => {
      recordsRef.current.set(record.id, record);
      publish();
      const store = storeRef.current;
      if (store) await store.put(record);
    },
    [publish],
  );

  const deliver = useCallback(
    async (record: QueueRecord) => {
      if (inFlightRef.current.has(record.id)) return;
      inFlightRef.current.add(record.id);
      try {
        // Firma rigenerata a ogni tentativo: il timestamp firmato resta fresco anche dopo molti retry.
        const signed = await signBody(record.body);
        const inFlight = markInFlight(record, signed, Date.now());
        await persist(inFlight);
        log(
          "info",
          `POST ${WEBHOOK_URL} · lead ${shortId(record.id)} · tentativo ${inFlight.attempts + 1}/${inFlight.maxAttempts} · ${SIGNATURE_HEADER}: ${signed.signature.slice(0, 19)}…`,
        );

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          [SIGNATURE_HEADER]: signed.signature,
          [TIMESTAMP_HEADER]: String(signed.signatureTimestamp),
          [IDEMPOTENCY_HEADER]: record.id,
        };
        if (crmDownRef.current) headers[CHAOS_HEADER] = CHAOS_VALUE;

        const started = performance.now();
        let httpStatus: number | null = null;
        let response: CrmWebhookResponse | null = null;
        let networkError: string | null = null;
        try {
          const res = await fetch(WEBHOOK_URL, { method: "POST", headers, body: signed.body, cache: "no-store" });
          httpStatus = res.status;
          response = (await res.json()) as CrmWebhookResponse;
        } catch (error) {
          networkError = error instanceof Error ? error.message : "Errore di rete";
        }
        const latencyMs = Math.round((performance.now() - started) * 10) / 10;

        if (httpStatus === 200 && response !== null && response.ok) {
          const delivered = markDelivered(inFlight, { httpStatus, latencyMs, crmId: response.crmId }, Date.now());
          await persist(delivered);
          log(
            "success",
            `DELIVERED (HTTP 200 OK) · lead ${shortId(record.id)} · CRM id ${response.crmId}${response.duplicate ? " · duplicato deduplicato via Idempotency-Key" : ""} · ${latencyMs} ms`,
          );
          return;
        }

        const error =
          networkError ??
          (response !== null && !response.ok ? `${response.code}: ${response.error}` : `HTTP ${httpStatus ?? "—"}`);
        const failed = markFailed(inFlight, { httpStatus, latencyMs, error }, DEFAULT_BACKOFF_POLICY, Date.now());
        await persist(failed);
        if (failed.status === "DEAD_LETTER") {
          log(
            "error",
            `HTTP ${httpStatus ?? "—"} · lead ${shortId(record.id)} spostato in DEAD_LETTER dopo ${failed.attempts} tentativi: disponibile il Re-drive`,
          );
        } else {
          const delay = (failed.nextAttemptAt ?? Date.now()) - Date.now();
          log(
            "warn",
            `HTTP ${httpStatus ?? "—"} ${error} · lead ${shortId(record.id)} → QUEUED_FOR_RETRY · prossimo tentativo tra ${(delay / 1000).toFixed(1)} s (backoff esponenziale + jitter)`,
          );
        }
      } catch (error) {
        log("error", `Errore del worker: ${error instanceof Error ? error.message : "sconosciuto"}`);
      } finally {
        inFlightRef.current.delete(record.id);
      }
    },
    [log, persist],
  );

  const processDue = useCallback(() => {
    const now = Date.now();
    for (const record of recordsRef.current.values()) {
      if (isDue(record, now) && !inFlightRef.current.has(record.id)) {
        void deliver(record);
      }
    }
  }, [deliver]);

  // Inizializzazione dell'outbox: recupera i lead persistiti in sessioni precedenti.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const store = await createLeadQueueStore();
      if (cancelled) return;
      storeRef.current = store;
      const now = Date.now();
      const stored = await store.getAll();
      for (const record of stored) {
        const recovered = recoverInterrupted(record, now);
        recordsRef.current.set(recovered.id, recovered);
        if (recovered !== record) await store.put(recovered);
      }
      publish();
      setBackend(store.backend);
      setReady(true);
      log(
        "info",
        store.backend === "indexeddb"
          ? `Outbox pronta · IndexedDB "kinetix-outbox" · ${stored.length} record recuperati dalla sessione precedente`
          : "IndexedDB non disponibile: outbox in memoria (fallback) attiva",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [log, publish]);

  // Worker di retry: controlla periodicamente i record con tentativo scaduto.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(processDue, WORKER_TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready, processDue]);

  const setCrmDown = useCallback(
    (down: boolean) => {
      crmDownRef.current = down;
      setCrmDownState(down);
      log(
        down ? "error" : "success",
        down
          ? "CHAOS ATTIVO · il CRM (HubSpot/Salesforce) risponde HTTP 503 Service Unavailable"
          : "CRM ONLINE · connessione al webhook ripristinata",
      );
    },
    [log],
  );

  const enqueue = useCallback(
    async (payload: LeadPayload, startedAt: number): Promise<EnqueueResult> => {
      const signed = await signBody(JSON.stringify(payload));
      const record = createQueueRecord(payload, signed, DEFAULT_BACKOFF_POLICY, Date.now());
      await persist(record);
      const confirmationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      log(
        "success",
        `Lead ${shortId(record.id)} persistito nell'outbox (${storeRef.current?.backend ?? "memory"}) in ${confirmationMs} ms · stato PENDING · Idempotency-Key ${record.id}`,
      );
      // Consegna immediata (outbox pattern): il worker parte senza attendere il tick successivo.
      queueMicrotask(processDue);
      return { record, confirmationMs };
    },
    [log, persist, processDue],
  );

  const restoreAndFlush = useCallback(() => {
    crmDownRef.current = false;
    setCrmDownState(false);
    const now = Date.now();
    const waiting = Array.from(recordsRef.current.values()).filter(
      (record) => record.status === "QUEUED_FOR_RETRY" || record.status === "PENDING",
    );
    log("success", `CRM ONLINE · flush della coda: ${waiting.length} lead in attesa di consegna`);
    void Promise.all(waiting.map((record) => persist(expediteRecord(record, now)))).then(processDue);
  }, [log, persist, processDue]);

  const redrive = useCallback(
    (id: string) => {
      const record = recordsRef.current.get(id);
      if (!record || record.status !== "DEAD_LETTER") return;
      log("info", `Re-drive dalla Dead-Letter Queue · lead ${shortId(id)} rimesso in coda con tentativi azzerati`);
      void persist(redriveRecord(record, DEFAULT_BACKOFF_POLICY, Date.now())).then(processDue);
    },
    [log, persist, processDue],
  );

  const redriveAll = useCallback(() => {
    const now = Date.now();
    const dead = Array.from(recordsRef.current.values()).filter((record) => record.status === "DEAD_LETTER");
    if (dead.length === 0) return;
    log("info", `Re-drive di ${dead.length} lead dalla Dead-Letter Queue`);
    void Promise.all(dead.map((record) => persist(redriveRecord(record, DEFAULT_BACKOFF_POLICY, now)))).then(
      processDue,
    );
  }, [log, persist, processDue]);

  const clearDelivered = useCallback(() => {
    const delivered = Array.from(recordsRef.current.values()).filter((record) => record.status === "DELIVERED");
    for (const record of delivered) {
      recordsRef.current.delete(record.id);
      void storeRef.current?.delete(record.id);
    }
    publish();
    log("info", `Archiviati ${delivered.length} lead consegnati dall'outbox locale`);
  }, [log, publish]);

  const resetQueue = useCallback(() => {
    recordsRef.current.clear();
    void storeRef.current?.clear();
    publish();
    log("warn", "Outbox svuotata: tutti i record locali sono stati eliminati");
  }, [log, publish]);

  return {
    ready,
    backend,
    records,
    logs,
    crmDown,
    setCrmDown,
    enqueue,
    restoreAndFlush,
    redrive,
    redriveAll,
    clearDelivered,
    resetQueue,
  };
}
