import type { BenchmarkInput, BenchmarkResult, StackOutcome, StackProfile } from "../types/benchmark.ts";

/**
 * Modello trasparente "Legacy CMS vs TechPYRE Edge".
 *
 *   Lead consegnati = click × (1 − abbandono) × conversione form × tasso di consegna
 *
 * Il tasso di conversione del form è identico per entrambi gli stack (stesso budget, stesso copy):
 * la differenza dipende solo da quanti visitatori vedono la pagina e da quanti lead arrivano al CRM.
 */

const clampFraction = (value: number): number => Math.min(1, Math.max(0, value));

export function computeStackOutcome(
  profile: StackProfile,
  monthlyClicks: number,
  averageCpc: number,
  formConversionRate: number,
): StackOutcome {
  const clicks = Math.max(0, monthlyClicks);
  const abandonment = clampFraction(profile.abandonmentRate);
  const conversion = clampFraction(formConversionRate);
  const deliveryRate = 1 - clampFraction(profile.leadLossRate);

  const monthlySpend = clicks * Math.max(0, averageCpc);
  const engagedVisitors = clicks * (1 - abandonment);
  const submittedLeads = engagedVisitors * conversion;
  const deliveredLeads = submittedLeads * deliveryRate;

  // Spesa che non può generare un lead consegnato: click abbandonati prima del caricamento
  // più click il cui lead è stato inviato ma perso lungo la pipeline.
  const wastedSpendShare = abandonment + (1 - abandonment) * conversion * (1 - deliveryRate);

  return {
    stack: profile.id,
    label: profile.label,
    monthlySpend,
    engagedVisitors,
    submittedLeads,
    deliveredLeads,
    deliveryRate,
    costPerLead: deliveredLeads > 0 ? monthlySpend / deliveredLeads : null,
    wastedSpendShare,
    wastedSpend: monthlySpend * wastedSpendShare,
  };
}

export function computeBenchmark(input: BenchmarkInput): BenchmarkResult {
  const legacy = computeStackOutcome(input.legacy, input.monthlyClicks, input.averageCpc, input.formConversionRate);
  const edge = computeStackOutcome(input.edge, input.monthlyClicks, input.averageCpc, input.formConversionRate);

  const leadRatio = legacy.deliveredLeads > 0 ? edge.deliveredLeads / legacy.deliveredLeads : null;
  const cpaReduction =
    legacy.costPerLead !== null && edge.costPerLead !== null ? 1 - edge.costPerLead / legacy.costPerLead : null;

  return {
    legacy,
    edge,
    leadRatio,
    leadUplift: leadRatio === null ? null : leadRatio - 1,
    cpaReduction,
    recoveredMonthlySpend: legacy.wastedSpend - edge.wastedSpend,
  };
}

/**
 * Rapporto teorico indipendente da click, CPC e conversione:
 * (1 − abbandono_edge) × consegna_edge / ((1 − abbandono_legacy) × consegna_legacy).
 */
export function theoreticalLeadRatio(legacy: StackProfile, edge: StackProfile): number | null {
  const legacyFactor = (1 - clampFraction(legacy.abandonmentRate)) * (1 - clampFraction(legacy.leadLossRate));
  const edgeFactor = (1 - clampFraction(edge.abandonmentRate)) * (1 - clampFraction(edge.leadLossRate));
  return legacyFactor > 0 ? edgeFactor / legacyFactor : null;
}
