/**
 * Tipi del configuratore ROI della Cella Robotizzata Kinetix-X400.
 * Tutte le grandezze monetarie sono espresse in euro, le percentuali come frazioni (0–1).
 */

export type SectorId = "automotive" | "packaging" | "aerospace" | "sheet-metal";

export type ShiftCount = 1 | 2 | 3;

export type OpticsTierId = "standard" | "precision" | "metrology";

export interface SectorProfile {
  id: SectorId;
  label: string;
  /** Descrizione sintetica dell'applicazione tipica nel settore. */
  application: string;
  /** Riduzione attesa degli scarti grazie all'ispezione AI in linea (ipotesi di modello). */
  scrapReduction: number;
  /** Addetti al controllo qualità manuale per turno (ipotesi di modello). */
  inspectorsPerShift: number;
  /** Extra di investimento per requisiti di settore (tracciabilità, certificazioni). */
  complianceAddOn: number;
  /** Nota sul requisito che giustifica l'extra di investimento. */
  complianceNote: string;
}

export interface OpticsTier {
  id: OpticsTierId;
  label: string;
  /** Tolleranza minima (inclusa) in micron coperta dal livello ottico. */
  minToleranceMicron: number;
  /** Costo aggiuntivo del pacchetto ottico rispetto alla configurazione base. */
  addOn: number;
  /** Descrizione tecnica del sensore e dell'illuminazione. */
  hardware: string;
}

export interface RoiAssumptions {
  /** Ore per turno. */
  hoursPerShift: number;
  /** Giorni produttivi annui. */
  operatingDays: number;
  /** Costo orario pieno di un addetto al controllo qualità (€/h). */
  inspectorHourlyCost: number;
  /** Quota della manodopera di ispezione riallocabile grazie alla visione AI. */
  inspectionAutomationShare: number;
  /** Prezzo base della cella Kinetix-X400 (robot, sorgente laser, sicurezza, integrazione). */
  baseCellPrice: number;
  /** Capacità nominale di una cella in pezzi/ora; oltre si aggiungono celle. */
  cellCapacityPerHour: number;
  /** Costo annuo di manutenzione e licenze software come frazione dell'investimento. */
  annualMaintenanceRate: number;
}

export interface RoiInput {
  sector: SectorId;
  shifts: ShiftCount;
  piecesPerHour: number;
  toleranceMicron: number;
  /** Scarto attuale come frazione (es. 0.035 = 3,5%). */
  currentScrapRate: number;
  /** Costo medio pieno di un pezzo scartato (€). */
  averagePieceCost: number;
  /** Aliquota stimata del credito d'imposta (frazione). Valore indicativo da verificare. */
  taxCreditRate: number;
}

export interface RoiBreakdownLine {
  id: string;
  label: string;
  formula: string;
  value: number;
  unit: "€" | "h" | "pz" | "mesi" | "celle" | "%";
}

export interface RoiResult {
  annualHours: number;
  annualPieces: number;
  currentScrapCost: number;
  scrapSavings: number;
  inspectionLaborCost: number;
  laborSavings: number;
  cellsRequired: number;
  opticsTier: OpticsTier;
  investment: number;
  annualMaintenance: number;
  netAnnualSavings: number;
  taxCredit: number;
  netInvestment: number;
  /** Payback senza credito d'imposta, in mesi. `null` se i risparmi netti non sono positivi. */
  paybackMonthsGross: number | null;
  /** Payback considerando il credito d'imposta stimato, in mesi. */
  paybackMonthsNet: number | null;
  breakdown: RoiBreakdownLine[];
}

/** Estratto del calcolo ROI allegato alla richiesta di studio di fattibilità. */
export interface RoiSnapshot {
  sector: SectorId;
  shifts: ShiftCount;
  piecesPerHour: number;
  toleranceMicron: number;
  opticsTier: OpticsTierId;
  investment: number;
  netAnnualSavings: number;
  paybackMonthsNet: number | null;
}
