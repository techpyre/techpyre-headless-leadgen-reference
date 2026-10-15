import type { Metadata } from "next";
import { BenchmarkSimulator } from "@/components/benchmark/BenchmarkSimulator";
import { PageIntro } from "@/components/marketing/Sections";

export const metadata: Metadata = {
  title: "Benchmark Legacy CMS vs Edge",
  description:
    "Modello trasparente Legacy CMS vs TechPYRE Edge: ipotesi modificabili, formule passo-passo, CPA, budget sprecato e fonti.",
  alternates: { canonical: "/benchmark" },
};

export default function BenchmarkPage() {
  return (
    <>
      <PageIntro title="Benchmark">
        <p>
          Legacy CMS contro TechPYRE Edge, a parità di budget e conversione. Ogni ipotesi è modificabile; il +68% emerge solo dai
          valori di default.
        </p>
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <BenchmarkSimulator variant="full" />
      </div>
    </>
  );
}
