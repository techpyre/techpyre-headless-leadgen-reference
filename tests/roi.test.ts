import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRoi, selectOpticsTier, toRoiSnapshot } from "../src/lib/roi.ts";
import { DEFAULT_ROI_ASSUMPTIONS, DEFAULT_ROI_INPUT, OPTICS_TIERS, SECTOR_PROFILES } from "../src/data/roi.ts";

const run = (overrides: Partial<typeof DEFAULT_ROI_INPUT> = {}) =>
  computeRoi({ ...DEFAULT_ROI_INPUT, ...overrides }, DEFAULT_ROI_ASSUMPTIONS, SECTOR_PROFILES, OPTICS_TIERS);

test("scenario di default: formule esplicite verificate a mano", () => {
  const result = run();
  // 2 turni × 8 h × 225 giorni
  assert.equal(result.annualHours, 3_600);
  assert.equal(result.annualPieces, 432_000);
  assert.ok(Math.abs(result.currentScrapCost - 432_000 * 0.035 * 18) < 1e-6);
  assert.ok(Math.abs(result.scrapSavings - 272_160 * 0.65) < 1e-6);
  assert.ok(Math.abs(result.inspectionLaborCost - 2 * 3_600 * 32) < 1e-6);
  assert.ok(Math.abs(result.laborSavings - 230_400 * 0.7) < 1e-6);
  assert.equal(result.cellsRequired, 1);
  assert.equal(result.opticsTier.id, "precision");
  assert.equal(result.investment, 285_000 + 45_000 + 35_000);
  assert.ok(Math.abs(result.taxCredit - 365_000 * 0.2) < 1e-6);
  assert.ok(result.paybackMonthsGross !== null && result.paybackMonthsNet !== null);
  assert.ok(result.paybackMonthsNet < result.paybackMonthsGross);
  assert.ok(Math.abs(result.paybackMonthsGross - (365_000 / result.netAnnualSavings) * 12) < 1e-9);
});

test("selezione del pacchetto ottico in base alla tolleranza", () => {
  assert.equal(selectOpticsTier(200, OPTICS_TIERS).id, "standard");
  assert.equal(selectOpticsTier(100, OPTICS_TIERS).id, "standard");
  assert.equal(selectOpticsTier(99, OPTICS_TIERS).id, "precision");
  assert.equal(selectOpticsTier(25, OPTICS_TIERS).id, "precision");
  assert.equal(selectOpticsTier(10, OPTICS_TIERS).id, "metrology");
});

test("oltre la capacità di una cella si aggiungono celle", () => {
  assert.equal(run({ piecesPerHour: 600 }).cellsRequired, 1);
  assert.equal(run({ piecesPerHour: 601 }).cellsRequired, 2);
  assert.equal(run({ piecesPerHour: 1_800 }).cellsRequired, 3);
});

test("risparmi non positivi → payback null", () => {
  const result = computeRoi(
    { ...DEFAULT_ROI_INPUT, sector: "packaging", shifts: 1, piecesPerHour: 10, currentScrapRate: 0.001, averagePieceCost: 0.5 },
    { ...DEFAULT_ROI_ASSUMPTIONS, inspectionAutomationShare: 0 },
    SECTOR_PROFILES,
    OPTICS_TIERS,
  );
  assert.ok(result.netAnnualSavings < 0);
  assert.equal(result.paybackMonthsGross, null);
  assert.equal(result.paybackMonthsNet, null);
});

test("lo snapshot allegato al lead è arrotondato e coerente", () => {
  const input = { ...DEFAULT_ROI_INPUT };
  const result = run();
  const snapshot = toRoiSnapshot(input, result);
  assert.equal(snapshot.investment, 365_000);
  assert.equal(snapshot.opticsTier, "precision");
  assert.equal(snapshot.sector, "automotive");
});
