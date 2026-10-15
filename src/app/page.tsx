import { Hero } from "@/components/marketing/Hero";
import { FeasibilityWorkbench } from "@/components/leads/FeasibilityWorkbench";
import { BenchmarkSimulator } from "@/components/benchmark/BenchmarkSimulator";
import { MoreLink, SectionHeading } from "@/components/marketing/Sections";

/**
 * Pagina principale: prerenderizzata staticamente (nessuna API runtime).
 * Interattività confinata nei Client Components (Edge Inspector, configuratore, console, benchmark).
 * Scheda tecnica, settori, modello del benchmark e architettura vivono in pagine dedicate.
 */
export default function Home() {
  return (
    <>
      <Hero />

      <section id="configuratore" aria-labelledby="configuratore-title" className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Calcola il ROI" id="configuratore-title">
            <p>Tre passaggi. Il risultato viene allegato alla richiesta.</p>
          </SectionHeading>
          <div className="mt-6">
            <FeasibilityWorkbench />
          </div>
        </div>
      </section>

      <section id="benchmark" aria-labelledby="benchmark-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            title="Legacy CMS vs TechPYRE Edge"
            id="benchmark-title"
            action={<MoreLink href="/architettura">Perché è più veloce</MoreLink>}
          >
            <p>Stesso budget Ads, stesso form: quanti lead arrivano davvero al CRM.</p>
          </SectionHeading>
          <div className="mt-6">
            <BenchmarkSimulator variant="compact" />
          </div>
        </div>
      </section>
    </>
  );
}
