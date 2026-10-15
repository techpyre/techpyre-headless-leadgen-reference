import type { OpticsTier, RoiAssumptions, RoiInput, SectorProfile } from "../types/roi.ts";

/**
 * Parametri del configuratore ROI. Sono ipotesi di modello dichiarate e modificabili:
 * non rappresentano risultati di clienti reali.
 */

export const SECTOR_PROFILES: readonly SectorProfile[] = [
  {
    id: "automotive",
    label: "Automotive",
    application: "Saldatura laser di staffe, supporti e componenti telaio con ispezione del cordone in linea.",
    scrapReduction: 0.65,
    inspectorsPerShift: 2,
    complianceAddOn: 35_000,
    complianceNote: "Tracciabilità pezzo-per-pezzo e reportistica PPAP / IATF 16949.",
  },
  {
    id: "packaging",
    label: "Packaging",
    application: "Ispezione ottica di chiusure, saldature termiche e codici di lotto ad alta cadenza.",
    scrapReduction: 0.55,
    inspectorsPerShift: 1.5,
    complianceAddOn: 0,
    complianceNote: "Nessun extra: requisiti coperti dalla configurazione standard.",
  },
  {
    id: "aerospace",
    label: "Aerospazio",
    application: "Saldatura laser di leghe di titanio e nichel con controllo metrologico del giunto.",
    scrapReduction: 0.7,
    inspectorsPerShift: 3,
    complianceAddOn: 60_000,
    complianceNote: "Registrazione dati di processo e tracciabilità secondo EN 9100.",
  },
  {
    id: "sheet-metal",
    label: "Lavorazione Lamiera",
    application: "Saldatura di carpenteria leggera e verifica dimensionale di pieghe e forature.",
    scrapReduction: 0.6,
    inspectorsPerShift: 1.5,
    complianceAddOn: 0,
    complianceNote: "Nessun extra: requisiti coperti dalla configurazione standard.",
  },
] as const;

/** Livelli ottici ordinati dalla tolleranza più ampia alla più stretta. */
export const OPTICS_TIERS: readonly OpticsTier[] = [
  {
    id: "standard",
    label: "Standard Vision",
    minToleranceMicron: 100,
    addOn: 0,
    hardware: "Telecamera 5 MP area-scan, illuminazione LED coassiale.",
  },
  {
    id: "precision",
    label: "Precision Vision",
    minToleranceMicron: 25,
    addOn: 45_000,
    hardware: "Telecamera 12 MP + profilometro laser 2D, ottica telecentrica.",
  },
  {
    id: "metrology",
    label: "Metrology Vision",
    minToleranceMicron: 0,
    addOn: 95_000,
    hardware: "Profilometro laser 3D a triangolazione, risoluzione sub-10 µm, camera termica.",
  },
] as const;

export const DEFAULT_ROI_ASSUMPTIONS: RoiAssumptions = {
  hoursPerShift: 8,
  operatingDays: 225,
  inspectorHourlyCost: 32,
  inspectionAutomationShare: 0.7,
  baseCellPrice: 285_000,
  cellCapacityPerHour: 600,
  annualMaintenanceRate: 0.04,
};

export const DEFAULT_ROI_INPUT: RoiInput = {
  sector: "automotive",
  shifts: 2,
  piecesPerHour: 120,
  toleranceMicron: 50,
  currentScrapRate: 0.035,
  averagePieceCost: 18,
  taxCreditRate: 0.2,
};

export const ROI_INPUT_LIMITS = {
  piecesPerHour: { min: 10, max: 2_400, step: 10 },
  toleranceMicron: { min: 5, max: 500, step: 5 },
  currentScrapRatePct: { min: 0.1, max: 25, step: 0.1 },
  averagePieceCost: { min: 0.5, max: 2_000, step: 0.5 },
  taxCreditRatePct: { min: 0, max: 60, step: 1 },
} as const;

export const SHIFT_OPTIONS: readonly { value: 1 | 2 | 3; label: string; detail: string }[] = [
  { value: 1, label: "1 turno", detail: "8 h/giorno" },
  { value: 2, label: "2 turni", detail: "16 h/giorno" },
  { value: 3, label: "3 turni h24", detail: "24 h/giorno" },
] as const;
