import type { RoiSnapshot } from "./roi.ts";

/**
 * Tipi della pipeline di acquisizione lead: payload, outbox, consegna al CRM.
 */

export interface LeadFormValues {
  fullName: string;
  role: string;
  company: string;
  email: string;
  vatNumber: string;
  privacyConsent: boolean;
}

export type LeadFormField = Exclude<keyof LeadFormValues, "privacyConsent"> | "privacyConsent";

export type LeadFormErrors = Partial<Record<LeadFormField, string>>;

export interface LeadPayload {
  /** Chiave di idempotenza UUID v4, identica per tutti i tentativi di consegna. */
  idempotencyKey: string;
  submittedAt: string;
  source: "kinetix-x400-feasibility-form";
  contact: {
    fullName: string;
    role: string;
    company: string;
    email: string;
    vatNumber: string;
  };
  consent: {
    privacy: true;
    acceptedAt: string;
  };
  roi: RoiSnapshot | null;
}

export type QueueStatus =
  | "PENDING"
  | "IN_FLIGHT"
  | "QUEUED_FOR_RETRY"
  | "DELIVERED"
  | "DEAD_LETTER";

export interface QueueRecord {
  /** Coincide con la chiave di idempotenza del payload. */
  id: string;
  payload: LeadPayload;
  /** Corpo JSON serializzato, firmato e inviato al webhook. */
  body: string;
  /** Firma HMAC SHA-256 dell'ultimo tentativo (`sha256=<hex>`). */
  signature: string;
  /** Timestamp Unix (secondi) incluso nella stringa firmata. */
  signatureTimestamp: number;
  status: QueueStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  /** Epoch ms del prossimo tentativo; `null` se non pianificato. */
  nextAttemptAt: number | null;
  lastHttpStatus: number | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  deliveredAt: number | null;
  crmId: string | null;
}

export type QueueBackend = "indexeddb" | "memory";

export interface LeadQueueStore {
  readonly backend: QueueBackend;
  put(record: QueueRecord): Promise<void>;
  get(id: string): Promise<QueueRecord | undefined>;
  getAll(): Promise<QueueRecord[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface BackoffPolicy {
  /** Ritardo base in millisecondi per il primo retry. */
  baseDelayMs: number;
  /** Moltiplicatore esponenziale. */
  factor: number;
  /** Ritardo massimo in millisecondi. */
  maxDelayMs: number;
  /** Numero massimo di tentativi prima della Dead-Letter Queue. */
  maxAttempts: number;
}

export type LogLevel = "info" | "success" | "warn" | "error";

export interface ConsoleLogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface CrmWebhookSuccess {
  ok: true;
  crmId: string;
  duplicate: boolean;
  receivedAt: string;
}

export interface CrmWebhookFailure {
  ok: false;
  error: string;
  code: "CRM_UNAVAILABLE" | "INVALID_SIGNATURE" | "INVALID_PAYLOAD" | "STALE_TIMESTAMP";
}

export type CrmWebhookResponse = CrmWebhookSuccess | CrmWebhookFailure;
