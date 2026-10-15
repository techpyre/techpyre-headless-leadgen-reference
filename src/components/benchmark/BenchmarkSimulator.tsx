"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, RotateCcw } from "lucide-react";
import type { BenchmarkInput, StackId, StackOutcome, StackProfile } from "@/types/benchmark";
import { BENCHMARK_LIMITS, BENCHMARK_SOURCES, DEFAULT_BENCHMARK_INPUT } from "@/data/benchmark";
import { computeBenchmark, theoreticalLeadRatio } from "@/lib/benchmark";
import { formatEuro, formatEuroCents, formatNumber, formatPercent } from "@/lib/format";

interface ParamInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}

function ParamInput({ label, value, min, max, step, suffix, onChange }: ParamInputProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label htmlFor={id} className="text-[15px] text-ink">
        {label}
      </label>
      <span className="flex shrink-0 items-center gap-1.5">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const parsed = Number(raw.replace(",", "."));
            if (raw !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
          }}
          onBlur={() => {
            if (draft !== null && draft !== "") {
              const parsed = Number(draft.replace(",", "."));
              if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
            }
            setDraft(null);
          }}
          className="field-input w-24 text-right tabular-nums"
        />
        <span className="w-4 text-sm text-faint">{suffix}</span>
      </span>
    </div>
  );
}

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

function StackAssumptions({
  profile,
  onChange,
}: {
  profile: StackProfile;
  onChange: (profile: StackProfile) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[15px] font-semibold text-ink">{profile.label}</legend>
      <p className="mt-1 text-sm text-faint">{profile.description}</p>
      <div className="mt-2 divide-y divide-line">
        <ParamInput
          label="TTFB"
          suffix="s"
          value={profile.ttfbSeconds}
          {...BENCHMARK_LIMITS.seconds}
          onChange={(value) => onChange({ ...profile, ttfbSeconds: value })}
        />
        <ParamInput
          label="LCP"
          suffix="s"
          value={profile.lcpSeconds}
          {...BENCHMARK_LIMITS.seconds}
          onChange={(value) => onChange({ ...profile, lcpSeconds: value })}
        />
        <ParamInput
          label="Abbandono prima del caricamento"
          suffix="%"
          value={round(profile.abandonmentRate * 100, 2)}
          {...BENCHMARK_LIMITS.ratePct}
          onChange={(value) => onChange({ ...profile, abandonmentRate: value / 100 })}
        />
        <ParamInput
          label="Lead persi (timeout, errori)"
          suffix="%"
          value={round(profile.leadLossRate * 100, 2)}
          {...BENCHMARK_LIMITS.ratePct}
          onChange={(value) => onChange({ ...profile, leadLossRate: value / 100 })}
        />
      </div>
    </fieldset>
  );
}

const BAR_COLORS: Record<StackId, string> = { legacy: "#b7bdc5", edge: "#121519" };

function BarChart({ legacy, edge }: { legacy: StackOutcome; edge: StackOutcome }) {
  const rows = [
    { key: "leads", label: "Lead consegnati / mese", legacy: legacy.deliveredLeads, edge: edge.deliveredLeads, format: (v: number) => formatNumber(v, 1) },
    { key: "cpa", label: "Costo per lead", legacy: legacy.costPerLead ?? 0, edge: edge.costPerLead ?? 0, format: (v: number) => formatEuroCents(v) },
    { key: "waste", label: "Budget sprecato / mese", legacy: legacy.wastedSpend, edge: edge.wastedSpend, format: (v: number) => formatEuro(v) },
  ];

  return (
    <figure aria-labelledby="bench-chart-title" className="space-y-5">
      <figcaption id="bench-chart-title" className="sr-only">
        Confronto a barre: lead consegnati, CPA e budget sprecato tra Legacy CMS e TechPYRE Edge
      </figcaption>
      {rows.map((row) => {
        const max = Math.max(row.legacy, row.edge, 1e-9);
        const bars: { stack: StackId; value: number }[] = [
          { stack: "legacy", value: row.legacy },
          { stack: "edge", value: row.edge },
        ];
        return (
          <div key={row.key}>
            <p className="text-sm text-muted">{row.label}</p>
            <div className="mt-1.5 space-y-1">
              {bars.map((bar) => (
                <div key={bar.stack} className="flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-sm bg-panel">
                    <div
                      className="h-full rounded-sm transition-[width] duration-300"
                      style={{ width: `${Math.max(1, (bar.value / max) * 100)}%`, backgroundColor: BAR_COLORS[bar.stack] }}
                    />
                  </div>
                  <span className={`w-24 shrink-0 text-right text-sm tabular-nums ${bar.stack === "edge" ? "font-semibold text-ink" : "text-faint"}`}>
                    <span className="sr-only">{bar.stack === "legacy" ? "Legacy CMS: " : "TechPYRE Edge: "}</span>
                    {row.format(bar.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </figure>
  );
}

/**
 * Simulatore Legacy CMS vs TechPYRE Edge.
 * `variant="compact"` (home): parametri principali, risultato e grafico.
 * `variant="full"` (/benchmark): aggiunge ipotesi modificabili, formule, tabella e fonti.
 */
export function BenchmarkSimulator({ variant = "full" }: { variant?: "compact" | "full" }) {
  const [input, setInput] = useState<BenchmarkInput>(DEFAULT_BENCHMARK_INPUT);
  const clicksId = useId();
  const result = useMemo(() => computeBenchmark(input), [input]);
  const ratio = theoreticalLeadRatio(input.legacy, input.edge);
  const { legacy, edge } = result;
  const uplift = result.leadUplift;
  const full = variant === "full";

  const steps = (outcome: StackOutcome, profile: StackProfile) =>
    `${formatNumber(input.monthlyClicks)} × (1 − ${formatPercent(profile.abandonmentRate, 1)}) × ${formatPercent(input.formConversionRate, 1)} × ${formatPercent(outcome.deliveryRate, 0)} = ${formatNumber(outcome.deliveredLeads, 1)} lead`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="rounded-lg border border-line p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={clicksId} className="text-[15px] font-medium text-ink">
              Click mensili da Ads
            </label>
            <span className="text-lg font-semibold tabular-nums text-ink">{formatNumber(input.monthlyClicks)}</span>
          </div>
          <input
            id={clicksId}
            type="range"
            {...BENCHMARK_LIMITS.monthlyClicks}
            value={input.monthlyClicks}
            onChange={(event) => setInput({ ...input, monthlyClicks: Number(event.target.value) })}
            className="mt-3 h-6 w-full"
          />
          <div className="flex justify-between text-xs tabular-nums text-faint">
            <span>500</span>
            <span>10.000</span>
          </div>
          <div className="mt-4 divide-y divide-line border-t border-line">
            <ParamInput
              label="CPC medio"
              suffix="€"
              value={input.averageCpc}
              {...BENCHMARK_LIMITS.averageCpc}
              onChange={(value) => setInput({ ...input, averageCpc: value })}
            />
            <ParamInput
              label="Conversione form"
              suffix="%"
              value={round(input.formConversionRate * 100, 2)}
              {...BENCHMARK_LIMITS.formConversionRatePct}
              onChange={(value) => setInput({ ...input, formConversionRate: value / 100 })}
            />
          </div>
          <p className="mt-3 text-sm text-faint">Stessa conversione per entrambi: cambia solo il sito.</p>
        </div>

        <div className="rounded-lg border border-line p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div>
              <p className="text-sm text-muted">Lead in più, stessa spesa</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums text-ok" aria-live="polite">
                {uplift === null ? "n.d." : `${uplift >= 0 ? "+" : ""}${formatPercent(uplift, 0)}`}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
              <dt className="text-faint">Spesa mensile</dt>
              <dd className="text-right tabular-nums text-ink">{formatEuro(legacy.monthlySpend)}</dd>
              <dt className="text-faint">Riduzione CPA</dt>
              <dd className="text-right tabular-nums text-ink">
                {result.cpaReduction === null ? "n.d." : formatPercent(result.cpaReduction, 1)}
              </dd>
              <dt className="text-faint">Budget recuperato</dt>
              <dd className="text-right tabular-nums text-ink">{formatEuro(result.recoveredMonthlySpend)}/mese</dd>
            </dl>
          </div>

          <div className="mt-6">
            <BarChart legacy={legacy} edge={edge} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_COLORS.legacy }} /> {input.legacy.label}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_COLORS.edge }} /> {input.edge.label}
            </span>
          </div>

          {!full ? (
            <Link href="/benchmark" className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink hover:text-accent">
              Ipotesi, formule e fonti <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      {full ? (
        <>
          <details className="group rounded-lg border border-line" open>
            <summary className="flex min-h-12 items-center justify-between gap-3 px-4 text-[15px] font-semibold text-ink sm:px-6">
              Ipotesi del modello
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="border-t border-line px-4 py-5 sm:px-6">
              <div className="grid gap-8 md:grid-cols-2">
                <StackAssumptions profile={input.legacy} onChange={(legacyProfile) => setInput({ ...input, legacy: legacyProfile })} />
                <StackAssumptions profile={input.edge} onChange={(edgeProfile) => setInput({ ...input, edge: edgeProfile })} />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-faint">TTFB e LCP sono contesto: nel modello pesano tramite il tasso di abbandono.</p>
                <button type="button" onClick={() => setInput(DEFAULT_BENCHMARK_INPUT)} className="btn-secondary shrink-0 text-sm">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Ripristina default
                </button>
              </div>
            </div>
          </details>

          <section aria-labelledby="bench-results" className="rounded-lg border border-line p-4 sm:p-6">
            <h3 id="bench-results" className="text-[15px] font-semibold text-ink">
              Risultati mensili
            </h3>
            <table className="mt-3 w-full text-left text-sm">
              <caption className="sr-only">Risultati mensili per stack</caption>
              <thead className="text-faint">
                <tr className="border-b border-line-strong">
                  <th scope="col" className="py-2 pr-3 font-medium">Metrica</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Legacy</th>
                  <th scope="col" className="py-2 text-right font-medium">Edge</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[
                  ["Visitatori che vedono la pagina", formatNumber(legacy.engagedVisitors), formatNumber(edge.engagedVisitors)],
                  ["Form inviati", formatNumber(legacy.submittedLeads, 1), formatNumber(edge.submittedLeads, 1)],
                  ["Lead consegnati al CRM", formatNumber(legacy.deliveredLeads, 1), formatNumber(edge.deliveredLeads, 1)],
                  ["CPA", legacy.costPerLead === null ? "n.d." : formatEuroCents(legacy.costPerLead), edge.costPerLead === null ? "n.d." : formatEuroCents(edge.costPerLead)],
                  ["Quota di spesa sprecata", formatPercent(legacy.wastedSpendShare, 1), formatPercent(edge.wastedSpendShare, 1)],
                ].map(([label, legacyValue, edgeValue]) => (
                  <tr key={label} className="border-b border-line">
                    <th scope="row" className="py-2.5 pr-3 font-normal text-muted">{label}</th>
                    <td className="py-2.5 pr-3 text-right text-faint">{legacyValue}</td>
                    <td className="py-2.5 text-right font-medium text-ink">{edgeValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="bench-formulas" className="rounded-lg border border-line p-4 sm:p-6">
            <h3 id="bench-formulas" className="text-[15px] font-semibold text-ink">
              Formule
            </h3>
            <div className="mt-3 space-y-2 break-words font-mono text-xs leading-relaxed text-muted">
              <p className="text-ink">Lead = click × (1 − abbandono) × conversione form × tasso di consegna</p>
              <p>
                <span className="text-faint">Legacy:</span> {steps(legacy, input.legacy)}
              </p>
              <p>
                <span className="text-faint">Edge:</span> {steps(edge, input.edge)}
              </p>
              <p>
                Rapporto = (1 − {formatPercent(input.edge.abandonmentRate, 1)}) × {formatPercent(edge.deliveryRate, 0)} ÷ ((1 −{" "}
                {formatPercent(input.legacy.abandonmentRate, 1)}) × {formatPercent(legacy.deliveryRate, 0)}) ={" "}
                <span className="text-ink">{ratio === null ? "n.d." : formatNumber(ratio, 3)}</span>
              </p>
              <p>
                CPA = spesa ÷ lead consegnati → legacy {legacy.costPerLead === null ? "n.d." : formatEuroCents(legacy.costPerLead)} · edge{" "}
                {edge.costPerLead === null ? "n.d." : formatEuroCents(edge.costPerLead)}
              </p>
              <p>
                Budget sprecato = spesa × [abbandono + (1 − abbandono) × conversione × lead persi] → legacy{" "}
                {formatEuro(legacy.wastedSpend)} · edge {formatEuro(edge.wastedSpend)}
              </p>
            </div>
          </section>

          <section aria-labelledby="bench-sources" className="rounded-lg border border-line p-4 sm:p-6">
            <h3 id="bench-sources" className="text-[15px] font-semibold text-ink">
              Fonti e limiti
            </h3>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              {BENCHMARK_SOURCES.map((source) => (
                <li key={source.title}>
                  <strong className="font-medium text-ink">{source.title}.</strong> {source.detail}
                </li>
              ))}
              <li>
                I default sono ipotesi dichiarate e modificabili, coerenti con le ricerche citate: non sono misure di un
                cliente reale né una promessa di risultato.
              </li>
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
