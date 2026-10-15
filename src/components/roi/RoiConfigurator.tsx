"use client";

import { useId, useState } from "react";
import { Calculator, ChevronLeft, ChevronRight, Factory, Info, ScanLine } from "lucide-react";
import type { RoiInput, RoiResult, SectorId, ShiftCount } from "@/types/roi";
import { ROI_INPUT_LIMITS, SECTOR_PROFILES, SHIFT_OPTIONS } from "@/data/roi";
import { formatEuro, formatNumber } from "@/lib/format";

type Step = 1 | 2 | 3;

const STEPS: readonly { id: Step; label: string; icon: typeof Factory }[] = [
  { id: 1, label: "Settore e turni", icon: Factory },
  { id: 2, label: "Volumi e qualità", icon: ScanLine },
  { id: 3, label: "ROI e payback", icon: Calculator },
];

interface RoiConfiguratorProps {
  input: RoiInput;
  result: RoiResult;
  onChange: (input: RoiInput) => void;
}

interface NumericFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (value: number) => void;
}

function NumericField({ label, value, min, max, step, unit, hint, onChange }: NumericFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (raw: number) => Math.min(max, Math.max(min, raw));
  return (
    <div className="rounded-lg border border-line bg-void/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-number`} className="text-sm font-medium text-ink">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id={`${id}-number`}
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
              if (draft !== null) {
                const parsed = Number(draft.replace(",", "."));
                if (draft !== "" && Number.isFinite(parsed)) onChange(clamp(parsed));
              }
              setDraft(null);
            }}
            className="field-input w-28 text-right font-mono tabular-nums"
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
          <span className="w-10 font-mono text-xs text-ink-muted">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="mt-3 w-full"
        aria-label={`${label} (cursore)`}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function RoiConfigurator({ input, result, onChange }: RoiConfiguratorProps) {
  const [step, setStep] = useState<Step>(1);
  const [showDetail, setShowDetail] = useState(false);
  const detailId = useId();
  const update = <K extends keyof RoiInput>(key: K, value: RoiInput[K]) => onChange({ ...input, [key]: value });
  const sector = SECTOR_PROFILES.find((item) => item.id === input.sector) ?? SECTOR_PROFILES[0];

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <ol className="grid grid-cols-3 border-b border-line" aria-label="Passaggi del configuratore">
        {STEPS.map(({ id, label, icon: Icon }) => {
          const active = id === step;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => setStep(id)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full items-center justify-center gap-2 border-b-2 px-2 py-3 text-xs font-medium transition-colors sm:text-sm ${
                  active ? "border-emerald text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] ${
                    active ? "bg-emerald text-void" : "bg-line text-ink-muted"
                  }`}
                >
                  {id}
                </span>
                <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-4 sm:p-6">
        {step === 1 ? (
          <div className="space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Settore di applicazione</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SECTOR_PROFILES.map((item) => {
                  const selected = item.id === input.sector;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("sector", item.id as SectorId)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected ? "border-emerald bg-emerald/10" : "border-line bg-void/60 hover:border-line-strong"
                      }`}
                    >
                      <span className="text-sm font-semibold text-ink">{item.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{item.application}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Turni di produzione</legend>
              <div className="mt-3 grid grid-cols-3 gap-3" role="group" aria-label="Numero di turni">
                {SHIFT_OPTIONS.map((option) => {
                  const selected = option.value === input.shifts;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("shifts", option.value as ShiftCount)}
                      className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                        selected ? "border-emerald bg-emerald/10" : "border-line bg-void/60 hover:border-line-strong"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink">{option.label}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <NumericField
              label="Volume di produzione"
              unit="pz/h"
              value={input.piecesPerHour}
              {...ROI_INPUT_LIMITS.piecesPerHour}
              hint="Una cella X400 gestisce fino a 600 pz/h: oltre si dimensiona su più celle."
              onChange={(value) => update("piecesPerHour", value)}
            />
            <NumericField
              label="Tolleranza difettosità ammessa"
              unit="µm"
              value={input.toleranceMicron}
              {...ROI_INPUT_LIMITS.toleranceMicron}
              hint={`Pacchetto ottico selezionato: ${result.opticsTier.label} — ${result.opticsTier.hardware}`}
              onChange={(value) => update("toleranceMicron", value)}
            />
            <NumericField
              label="Scarto attuale"
              unit="%"
              value={Math.round(input.currentScrapRate * 1000) / 10}
              {...ROI_INPUT_LIMITS.currentScrapRatePct}
              onChange={(value) => update("currentScrapRate", value / 100)}
            />
            <NumericField
              label="Costo medio pieno del pezzo"
              unit="€"
              value={input.averagePieceCost}
              {...ROI_INPUT_LIMITS.averagePieceCost}
              hint="Materiale, lavorazioni e manodopera già incorporati nel pezzo scartato."
              onChange={(value) => update("averagePieceCost", value)}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-emerald/40 bg-emerald/10 p-4">
                <dt className="text-xs text-ink-muted">Risparmio netto annuo</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-soft sm:text-xl">
                  {formatEuro(result.netAnnualSavings)}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-void/60 p-4">
                <dt className="text-xs text-ink-muted">Investimento stimato</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink sm:text-xl">
                  {formatEuro(result.investment)}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-void/60 p-4">
                <dt className="text-xs text-ink-muted">Payback senza credito</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink sm:text-xl">
                  {result.paybackMonthsGross === null ? "n.d." : `${formatNumber(result.paybackMonthsGross, 1)} mesi`}
                </dd>
              </div>
              <div className="rounded-lg border border-cyan/40 bg-cyan/10 p-4">
                <dt className="text-xs text-ink-muted">Payback con credito stimato</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-cyan sm:text-xl">
                  {result.paybackMonthsNet === null ? "n.d." : `${formatNumber(result.paybackMonthsNet, 1)} mesi`}
                </dd>
              </div>
            </dl>

            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <NumericField
                label="Aliquota credito d'imposta stimata"
                unit="%"
                value={Math.round(input.taxCreditRate * 100)}
                {...ROI_INPUT_LIMITS.taxCreditRatePct}
                onChange={(value) => update("taxCreditRate", value / 100)}
              />
              <div className="flex gap-3 rounded-lg border border-amber/40 bg-amber/5 p-4 text-xs leading-relaxed text-ink-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                <p>
                  <strong className="text-ink">Transizione 5.0 — valore indicativo.</strong> L&apos;aliquota effettiva del
                  credito d&apos;imposta dipende da scaglioni di investimento, risparmio energetico certificato, requisiti di
                  interconnessione e dalla normativa vigente al momento dell&apos;ordine. Il parametro è modificabile e va
                  verificato con il proprio consulente fiscale: non costituisce consulenza fiscale.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-muted">
              Configurazione: {result.cellsRequired} {result.cellsRequired === 1 ? "cella" : "celle"} X400 ·{" "}
              {result.opticsTier.label} · {sector.label} ({sector.complianceNote}) · credito stimato{" "}
              <span className="font-mono text-ink">{formatEuro(result.taxCredit)}</span>
            </p>

            <div className="rounded-lg border border-line">
              <button
                type="button"
                onClick={() => setShowDetail((value) => !value)}
                aria-expanded={showDetail}
                aria-controls={detailId}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink"
              >
                Dettaglio calcolo (formule esplicite)
                <ChevronRight className={`h-4 w-4 transition-transform ${showDetail ? "rotate-90" : ""}`} aria-hidden="true" />
              </button>
              <div id={detailId} hidden={!showDetail} className="border-t border-line">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <caption className="sr-only">Passaggi del calcolo ROI</caption>
                    <thead className="text-ink-faint">
                      <tr>
                        <th scope="col" className="px-4 py-2 font-medium">Voce</th>
                        <th scope="col" className="px-4 py-2 font-medium">Formula</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">Valore</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map((line) => (
                        <tr key={line.id} className="border-t border-line/70">
                          <th scope="row" className="px-4 py-2 font-medium text-ink">{line.label}</th>
                          <td className="px-4 py-2 font-mono text-ink-muted">{line.formula}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums text-cyan">
                            {line.unit === "€"
                              ? formatEuro(line.value)
                              : line.unit === "mesi"
                                ? result.paybackMonthsNet === null
                                  ? "n.d."
                                  : `${formatNumber(line.value, 1)} mesi`
                                : `${formatNumber(line.value)} ${line.unit}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
                  Riduzione scarti, addetti per turno e quota di ispezione automatizzabile sono ipotesi di modello per
                  settore, non risultati di clienti reali: lo studio di fattibilità le sostituisce con i dati misurati
                  sulla linea.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setStep((current) => (current > 1 ? ((current - 1) as Step) : current))}
            disabled={step === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Indietro
          </button>
          <p className="hidden font-mono text-xs text-ink-faint sm:block" aria-live="polite">
            Risparmio netto stimato: <span className="text-emerald-soft">{formatEuro(result.netAnnualSavings)}/anno</span>
          </p>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((current) => (current < 3 ? ((current + 1) as Step) : current))}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-emerald-soft"
            >
              Avanti <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <a
              href="#studio-fattibilita"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-emerald-soft"
            >
              Richiedi lo studio <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
