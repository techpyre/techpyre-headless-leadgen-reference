import type { BenchmarkInput, StackProfile } from "../types/benchmark.ts";

/**
 * Ipotesi di default del modello di benchmark. Sono valori dichiarati e modificabili
 * nel pannello "Ipotesi del modello", non misure di un cliente reale.
 */

export const LEGACY_STACK: StackProfile = {
  id: "legacy",
  label: "Legacy CMS",
  description: "WordPress monolitico + 24 plugin, rendering PHP a ogni richiesta, form sincrono verso il CRM.",
  ttfbSeconds: 1.4,
  lcpSeconds: 4.2,
  abandonmentRate: 0.42,
  leadLossRate: 0.06,
};

export const EDGE_STACK: StackProfile = {
  id: "edge",
  label: "TechPYRE Edge",
  description: "Next.js SSG/ISR servito da CDN Edge + Outbox di failover con retry e Dead-Letter Queue.",
  ttfbSeconds: 0.05,
  lcpSeconds: 0.3,
  abandonmentRate: 0.085,
  leadLossRate: 0,
};

export const DEFAULT_BENCHMARK_INPUT: BenchmarkInput = {
  monthlyClicks: 3_000,
  averageCpc: 2.8,
  formConversionRate: 0.04,
  legacy: LEGACY_STACK,
  edge: EDGE_STACK,
};

export const BENCHMARK_LIMITS = {
  monthlyClicks: { min: 500, max: 10_000, step: 100 },
  averageCpc: { min: 0.2, max: 25, step: 0.1 },
  formConversionRatePct: { min: 0.5, max: 20, step: 0.1 },
  ratePct: { min: 0, max: 95, step: 0.5 },
  seconds: { min: 0.01, max: 15, step: 0.01 },
} as const;

export const BENCHMARK_SOURCES: readonly { title: string; detail: string }[] = [
  {
    title: "Google / SOASTA Research — mobile page speed",
    detail:
      "Ricerca pubblica che evidenzia come una quota rilevante delle visite da mobile venga abbandonata quando il caricamento supera circa 3 secondi, e come la probabilità di rimbalzo cresca all'aumentare del tempo di caricamento.",
  },
  {
    title: "Deloitte — \"Milliseconds Make Millions\"",
    detail:
      "Studio commissionato da Google che correla miglioramenti di 0,1 secondi nella velocità del sito mobile con variazioni misurabili di conversione e progressione nel funnel in retail, travel e lead generation.",
  },
] as const;
