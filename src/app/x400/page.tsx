import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Applications, PageIntro, SectionHeading, SectorsServed, SpecsTable } from "@/components/marketing/Sections";

export const metadata: Metadata = {
  title: "Scheda tecnica X400",
  description: "Kinetix-X400: specifiche tecniche, applicazioni e settori serviti. Azienda fittizia a scopo dimostrativo.",
  alternates: { canonical: "/x400" },
};

export default function X400Page() {
  return (
    <>
      <PageIntro title="Kinetix-X400">
        <p>Cella robotizzata con saldatura laser a fibra e ispezione ottica 3D. Valori della configurazione standard.</p>
      </PageIntro>

      <section aria-labelledby="specifiche-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Specifiche" id="specifiche-title">
            <p>Le varianti si definiscono nello studio di fattibilità.</p>
          </SectionHeading>
          <div className="mt-8">
            <SpecsTable />
          </div>
        </div>
      </section>

      <section aria-labelledby="applicazioni-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Applicazioni" id="applicazioni-title" />
          <div className="mt-8">
            <Applications />
          </div>
        </div>
      </section>

      <section aria-labelledby="settori-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Settori" id="settori-title" />
          <div className="mt-6">
            <SectorsServed />
          </div>
        </div>
      </section>

      <section aria-label="Prossimo passo" className="bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-lg font-semibold text-ink">Quanto rende sulla tua linea?</p>
          <Link href="/#configuratore" className="btn-primary self-start sm:self-auto">
            Calcola il ROI <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
