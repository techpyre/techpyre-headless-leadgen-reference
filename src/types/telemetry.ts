/**
 * Metriche reali raccolte dal browser dall'Edge Inspector.
 * Ogni valore è `null` finché il browser non lo rende disponibile.
 */
export interface TelemetrySnapshot {
  /** Millisecondi dall'inizio della navigazione al mount dei Client Components. */
  hydrationMs: number | null;
  /** Time To First Byte in millisecondi (responseStart − startTime). */
  ttfbMs: number | null;
  /** Largest Contentful Paint in millisecondi. */
  lcpMs: number | null;
  /** Byte trasferiti in rete per il documento HTML (0 se servito da cache locale). */
  transferBytes: number | null;
  /** Byte compressi del corpo del documento. */
  encodedBodyBytes: number | null;
  /** Protocollo dell'ultimo hop (es. h2, h3). */
  protocol: string | null;
}

export type EdgeConnectionState = "ONLINE" | "CRM DOWN SIMULATION";
