/**
 * Formattatori numerici in locale it-IT, condivisi tra server e client
 * (stesso output in prerendering e in idratazione).
 */

const eurFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCentsFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(value: number): string {
  return eurFormatter.format(Math.round(value));
}

export function formatEuroCents(value: number): string {
  return eurCentsFormatter.format(value);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Frazione (0–1) → percentuale formattata, es. 0.678 → "67,8%". */
export function formatPercent(fraction: number, fractionDigits = 1): string {
  return `${formatNumber(fraction * 100, fractionDigits)}%`;
}

export function formatMs(value: number | null, fractionDigits = 0): string {
  return value === null ? "—" : `${formatNumber(value, fractionDigits)} ms`;
}

export function formatBytes(value: number | null): string {
  if (value === null) return "—";
  if (value < 1024) return `${formatNumber(value)} B`;
  return `${formatNumber(value / 1024, 1)} kB`;
}
