"use client";

import { useId, useMemo, useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
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
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </label>
      <span className="flex items-center gap-1">
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
          className="field-input w-20 px-2 py-1 text-right font-mono text-xs tabular-nums"
        />
        <span className="w-4 font-mono text-[11px] text-ink-faint">{suffix}</span>
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
  const accent = profile.id === "edge" ? "text-emerald-soft" : "text-danger";
  return (
    <fieldset className="rounded-lg border border-line bg-void/60 p-4">
      <legend className={`px-1 text-sm font-semibold ${accent}`}>{profile.label}</legend>
      <p className="mb-3 text-xs leading-relaxed text-ink-faint">{profile.description}</p>
      <div className="space-y-2">
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
          label="Lead persi (timeout, errori server/CRM)"
          suffix="%"
          value={round(profile.leadLossRate * 100, 2)}
          {...BENCHMARK_LIMITS.ratePct}
          onChange={(value) => onChange({ ...profile, leadLossRate: value / 100 })}
        />
      </div>
    </fieldset>
  );
}

const BAR_COLORS: Record<StackId, string> = { legacy: "#F87171", edge: "#10B981" };

function BarChart({ legacy, edge }: { legacy: StackOutcome; edge: StackOutcome }) {
  const rows = [
    { key: "leads", label: "Lead consegnati / mese", legacy: legacy.deliveredLeads, edge: edge.deliveredLeads, format: (v: number) => formatNumber(v, 1) },
    { key: "cpa", label: "CPA (costo per lead)", legacy: legacy.costPerLead ?? 0, edge: edge.costPerLead ?? 0, format: (v: number) => formatEuroCents(v) },
    { key: "waste", label: "Budget sprecato / mese", legacy: legacy.wastedSpend, edge: edge.wastedSpend, format: (v: number) => formatEuro(v) },
  ];

  return (
    <figure aria-labelledby="bench-chart-title" className="space-y-4">
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
            <p className="text-xs text-ink-muted">{row.label}</p>
            <div className="mt-1.5 space-y-1.5">
              {bars.map((bar) => (
                <div key={bar.stack} className="flex items-center gap-3">
                  <div className="h-4 flex-1 overflow-hidden rounded bg-surface-raised">
                    <div
                      className="h-full rounded transition-[width] duration-300"
                      style={{
                        width: `${Math.max(1, (bar.value / max) * 100)}%`,
                        backgroundColor: BAR_COLORS[bar.stack],
                        opacity: 0.9,
                      }}
                    />
                  </div>
                  <span
                    className="w-24 shrink-0 text-right font-mono text-xs tabular-nums"
                    style={{ color: BAR_COLORS[bar.stack] }}
                  >
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

export function BenchmarkSimulator() {
  const [input, setInput] = useState<BenchmarkInput>(DEFAULT_BENCHMARK_INPUT);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const clicksId = useId();
  const assumptionsId = useId();
  const result = useMemo(() => computeBenchmark(input), [input]);
  const ratio = theoreticalLeadRatio(input.legacy, input.edge);
  const { legacy, edge } = result;
  const uplift = result.leadUplift;

  const steps = (outcome: StackOutcome, profile: StackProfile) =>
    `${formatNumber(input.monthlyClicks)} × (1 − ${formatPercent(profile.abandonmentRate, 1)}) × ${formatPercent(input.formConversionRate, 1)} × ${formatPercent(outcome.deliveryRate, 0)} = ${formatNumber(outcome.deliveredLeads, 1)} lead`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={clicksId} className="text-sm font-medium text-ink">
              Click mensili da LinkedIn / Google Ads
            </label>
            <span className="font-mono text-sm tabular-nums text-cyan">{formatNumber(input.monthlyClicks)}</span>
          </div>
          <input
            id={clicksId}
            type="range"
            {...BENCHMARK_LIMITS.monthlyClicks}
            value={input.monthlyClicks}
            onChange={(event) => setInput({ ...input, monthlyClicks: Number(event.target.value) })}
            className="mt-3 w-full"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint">
            <span>500</span>
            <span>10.000</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-void/60 p-3">
            <ParamInput
              label="CPC medio"
              suffix="€"
              value={input.averageCpc}
              {...BENCHMARK_LIMITS.averageCpc}
              onChange={(value) => setInput({ ...input, averageCpc: value })}
            />
          </div>
          <div className="rounded-lg border border-line bg-void/60 p-3">
            <ParamInput
              label="Conversione form"
              suffix="%"
              value={round(input.formConversionRate * 100, 2)}
              {...BENCHMARK_LIMITS.formConversionRatePct}
              onChange={(value) => setInput({ ...input, formConversionRate: value / 100 })}
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          Stesso tasso di conversione del form per entrambi gli stack: confronto equo a parità di budget, di copy e di
          offerta. Cambia solo quanti visitatori vedono davvero la pagina e quanti lead arrivano al CRM.
        </p>

        <div className="rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setShowAssumptions((value) => !value)}
            aria-expanded={showAssumptions}
            aria-controls={assumptionsId}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink"
          >
            Ipotesi del modello (modificabili)
            <ChevronRight className={`h-4 w-4 transition-transform ${showAssumptions ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
          <div id={assumptionsId} hidden={!showAssumptions} className="space-y-3 border-t border-line p-4">
            <StackAssumptions profile={input.legacy} onChange={(legacyProfile) => setInput({ ...input, legacy: legacyProfile })} />
            <StackAssumptions profile={input.edge} onChange={(edgeProfile) => setInput({ ...input, edge: edgeProfile })} />
            <p className="text-xs leading-relaxed text-ink-faint">
              TTFB e LCP sono riportati come contesto tecnico: nel modello il loro effetto è espresso tramite il tasso di
              abbandono, che puoi tarare sui dati della tua analytics.
            </p>
            <button
              type="button"
              onClick={() => setInput(DEFAULT_BENCHMARK_INPUT)}
              className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-ink"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Ripristina ipotesi di default
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">Lead in più a parità di spesa</p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-emerald-soft" aria-live="polite">
              {uplift === null ? "n.d." : `${uplift >= 0 ? "+" : ""}${formatPercent(uplift, 0)}`}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
            <dt className="text-ink-faint">Spesa mensile</dt>
            <dd className="text-right tabular-nums text-ink">{formatEuro(legacy.monthlySpend)}</dd>
            <dt className="text-ink-faint">Riduzione CPA</dt>
            <dd className="text-right tabular-nums text-cyan">
              {result.cpaReduction === null ? "n.d." : formatPercent(result.cpaReduction, 1)}
            </dd>
            <dt className="text-ink-faint">Budget recuperato</dt>
            <dd className="text-right tabular-nums text-cyan">{formatEuro(result.recoveredMonthlySpend)}/mese</dd>
          </dl>
        </div>

        <BarChart legacy={legacy} edge={edge} />
        <div className="flex gap-4 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-danger" /> {input.legacy.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald" /> {input.edge.label}
          </span>
        </div>

        <div className="rounded-lg border border-line bg-void p-4 font-mono text-[11px] leading-relaxed text-ink-muted">
          <p className="text-cyan">Lead = click × (1 − abbandono) × conversione form × tasso di consegna</p>
          <p className="mt-2">
            <span className="text-danger">Legacy:</span> {steps(legacy, input.legacy)}
          </p>
          <p>
            <span className="text-emerald-soft">Edge:</span> {steps(edge, input.edge)}
          </p>
          <p className="mt-2">
            Rapporto = (1 − {formatPercent(input.edge.abandonmentRate, 1)}) × {formatPercent(edge.deliveryRate, 0)} ÷ ((1 −{" "}
            {formatPercent(input.legacy.abandonmentRate, 1)}) × {formatPercent(legacy.deliveryRate, 0)}) ={" "}
            <span className="text-emerald-soft">{ratio === null ? "n.d." : formatNumber(ratio, 3)}</span>
          </p>
          <p className="mt-2">
            CPA = spesa ÷ lead consegnati → legacy {legacy.costPerLead === null ? "n.d." : formatEuroCents(legacy.costPerLead)} ·
            edge {edge.costPerLead === null ? "n.d." : formatEuroCents(edge.costPerLead)}
          </p>
          <p>
            Budget sprecato = spesa × [abbandono + (1 − abbandono) × conversione × lead persi] → legacy{" "}
            {formatEuro(legacy.wastedSpend)} · edge {formatEuro(edge.wastedSpend)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <caption className="sr-only">Risultati mensili per stack</caption>
            <thead className="text-ink-faint">
              <tr className="border-b border-line">
                <th scope="col" className="sticky left-0 bg-surface py-2 pr-3 font-medium">Metrica</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{input.legacy.label}</th>
                <th scope="col" className="py-2 text-right font-medium">{input.edge.label}</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {[
                ["Visitatori che vedono la pagina", formatNumber(legacy.engagedVisitors), formatNumber(edge.engagedVisitors)],
                ["Form inviati", formatNumber(legacy.submittedLeads, 1), formatNumber(edge.submittedLeads, 1)],
                ["Lead consegnati al CRM", formatNumber(legacy.deliveredLeads, 1), formatNumber(edge.deliveredLeads, 1)],
                ["CPA", legacy.costPerLead === null ? "n.d." : formatEuroCents(legacy.costPerLead), edge.costPerLead === null ? "n.d." : formatEuroCents(edge.costPerLead)],
                ["Quota di spesa sprecata", formatPercent(legacy.wastedSpendShare, 1), formatPercent(edge.wastedSpendShare, 1)],
              ].map(([label, legacyValue, edgeValue]) => (
                <tr key={label} className="border-b border-line/60">
                  <th scope="row" className="sticky left-0 bg-surface py-2 pr-3 font-sans font-normal text-ink-muted">{label}</th>
                  <td className="py-2 pr-3 text-right text-ink">{legacyValue}</td>
                  <td className="py-2 text-right text-emerald-soft">{edgeValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-line p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Fonti e limiti del modello</h3>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-ink-muted">
            {BENCHMARK_SOURCES.map((source) => (
              <li key={source.title}>
                <strong className="text-ink">{source.title}.</strong> {source.detail}
              </li>
            ))}
            <li>
              I valori di default sono ipotesi di modello dichiarate e modificabili, coerenti con l&apos;ordine di grandezza
              delle ricerche citate: non sono misure di un cliente reale né una promessa di risultato.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
