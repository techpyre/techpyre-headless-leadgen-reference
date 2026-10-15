/**
 * Firma HMAC SHA-256 dei webhook, basata su Web Crypto (`crypto.subtle`),
 * disponibile sia nel browser sia nel runtime Node.js/Edge del Route Handler.
 *
 * Stringa firmata: `${timestamp}.${body}` (timestamp Unix in secondi), come negli
 * schemi di firma adottati dai principali provider di webhook: il timestamp
 * impedisce il replay di richieste catturate.
 */

/**
 * Segreto condiviso della sandbox. In questa demo la firma è calcolata nel browser,
 * quindi il segreto è pubblico per costruzione: in produzione la firma avviene
 * server-side e il segreto vive in una variabile d'ambiente.
 */
export const DEMO_WEBHOOK_SECRET = "kinetix-demo-webhook-secret-v1";

export const SIGNATURE_HEADER = "X-Kinetix-Signature";
export const TIMESTAMP_HEADER = "X-Kinetix-Timestamp";
export const IDEMPOTENCY_HEADER = "Idempotency-Key";
export const CHAOS_HEADER = "X-Kinetix-Chaos";
export const CHAOS_VALUE = "crm-down";

/** Tolleranza massima tra timestamp firmato e orologio del server. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

/** Restituisce la firma nel formato `sha256=<hex>`. */
export async function signWebhook(secret: string, timestamp: number, body: string): Promise<string> {
  const key = await importKey(secret);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  return `sha256=${toHex(mac)}`;
}

/** Confronto a tempo costante per non rivelare informazioni tramite timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyWebhookSignature(
  secret: string,
  timestamp: number,
  body: string,
  signature: string,
): Promise<boolean> {
  const expected = await signWebhook(secret, timestamp, body);
  return timingSafeEqual(expected, signature);
}

export function isTimestampFresh(timestamp: number, nowSeconds: number, tolerance = SIGNATURE_TOLERANCE_SECONDS): boolean {
  return Number.isFinite(timestamp) && Math.abs(nowSeconds - timestamp) <= tolerance;
}
