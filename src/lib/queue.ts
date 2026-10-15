import type { BackoffPolicy, LeadPayload, LeadQueueStore, QueueRecord } from "../types/lead.ts";
import { computeBackoffDelay, shouldDeadLetter } from "./backoff.ts";

/**
 * Outbox persistente dei lead.
 *
 * - `createLeadQueueStore()` restituisce un wrapper tipizzato sull'API IndexedDB nativa
 *   (database `kinetix-outbox`, object store `leads`, chiave = idempotency key),
 *   con fallback in memoria se IndexedDB non è disponibile (SSR, navigazione privata
 *   restrittiva, quota esaurita).
 * - Le funzioni `create*` / `mark*` / `redrive*` sono transizioni di stato pure e immutabili.
 */

const DB_NAME = "kinetix-outbox";
const DB_VERSION = 1;
const STORE_NAME = "leads";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Richiesta IndexedDB fallita."));
  });
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("nextAttemptAt", "nextAttemptAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Apertura IndexedDB fallita."));
    request.onblocked = () => reject(new Error("Apertura IndexedDB bloccata da un'altra scheda."));
  });
}

class IndexedDbLeadQueueStore implements LeadQueueStore {
  readonly backend = "indexeddb" as const;
  private readonly db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  private async run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const transaction = this.db.transaction(STORE_NAME, mode);
    // La conferma all'utente avviene solo a commit avvenuto: durabilità prima della risposta.
    const committed = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Transazione IndexedDB fallita."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Transazione IndexedDB annullata."));
    });
    const [result] = await Promise.all([
      requestToPromise(operation(transaction.objectStore(STORE_NAME))),
      committed,
    ]);
    return result;
  }

  async put(record: QueueRecord): Promise<void> {
    await this.run("readwrite", (store) => store.put(record));
  }

  async get(id: string): Promise<QueueRecord | undefined> {
    return this.run<QueueRecord | undefined>("readonly", (store) => store.get(id));
  }

  async getAll(): Promise<QueueRecord[]> {
    const records = await this.run<QueueRecord[]>("readonly", (store) => store.getAll());
    return records.sort((a, b) => a.createdAt - b.createdAt);
  }

  async delete(id: string): Promise<void> {
    await this.run("readwrite", (store) => store.delete(id));
  }

  async clear(): Promise<void> {
    await this.run("readwrite", (store) => store.clear());
  }
}

export class MemoryLeadQueueStore implements LeadQueueStore {
  readonly backend = "memory" as const;
  private readonly records = new Map<string, QueueRecord>();

  async put(record: QueueRecord): Promise<void> {
    this.records.set(record.id, structuredClone(record));
  }

  async get(id: string): Promise<QueueRecord | undefined> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : undefined;
  }

  async getAll(): Promise<QueueRecord[]> {
    return Array.from(this.records.values(), (record) => structuredClone(record)).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

export async function createLeadQueueStore(): Promise<LeadQueueStore> {
  if (typeof indexedDB === "undefined") {
    return new MemoryLeadQueueStore();
  }
  try {
    const db = await openDatabase(indexedDB);
    return new IndexedDbLeadQueueStore(db);
  } catch {
    return new MemoryLeadQueueStore();
  }
}

/* ------------------------------------------------------------------ */
/* Transizioni di stato pure                                          */
/* ------------------------------------------------------------------ */

export interface SignedBody {
  body: string;
  signature: string;
  signatureTimestamp: number;
}

export function createQueueRecord(
  payload: LeadPayload,
  signed: SignedBody,
  policy: BackoffPolicy,
  now: number,
): QueueRecord {
  return {
    id: payload.idempotencyKey,
    payload,
    body: signed.body,
    signature: signed.signature,
    signatureTimestamp: signed.signatureTimestamp,
    status: "PENDING",
    attempts: 0,
    maxAttempts: policy.maxAttempts,
    createdAt: now,
    updatedAt: now,
    nextAttemptAt: now,
    lastHttpStatus: null,
    lastError: null,
    lastLatencyMs: null,
    deliveredAt: null,
    crmId: null,
  };
}

export function markInFlight(record: QueueRecord, signed: SignedBody, now: number): QueueRecord {
  return {
    ...record,
    ...signed,
    status: "IN_FLIGHT",
    updatedAt: now,
    nextAttemptAt: null,
  };
}

export function markDelivered(
  record: QueueRecord,
  outcome: { httpStatus: number; latencyMs: number; crmId: string },
  now: number,
): QueueRecord {
  return {
    ...record,
    status: "DELIVERED",
    attempts: record.attempts + 1,
    updatedAt: now,
    nextAttemptAt: null,
    lastHttpStatus: outcome.httpStatus,
    lastError: null,
    lastLatencyMs: outcome.latencyMs,
    deliveredAt: now,
    crmId: outcome.crmId,
  };
}

export function markFailed(
  record: QueueRecord,
  outcome: { httpStatus: number | null; latencyMs: number | null; error: string },
  policy: BackoffPolicy,
  now: number,
  random: () => number = Math.random,
): QueueRecord {
  const attempts = record.attempts + 1;
  const deadLetter = shouldDeadLetter(attempts, { ...policy, maxAttempts: record.maxAttempts });
  return {
    ...record,
    status: deadLetter ? "DEAD_LETTER" : "QUEUED_FOR_RETRY",
    attempts,
    updatedAt: now,
    nextAttemptAt: deadLetter ? null : now + computeBackoffDelay(attempts, policy, random),
    lastHttpStatus: outcome.httpStatus,
    lastError: outcome.error,
    lastLatencyMs: outcome.latencyMs,
  };
}

/** Re-drive dalla DLQ: azzera i tentativi e ripianifica subito la consegna. */
export function redriveRecord(record: QueueRecord, policy: BackoffPolicy, now: number): QueueRecord {
  return {
    ...record,
    status: "PENDING",
    attempts: 0,
    maxAttempts: policy.maxAttempts,
    updatedAt: now,
    nextAttemptAt: now,
    lastError: null,
  };
}

/** Anticipa a `now` il prossimo tentativo (flush della coda). */
export function expediteRecord(record: QueueRecord, now: number): QueueRecord {
  return { ...record, nextAttemptAt: now, updatedAt: now };
}

/** Un record IN_FLIGHT rimasto tale (scheda chiusa durante l'invio) torna in coda al riavvio. */
export function recoverInterrupted(record: QueueRecord, now: number): QueueRecord {
  return record.status === "IN_FLIGHT" ? { ...record, status: "QUEUED_FOR_RETRY", nextAttemptAt: now, updatedAt: now } : record;
}

export function isDue(record: QueueRecord, now: number): boolean {
  return (
    (record.status === "PENDING" || record.status === "QUEUED_FOR_RETRY") &&
    record.nextAttemptAt !== null &&
    record.nextAttemptAt <= now
  );
}
