import type { CrmWebhookFailure, CrmWebhookSuccess } from "@/types/lead";
import {
  CHAOS_HEADER,
  CHAOS_VALUE,
  DEMO_WEBHOOK_SECRET,
  IDEMPOTENCY_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  isTimestampFresh,
  verifyWebhookSignature,
} from "@/lib/hmac";
import { isLeadPayload } from "@/lib/validation";

/**
 * Simulatore del webhook CRM (HubSpot / Salesforce).
 *
 * 1. Chaos: se la richiesta porta `X-Kinetix-Chaos: crm-down` risponde 503, come un CRM in manutenzione.
 * 2. Verifica la firma HMAC SHA-256 su `${timestamp}.${body}` e la freschezza del timestamp.
 * 3. Valida il payload e la coerenza con l'header `Idempotency-Key`.
 * 4. Deduplica per chiave di idempotenza: un retry di un lead già acquisito restituisce lo stesso id CRM.
 *
 * Lo store di deduplica è in memoria per istanza: in produzione si usa uno store condiviso
 * (Redis/Upstash, tabella con vincolo di unicità) con TTL.
 */

interface StoredLead {
  crmId: string;
  receivedAt: string;
}

const MAX_STORED_KEYS = 5_000;
const processedLeads = new Map<string, StoredLead>();

function remember(key: string, lead: StoredLead): void {
  if (processedLeads.size >= MAX_STORED_KEYS) {
    const oldest = processedLeads.keys().next().value;
    if (oldest !== undefined) processedLeads.delete(oldest);
  }
  processedLeads.set(key, lead);
}

function failure(status: number, code: CrmWebhookFailure["code"], error: string, extraHeaders?: HeadersInit) {
  const body: CrmWebhookFailure = { ok: false, code, error };
  return Response.json(body, { status, headers: extraHeaders });
}

export async function POST(request: Request) {
  if (request.headers.get(CHAOS_HEADER) === CHAOS_VALUE) {
    return failure(503, "CRM_UNAVAILABLE", "Service Unavailable: CRM in manutenzione (simulazione chaos).", {
      "Retry-After": "2",
    });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER) ?? "";
  const timestamp = Number(request.headers.get(TIMESTAMP_HEADER));

  if (!isTimestampFresh(timestamp, Math.floor(Date.now() / 1000))) {
    return failure(401, "STALE_TIMESTAMP", "Timestamp della firma assente o fuori finestra di tolleranza.");
  }
  if (!(await verifyWebhookSignature(DEMO_WEBHOOK_SECRET, timestamp, rawBody, signature))) {
    return failure(401, "INVALID_SIGNATURE", `Firma ${SIGNATURE_HEADER} non valida.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return failure(400, "INVALID_PAYLOAD", "Corpo JSON non valido.");
  }
  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
  if (!isLeadPayload(parsed) || parsed.idempotencyKey !== idempotencyKey) {
    return failure(400, "INVALID_PAYLOAD", "Payload lead non conforme o Idempotency-Key incoerente.");
  }

  const existing = processedLeads.get(parsed.idempotencyKey);
  if (existing) {
    const body: CrmWebhookSuccess = { ok: true, crmId: existing.crmId, duplicate: true, receivedAt: existing.receivedAt };
    return Response.json(body, { status: 200 });
  }

  const lead: StoredLead = {
    crmId: `KX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    receivedAt: new Date().toISOString(),
  };
  remember(parsed.idempotencyKey, lead);

  const body: CrmWebhookSuccess = { ok: true, crmId: lead.crmId, duplicate: false, receivedAt: lead.receivedAt };
  return Response.json(body, { status: 200 });
}
