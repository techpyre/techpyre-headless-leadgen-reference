import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BACKOFF_POLICY, computeBackoffDelay, exponentialDelay } from "../src/lib/backoff.ts";
import { createQueueRecord, isDue, markDelivered, markFailed, redriveRecord, MemoryLeadQueueStore } from "../src/lib/queue.ts";
import { signWebhook, verifyWebhookSignature, isTimestampFresh } from "../src/lib/hmac.ts";
import type { LeadPayload } from "../src/types/lead.ts";

const policy = DEFAULT_BACKOFF_POLICY;

test("backoff esponenziale con tetto massimo", () => {
  assert.equal(exponentialDelay(1, policy), 2_000);
  assert.equal(exponentialDelay(2, policy), 4_000);
  assert.equal(exponentialDelay(3, policy), 8_000);
  assert.equal(exponentialDelay(10, policy), 30_000);
});

test("jitter: il ritardo resta tra metà e intero del ritardo esponenziale", () => {
  assert.equal(computeBackoffDelay(3, policy, () => 0), 4_000);
  assert.equal(computeBackoffDelay(3, policy, () => 0.5), 6_000);
  assert.equal(computeBackoffDelay(3, policy, () => 0.999999), 8_000);
});

const payload: LeadPayload = {
  idempotencyKey: "4f1c2b8e-7d3a-4c55-9e0f-1a2b3c4d5e6f",
  submittedAt: "2026-01-01T00:00:00.000Z",
  source: "kinetix-x400-feasibility-form",
  contact: { fullName: "Test", role: "QA", company: "Esempio", email: "qa@esempio.it", vatNumber: "00743110157" },
  consent: { privacy: true, acceptedAt: "2026-01-01T00:00:00.000Z" },
  roi: null,
};

test("ciclo di vita: retry, Dead-Letter Queue e re-drive", () => {
  let record = createQueueRecord(payload, { body: "{}", signature: "sha256=00", signatureTimestamp: 0 }, policy, 1_000);
  assert.equal(record.status, "PENDING");
  assert.equal(isDue(record, 1_000), true);

  for (let attempt = 1; attempt < policy.maxAttempts; attempt += 1) {
    record = markFailed(record, { httpStatus: 503, latencyMs: 12, error: "503" }, policy, 2_000, () => 0);
    assert.equal(record.status, "QUEUED_FOR_RETRY");
    assert.equal(record.attempts, attempt);
    assert.equal(record.nextAttemptAt, 2_000 + exponentialDelay(attempt, policy) / 2);
  }
  record = markFailed(record, { httpStatus: 503, latencyMs: 12, error: "503" }, policy, 3_000, () => 0);
  assert.equal(record.status, "DEAD_LETTER");
  assert.equal(record.nextAttemptAt, null);
  assert.equal(isDue(record, Number.MAX_SAFE_INTEGER), false);

  record = redriveRecord(record, policy, 4_000);
  assert.equal(record.status, "PENDING");
  assert.equal(record.attempts, 0);

  record = markDelivered(record, { httpStatus: 200, latencyMs: 30, crmId: "CRM-1" }, 5_000);
  assert.equal(record.status, "DELIVERED");
  assert.equal(record.crmId, "CRM-1");
});

test("fallback in memoria dell'outbox", async () => {
  const store = new MemoryLeadQueueStore();
  const record = createQueueRecord(payload, { body: "{}", signature: "sha256=00", signatureTimestamp: 0 }, policy, 1);
  await store.put(record);
  assert.equal((await store.getAll()).length, 1);
  assert.equal((await store.get(record.id))?.status, "PENDING");
  await store.delete(record.id);
  assert.equal((await store.getAll()).length, 0);
});

test("firma HMAC SHA-256 verificabile e sensibile a ogni byte", async () => {
  const body = JSON.stringify(payload);
  const signature = await signWebhook("segreto", 1_700_000_000, body);
  assert.match(signature, /^sha256=[0-9a-f]{64}$/);
  assert.equal(await verifyWebhookSignature("segreto", 1_700_000_000, body, signature), true);
  assert.equal(await verifyWebhookSignature("segreto", 1_700_000_001, body, signature), false);
  assert.equal(await verifyWebhookSignature("altro", 1_700_000_000, body, signature), false);
  assert.equal(await verifyWebhookSignature("segreto", 1_700_000_000, `${body} `, signature), false);
  assert.equal(isTimestampFresh(1_000, 1_200), true);
  assert.equal(isTimestampFresh(1_000, 1_400), false);
});
