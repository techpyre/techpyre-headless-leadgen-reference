import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBenchmark, theoreticalLeadRatio } from "../src/lib/benchmark.ts";
import { DEFAULT_BENCHMARK_INPUT, EDGE_STACK, LEGACY_STACK } from "../src/data/benchmark.ts";

test("con le ipotesi di default il rapporto lead è ≈ 1,678 (+68%)", () => {
  const ratio = theoreticalLeadRatio(LEGACY_STACK, EDGE_STACK);
  assert.ok(ratio !== null);
  assert.ok(Math.abs(ratio - 0.915 / (0.58 * 0.94)) < 1e-12);
  assert.equal(Math.round((ratio - 1) * 100), 68);
});

test("il rapporto non dipende da click, CPC e conversione del form", () => {
  for (const monthlyClicks of [500, 3_000, 10_000]) {
    for (const formConversionRate of [0.01, 0.04, 0.12]) {
      const result = computeBenchmark({ ...DEFAULT_BENCHMARK_INPUT, monthlyClicks, formConversionRate, averageCpc: 4.5 });
      assert.ok(result.leadUplift !== null);
      assert.equal(Math.round(result.leadUplift * 100), 68);
    }
  }
});

test("lead, CPA e budget sprecato con i default (3.000 click, 2,80 €, 4%)", () => {
  const result = computeBenchmark(DEFAULT_BENCHMARK_INPUT);
  assert.ok(Math.abs(result.legacy.deliveredLeads - 3_000 * 0.58 * 0.04 * 0.94) < 1e-9);
  assert.ok(Math.abs(result.edge.deliveredLeads - 3_000 * 0.915 * 0.04) < 1e-9);
  assert.equal(result.legacy.monthlySpend, 8_400);
  assert.ok(result.legacy.costPerLead !== null && result.edge.costPerLead !== null);
  assert.ok(result.edge.costPerLead < result.legacy.costPerLead);
  assert.ok(result.cpaReduction !== null && Math.abs(result.cpaReduction - (1 - 1 / 1.678)) < 0.001);
  assert.ok(result.recoveredMonthlySpend > 0);
});

test("nessun lead consegnato → CPA e rapporto null, nessuna divisione per zero", () => {
  const result = computeBenchmark({
    ...DEFAULT_BENCHMARK_INPUT,
    legacy: { ...LEGACY_STACK, leadLossRate: 1 },
  });
  assert.equal(result.legacy.costPerLead, null);
  assert.equal(result.leadRatio, null);
  assert.equal(result.cpaReduction, null);
});
