"use client";

import { useState } from "react";

interface NumericInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  describedBy?: string;
  className?: string;
  onChange: (value: number) => void;
}

export function NumericInput({
  id,
  value,
  min,
  max,
  step,
  describedBy,
  className = "field-input w-24 text-right tabular-nums",
  onChange,
}: NumericInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (raw: number) => Math.min(max, Math.max(min, raw));

  return (
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
        if (raw !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
          onChange(parsed);
        }
      }}
      onBlur={() => {
        if (draft !== null && draft !== "") {
          const parsed = Number(draft.replace(",", "."));
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
        }
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDraft(null);
          event.currentTarget.blur();
        }
      }}
      aria-describedby={describedBy}
      className={className}
    />
  );
}
