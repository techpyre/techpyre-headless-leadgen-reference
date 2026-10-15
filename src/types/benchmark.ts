/**
 * Tipi del modello di benchmark "Legacy CMS vs TechPYRE Edge".
 * Le frazioni sono espresse tra 0 e 1; i tempi in secondi.
 */

export type StackId = "legacy" | "edge";

export interface StackProfile {
  id: StackId;
  label: string;
  description: string;
  /** Time To First Byte in secondi. */
  ttfbSeconds: number;
  /** Largest Contentful Paint in secondi. */
  lcpSeconds: number;
  /** Quota di visitatori che abbandona prima che la pagina sia utilizzabile. */
  abandonmentRate: number;
  /** Quota di lead inviati ma persi per timeout, errori server o CRM non raggiungibile. */
  leadLossRate: number;
}

export interface BenchmarkInput {
  monthlyClicks: number;
  /** Costo per click medio in euro. */
  averageCpc: number;
  /** Tasso di conversione del form (identico per entrambi gli stack). */
  formConversionRate: number;
  legacy: StackProfile;
  edge: StackProfile;
}

export interface StackOutcome {
  stack: StackId;
  label: string;
  monthlySpend: number;
  /** Click che raggiungono una pagina utilizzabile. */
  engagedVisitors: number;
  /** Lead che compilano il form. */
  submittedLeads: number;
  /** Lead effettivamente consegnati al CRM. */
  deliveredLeads: number;
  /** Tasso di consegna = 1 − leadLossRate. */
  deliveryRate: number;
  /** Costo per lead consegnato; `null` se nessun lead viene consegnato. */
  costPerLead: number | null;
  /** Quota di spesa che non può produrre un lead consegnato. */
  wastedSpendShare: number;
  wastedSpend: number;
}

export interface BenchmarkResult {
  legacy: StackOutcome;
  edge: StackOutcome;
  /** Rapporto lead consegnati edge/legacy; `null` se legacy produce zero lead. */
  leadRatio: number | null;
  /** Incremento percentuale dei lead (frazione), es. 0.678 = +67,8%. */
  leadUplift: number | null;
  /** Riduzione del CPA (frazione). */
  cpaReduction: number | null;
  /** Budget mensile recuperato rispetto allo stack legacy. */
  recoveredMonthlySpend: number;
}
