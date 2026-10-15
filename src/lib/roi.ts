import type {
  OpticsTier,
  RoiAssumptions,
  RoiBreakdownLine,
  RoiInput,
  RoiResult,
  RoiSnapshot,
  SectorProfile,
} from "../types/roi.ts";
import { formatEuro, formatNumber, formatPercent } from "./format.ts";

/**
 * Configuratore ROI della Cella Robotizzata Kinetix-X400 — funzione pura.
 *
 * Formule (tutte esposte nel "dettaglio calcolo" della UI):
 *   ore annue            = turni × ore per turno × giorni produttivi
 *   pezzi annui          = pezzi/ora × ore annue
 *   costo scarti attuale = pezzi annui × scarto attuale × costo medio pezzo
 *   risparmio scarti     = costo scarti attuale × riduzione scarti di settore
 *   costo ispezione      = addetti per turno × ore annue × costo orario
 *   risparmio ispezione  = costo ispezione × quota automatizzabile
 *   celle                = ⌈pezzi/ora ÷ capacità cella⌉
 *   investimento         = celle × (prezzo base + pacchetto ottico) + extra di settore
 *   risparmio netto      = risparmio scarti + risparmio ispezione − manutenzione annua
 *   credito d'imposta    = investimento × aliquota stimata (indicativa, da verificare)
 *   payback (mesi)       = investimento (netto credito) ÷ risparmio netto × 12
 */

export function selectOpticsTier(toleranceMicron: number, tiers: readonly OpticsTier[]): OpticsTier {
  if (tiers.length === 0) {
    throw new Error("Nessun livello ottico configurato.");
  }
  // I livelli sono ordinati dalla tolleranza più ampia alla più stretta:
  // si sceglie il primo livello in grado di garantire la tolleranza richiesta.
  const match = tiers.find((tier) => toleranceMicron >= tier.minToleranceMicron);
  return match ?? tiers[tiers.length - 1];
}

export function findSector(sectorId: RoiInput["sector"], sectors: readonly SectorProfile[]): SectorProfile {
  const sector = sectors.find((item) => item.id === sectorId);
  if (!sector) {
    throw new Error(`Settore non configurato: ${sectorId}`);
  }
  return sector;
}

const paybackMonths = (investment: number, netAnnualSavings: number): number | null =>
  netAnnualSavings > 0 ? (investment / netAnnualSavings) * 12 : null;

export function computeRoi(
  input: RoiInput,
  assumptions: RoiAssumptions,
  sectors: readonly SectorProfile[],
  tiers: readonly OpticsTier[],
): RoiResult {
  const sector = findSector(input.sector, sectors);
  const opticsTier = selectOpticsTier(input.toleranceMicron, tiers);

  const piecesPerHour = Math.max(0, input.piecesPerHour);
  const scrapRate = Math.min(1, Math.max(0, input.currentScrapRate));
  const pieceCost = Math.max(0, input.averagePieceCost);
  const taxCreditRate = Math.min(1, Math.max(0, input.taxCreditRate));

  const annualHours = input.shifts * assumptions.hoursPerShift * assumptions.operatingDays;
  const annualPieces = piecesPerHour * annualHours;
  const currentScrapCost = annualPieces * scrapRate * pieceCost;
  const scrapSavings = currentScrapCost * sector.scrapReduction;

  const inspectionLaborCost = sector.inspectorsPerShift * annualHours * assumptions.inspectorHourlyCost;
  const laborSavings = inspectionLaborCost * assumptions.inspectionAutomationShare;

  const cellsRequired = Math.max(1, Math.ceil(piecesPerHour / assumptions.cellCapacityPerHour));
  const investment = cellsRequired * (assumptions.baseCellPrice + opticsTier.addOn) + sector.complianceAddOn;
  const annualMaintenance = investment * assumptions.annualMaintenanceRate;
  const netAnnualSavings = scrapSavings + laborSavings - annualMaintenance;

  const taxCredit = investment * taxCreditRate;
  const netInvestment = investment - taxCredit;

  const breakdown: RoiBreakdownLine[] = [
    {
      id: "annual-hours",
      label: "Ore produttive annue",
      formula: `${input.shifts} turni × ${assumptions.hoursPerShift} h × ${assumptions.operatingDays} giorni`,
      value: annualHours,
      unit: "h",
    },
    {
      id: "annual-pieces",
      label: "Pezzi prodotti all'anno",
      formula: `${formatNumber(piecesPerHour)} pz/h × ${formatNumber(annualHours)} h`,
      value: annualPieces,
      unit: "pz",
    },
    {
      id: "scrap-cost",
      label: "Costo attuale degli scarti",
      formula: `${formatNumber(annualPieces)} pz × ${formatPercent(scrapRate, 1)} × ${formatEuro(pieceCost)}`,
      value: currentScrapCost,
      unit: "€",
    },
    {
      id: "scrap-savings",
      label: "Risparmio da riduzione scarti",
      formula: `${formatEuro(currentScrapCost)} × ${formatPercent(sector.scrapReduction, 0)} (riduzione ipotizzata ${sector.label})`,
      value: scrapSavings,
      unit: "€",
    },
    {
      id: "labor-cost",
      label: "Costo attuale dell'ispezione manuale",
      formula: `${formatNumber(sector.inspectorsPerShift, 1)} addetti/turno × ${formatNumber(annualHours)} h × ${formatEuro(assumptions.inspectorHourlyCost)}/h`,
      value: inspectionLaborCost,
      unit: "€",
    },
    {
      id: "labor-savings",
      label: "Risparmio manodopera di ispezione",
      formula: `${formatEuro(inspectionLaborCost)} × ${formatPercent(assumptions.inspectionAutomationShare, 0)} riallocabile`,
      value: laborSavings,
      unit: "€",
    },
    {
      id: "cells",
      label: "Celle Kinetix-X400 necessarie",
      formula: `⌈${formatNumber(piecesPerHour)} pz/h ÷ ${formatNumber(assumptions.cellCapacityPerHour)} pz/h per cella⌉`,
      value: cellsRequired,
      unit: "celle",
    },
    {
      id: "investment",
      label: "Investimento stimato",
      formula: `${cellsRequired} × (${formatEuro(assumptions.baseCellPrice)} + ${formatEuro(opticsTier.addOn)} ${opticsTier.label}) + ${formatEuro(sector.complianceAddOn)} extra di settore`,
      value: investment,
      unit: "€",
    },
    {
      id: "maintenance",
      label: "Manutenzione e licenze annue",
      formula: `${formatEuro(investment)} × ${formatPercent(assumptions.annualMaintenanceRate, 1)}`,
      value: annualMaintenance,
      unit: "€",
    },
    {
      id: "net-savings",
      label: "Risparmio netto annuo",
      formula: `${formatEuro(scrapSavings)} + ${formatEuro(laborSavings)} − ${formatEuro(annualMaintenance)}`,
      value: netAnnualSavings,
      unit: "€",
    },
    {
      id: "tax-credit",
      label: "Credito d'imposta stimato (indicativo)",
      formula: `${formatEuro(investment)} × ${formatPercent(taxCreditRate, 0)} aliquota stimata`,
      value: taxCredit,
      unit: "€",
    },
    {
      id: "payback",
      label: "Payback con credito d'imposta",
      formula: `${formatEuro(netInvestment)} ÷ ${formatEuro(netAnnualSavings)} × 12`,
      value: paybackMonths(netInvestment, netAnnualSavings) ?? 0,
      unit: "mesi",
    },
  ];

  return {
    annualHours,
    annualPieces,
    currentScrapCost,
    scrapSavings,
    inspectionLaborCost,
    laborSavings,
    cellsRequired,
    opticsTier,
    investment,
    annualMaintenance,
    netAnnualSavings,
    taxCredit,
    netInvestment,
    paybackMonthsGross: paybackMonths(investment, netAnnualSavings),
    paybackMonthsNet: paybackMonths(netInvestment, netAnnualSavings),
    breakdown,
  };
}

export function toRoiSnapshot(input: RoiInput, result: RoiResult): RoiSnapshot {
  return {
    sector: input.sector,
    shifts: input.shifts,
    piecesPerHour: input.piecesPerHour,
    toleranceMicron: input.toleranceMicron,
    opticsTier: result.opticsTier.id,
    investment: Math.round(result.investment),
    netAnnualSavings: Math.round(result.netAnnualSavings),
    paybackMonthsNet: result.paybackMonthsNet === null ? null : Math.round(result.paybackMonthsNet * 10) / 10,
  };
}
