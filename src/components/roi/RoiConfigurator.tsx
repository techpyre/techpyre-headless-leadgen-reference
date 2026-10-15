"use client";

import { useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RoiInput, RoiResult, SectorId, ShiftCount } from "@/types/roi";
import { ROI_INPUT_LIMITS, SECTOR_PROFILES, SHIFT_OPTIONS } from "@/data/roi";
import { formatEuro, formatNumber } from "@/lib/format";

type Step = 1 | 2 | 3;

const STEPS: readonly { id: Step; label: string }[] = [
  { id: 1, label: "Settore" },
  { id: 2, label: "Produzione" },
  { id: 3, label: "Risultato" },
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
    <div className="py-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-number`} className="text-[15px] font-medium text-ink">
          {label}
        </label>
        <div className="flex shrink-0 items-center gap-2">
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
            className="field-input w-24 text-right tabular-nums"
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
          <span className="w-9 text-sm text-faint">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="mt-3 h-6 w-full"
        aria-label={`${label} (cursore)`}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function choiceClass(selected: boolean) {
  return `min-h-11 rounded-md border px-3 py-2.5 text-left transition-colors ${
    selected ? "border-ink bg-ink text-white" : "border-line-strong bg-paper text-ink hover:border-ink"
  }`;
}

export function RoiConfigurator({ input, result, onChange }: RoiConfiguratorProps) {
  const [step, setStep] = useState<Step>(1);
  const update = <K extends keyof RoiInput>(key: K, value: RoiInput[K]) => onChange({ ...input, [key]: value });
  const sector = SECTOR_PROFILES.find((item) => item.id === input.sector) ?? SECTOR_PROFILES[0];
  const months = (value: number | null) => (value === null ? "n.d." : `${formatNumber(value, 1)} mesi`);
  const lineValue = (line: RoiResult["breakdown"][number]) =>
    line.unit === "€"
      ? formatEuro(line.value)
      : line.unit === "mesi"
        ? result.paybackMonthsNet === null
          ? "n.d."
          : `${formatNumber(line.value, 1)} mesi`
        : `${formatNumber(line.value)} ${line.unit}`;

  return (
    <div className="rounded-lg border border-line bg-paper">
      <ol className="grid grid-cols-3 border-b border-line" aria-label="Passaggi del configuratore">
        {STEPS.map(({ id, label }) => {
          const active = id === step;
          const done = id < step;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => setStep(id)}
                aria-current={active ? "step" : undefined}
                className={`flex min-h-12 w-full items-center justify-center gap-2 border-b-2 px-2 text-sm transition-colors ${
                  active ? "border-accent font-semibold text-ink" : "border-transparent text-faint hover:text-ink"
                }`}
              >
                <span className={`tabular-nums ${done ? "text-ok" : ""}`}>{id}</span>
                <span className="truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="px-4 py-5 sm:px-6">
        {step === 1 ? (
          <div className="space-y-6">
            <fieldset>
              <legend className="text-[15px] font-medium text-ink">Settore</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {SECTOR_PROFILES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === input.sector}
                    onClick={() => update("sector", item.id as SectorId)}
                    className={`${choiceClass(item.id === input.sector)} text-[15px] font-medium`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">{sector.application}</p>
            </fieldset>
            <fieldset>
              <legend className="text-[15px] font-medium text-ink">Turni</legend>
              <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Numero di turni">
                {SHIFT_OPTIONS.map((option) => {
                  const selected = option.value === input.shifts;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("shifts", option.value as ShiftCount)}
                      className={`${choiceClass(selected)} text-center`}
                    >
                      <span className="block text-[15px] font-medium">{option.label}</span>
                      <span className={`block text-xs tabular-nums ${selected ? "text-white/70" : "text-faint"}`}>{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid divide-y divide-line md:grid-cols-2 md:gap-x-10 md:divide-y-0">
            <NumericField
              label="Pezzi all'ora"
              unit="pz/h"
              value={input.piecesPerHour}
              {...ROI_INPUT_LIMITS.piecesPerHour}
              hint="Oltre 600 pz/h servono più celle."
              onChange={(value) => update("piecesPerHour", value)}
            />
            <NumericField
              label="Tolleranza"
              unit="µm"
              value={input.toleranceMicron}
              {...ROI_INPUT_LIMITS.toleranceMicron}
              hint={`Ottica: ${result.opticsTier.label}`}
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
              label="Costo pieno del pezzo"
              unit="€"
              value={input.averagePieceCost}
              {...ROI_INPUT_LIMITS.averagePieceCost}
              onChange={(value) => update("averagePieceCost", value)}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
              <div className="bg-paper p-4">
                <dt className="text-sm text-muted">Risparmio netto annuo</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-ok sm:text-2xl">{formatEuro(result.netAnnualSavings)}</dd>
              </div>
              <div className="bg-paper p-4">
                <dt className="text-sm text-muted">Investimento</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-ink sm:text-2xl">{formatEuro(result.investment)}</dd>
              </div>
              <div className="bg-paper p-4">
                <dt className="text-sm text-muted">Payback</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-ink sm:text-2xl">{months(result.paybackMonthsGross)}</dd>
              </div>
              <div className="bg-paper p-4">
                <dt className="text-sm text-muted">Payback con credito</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-ink sm:text-2xl">{months(result.paybackMonthsNet)}</dd>
              </div>
            </dl>

            <p className="text-sm text-muted">
              {result.cellsRequired} {result.cellsRequired === 1 ? "cella" : "celle"} X400 · {result.opticsTier.label} ·{" "}
              {sector.label} · credito stimato <span className="tabular-nums text-ink">{formatEuro(result.taxCredit)}</span>
            </p>

            <div className="max-w-md border-t border-line">
              <NumericField
                label="Aliquota credito d'imposta"
                unit="%"
                value={Math.round(input.taxCreditRate * 100)}
                {...ROI_INPUT_LIMITS.taxCreditRatePct}
                hint="Transizione 5.0: valore indicativo da verificare con il consulente. Non è consulenza fiscale."
                onChange={(value) => update("taxCreditRate", value / 100)}
              />
            </div>

            <details className="group rounded-md border border-line">
              <summary className="flex min-h-12 items-center justify-between gap-3 px-4 text-[15px] font-medium text-ink">
                Come è calcolato
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <div className="border-t border-line">
                <ul className="divide-y divide-line">
                  {result.breakdown.map((line) => (
                    <li key={line.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-baseline sm:gap-4">
                      <span className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink sm:block">
                        {line.label}
                        <span className="tabular-nums sm:hidden">{lineValue(line)}</span>
                      </span>
                      <span className="font-mono text-xs text-faint">{line.formula}</span>
                      <span className="hidden whitespace-nowrap text-right text-sm tabular-nums text-ink sm:block">
                        {lineValue(line)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-line px-4 py-3 text-sm text-faint">
                  Riduzione scarti e addetti per turno sono ipotesi di settore: lo studio di fattibilità le sostituisce con
                  dati misurati. {sector.complianceNote}
                </p>
              </div>
            </details>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setStep((current) => (current > 1 ? ((current - 1) as Step) : current))}
          disabled={step === 1}
          className="btn-secondary px-3"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Indietro</span>
        </button>
        <p className="min-w-0 flex-1 text-center text-sm leading-tight text-muted" aria-live="polite">
          <span className="block text-xs text-faint sm:inline sm:text-sm">Risparmio </span>
          <span className="font-semibold tabular-nums text-ink">{formatEuro(result.netAnnualSavings)}/anno</span>
        </p>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((current) => (current < 3 ? ((current + 1) as Step) : current))}
            className="btn-primary"
          >
            Avanti <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <a href="#studio-fattibilita" className="btn-primary">
            Richiedi studio <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
