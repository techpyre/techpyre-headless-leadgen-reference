import { SandboxProvider } from "@/components/sandbox/SandboxProvider";
import { EdgeInspector } from "@/components/sandbox/EdgeInspector";
import { Hero } from "@/components/marketing/Hero";
import { FeasibilityWorkbench } from "@/components/leads/FeasibilityWorkbench";
import { BenchmarkSimulator } from "@/components/benchmark/BenchmarkSimulator";
import { Applications, ArchitectureComparison, SectionHeading, SectorsServed, SpecsTable } from "@/components/marketing/Sections";
import { Footer } from "@/components/marketing/Footer";

/**
 * Pagina principale: prerenderizzata staticamente (nessuna API runtime).
 * Interattività confinata nei Client Components (Edge Inspector, configuratore, console, benchmark).
 */
export default function Home() {
  return (
    <SandboxProvider>
      <EdgeInspector />
      <main>
        <Hero />

        <section id="configuratore" aria-labelledby="configuratore-title" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHeading eyebrow="Configuratore ROI industriale" title="Quanto rende una X400 sulla tua linea?" id="configuratore-title">
              <p>
                Tre passaggi, calcolo istantaneo con formule esplicite. Poi invia la richiesta di studio di fattibilità e
                osserva nella console accanto cosa succede al lead quando il CRM aziendale va offline.
              </p>
            </SectionHeading>
            <div className="mt-8">
              <FeasibilityWorkbench />
            </div>
          </div>
        </section>

        <section id="benchmark" aria-labelledby="benchmark-title" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHeading
              eyebrow="Benchmark interattivo"
              title="Legacy CMS vs TechPYRE Edge (+68% efficienza acquisizione)"
              id="benchmark-title"
            >
              <p>
                Stesso budget Ads, stesso copy, stesso tasso di conversione del form. Il modello è trasparente: ogni
                parametro è visibile e modificabile, e il +68% emerge solo dalle ipotesi di default su abbandono e lead
                persi.
              </p>
            </SectionHeading>
            <div className="mt-8">
              <BenchmarkSimulator />
            </div>
          </div>
        </section>

        <ArchitectureComparison />
        <Applications />
        <SpecsTable />
        <SectorsServed />
      </main>
      <Footer />
    </SandboxProvider>
  );
}
