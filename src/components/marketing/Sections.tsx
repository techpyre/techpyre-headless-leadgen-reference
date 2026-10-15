import { Crosshair, Factory, Layers, Microscope, ScanLine, Server } from "lucide-react";
import { APPLICATIONS, ARCHITECTURE_COMPARISON, SECTORS_SERVED, X400_SPECS } from "@/data/kinetix";

const APPLICATION_ICONS = [Crosshair, Microscope, ScanLine] as const;

export function SectionHeading({ eyebrow, title, id, children }: { eyebrow: string; title: string; id: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {children ? <div className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">{children}</div> : null}
    </div>
  );
}

export function ArchitectureComparison() {
  return (
    <section aria-labelledby="architettura-title" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Architettura" title="Da WordPress monolitico a headless su Edge" id="architettura-title">
          <p>
            Il sito corporate di Kinetix era un WordPress con 24 plugin, rendering PHP a ogni richiesta e form sincrono verso
            il CRM. Questa reference architecture lo sostituisce con HTML pre-renderizzato servito dalla CDN e una pipeline
            dei lead che non dipende dalla disponibilità del CRM.
          </p>
        </SectionHeading>
        <div className="mt-8 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Confronto tra architettura legacy e architettura headless su Edge</caption>
            <thead className="bg-surface text-xs uppercase tracking-[0.12em] text-ink-faint">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-3 font-medium">Aspetto</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-danger" aria-hidden="true" /> Legacy CMS</span>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5"><Server className="h-3.5 w-3.5 text-emerald-soft" aria-hidden="true" /> TechPYRE Edge</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ARCHITECTURE_COMPARISON.map((row) => (
                <tr key={row.aspect} className="border-t border-line">
                  <th scope="row" className="sticky left-0 z-10 bg-void px-4 py-3 font-medium text-ink">{row.aspect}</th>
                  <td className="px-4 py-3 text-ink-muted">{row.legacy}</td>
                  <td className="px-4 py-3 text-emerald-soft">{row.edge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Applications() {
  return (
    <section aria-labelledby="applicazioni-title" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Applicazioni" title="Saldatura e controllo qualità nella stessa cella" id="applicazioni-title" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {APPLICATIONS.map((application, index) => {
            const Icon = APPLICATION_ICONS[index % APPLICATION_ICONS.length];
            return (
              <li key={application.title} className="rounded-xl border border-line bg-surface p-5">
                <Icon className="h-5 w-5 text-cyan" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-ink">{application.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{application.description}</p>
                <p className="mt-4 font-mono text-xs text-emerald-soft">{application.metric}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function SpecsTable() {
  return (
    <section aria-labelledby="specifiche-title" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Specifiche tecniche" title="Kinetix-X400 — scheda tecnica" id="specifiche-title">
          <p>Valori della configurazione standard; le varianti si definiscono nello studio di fattibilità.</p>
        </SectionHeading>
        <div className="mt-8 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Specifiche tecniche della cella Kinetix-X400</caption>
            <thead className="bg-surface text-xs uppercase tracking-[0.12em] text-ink-faint">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Gruppo</th>
                <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-3 font-medium">Parametro</th>
                <th scope="col" className="px-4 py-3 font-medium">Valore</th>
                <th scope="col" className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {X400_SPECS.map((spec) => (
                <tr key={`${spec.group}-${spec.parameter}`} className="border-t border-line">
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{spec.group}</td>
                  <th scope="row" className="sticky left-0 z-10 bg-void px-4 py-2.5 font-medium text-ink">{spec.parameter}</th>
                  <td className="px-4 py-2.5 font-mono text-xs text-cyan">{spec.value}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted">{spec.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function SectorsServed() {
  return (
    <section aria-labelledby="settori-title" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Settori serviti" title="Dove lavora la X400" id="settori-title" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTORS_SERVED.map((sector) => (
            <li key={sector.name} className="rounded-xl border border-line bg-surface p-5">
              <Factory className="h-5 w-5 text-emerald-soft" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-ink">{sector.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{sector.parts}</p>
              <p className="mt-4 inline-block rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                {sector.standard}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
