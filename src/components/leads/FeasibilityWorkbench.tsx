"use client";

import { useMemo, useState } from "react";
import type { RoiInput } from "@/types/roi";
import { DEFAULT_ROI_ASSUMPTIONS, DEFAULT_ROI_INPUT, OPTICS_TIERS, SECTOR_PROFILES } from "@/data/roi";
import { computeRoi, toRoiSnapshot } from "@/lib/roi";
import { RoiConfigurator } from "@/components/roi/RoiConfigurator";
import { LeadForm } from "@/components/leads/LeadForm";
import { ChaosConsole } from "@/components/leads/ChaosConsole";

/** Configuratore ROI → form di fattibilità → console di failover, con stato ROI condiviso. */
export function FeasibilityWorkbench() {
  const [input, setInput] = useState<RoiInput>(DEFAULT_ROI_INPUT);
  const result = useMemo(() => computeRoi(input, DEFAULT_ROI_ASSUMPTIONS, SECTOR_PROFILES, OPTICS_TIERS), [input]);
  const snapshot = useMemo(() => toRoiSnapshot(input, result), [input, result]);

  return (
    <div className="space-y-6">
      <RoiConfigurator input={input} result={result} onChange={setInput} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadForm roiSnapshot={snapshot} />
        <ChaosConsole />
      </div>
    </div>
  );
}
