import type { BackoffPolicy } from "../types/lead.ts";

/**
 * Exponential Backoff con jitter ("equal jitter").
 *
 *   ritardo_base(n) = min(maxDelay, baseDelay × factor^(n − 1))
 *   ritardo(n)      = ritardo_base(n) / 2 + random × ritardo_base(n) / 2
 *
 * Il jitter distribuisce nel tempo i retry di molti client, evitando che si
 * presentino tutti insieme al CRM appena torna disponibile (thundering herd).
 */

export const DEFAULT_BACKOFF_POLICY: BackoffPolicy = {
  baseDelayMs: 2_000,
  factor: 2,
  maxDelayMs: 30_000,
  maxAttempts: 5,
};

/** Ritardo esponenziale senza jitter dopo il tentativo fallito numero `attempt` (1-based). */
export function exponentialDelay(attempt: number, policy: BackoffPolicy): number {
  const exponent = Math.max(0, attempt - 1);
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * policy.factor ** exponent);
}

/**
 * Ritardo effettivo con jitter. `random` è iniettabile per i test e deve restituire un valore in [0, 1).
 */
export function computeBackoffDelay(
  attempt: number,
  policy: BackoffPolicy,
  random: () => number = Math.random,
): number {
  const capped = exponentialDelay(attempt, policy);
  const jitter = Math.min(1, Math.max(0, random()));
  return Math.round(capped / 2 + jitter * (capped / 2));
}

/** `true` se dopo `attempts` tentativi falliti il messaggio va in Dead-Letter Queue. */
export function shouldDeadLetter(attempts: number, policy: BackoffPolicy): boolean {
  return attempts >= policy.maxAttempts;
}
