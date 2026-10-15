import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { APPLICATIONS, ARCHITECTURE_COMPARISON, SECTORS_SERVED, X400_SPECS } from "@/data/kinetix";
import type { TechnicalSpec } from "@/types/catalog";

export function SectionHeading({
  title,
  id,
  children,
  action,
}: {
  title: string;
  id: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="max-w-2xl">
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px] sm:leading-tight">
          {title}
        </h2>
        {children ? <div className="mt-2 text-base leading-relaxed text-muted">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink hover:text-accent">
      {children} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

/** Intestazione delle pagine secondarie. */
export function PageIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {children ? <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{children}</div> : null}
      </div>
    </div>
  );
}

/** Le quattro specifiche che contano, in evidenza come sui siti dei costruttori di robot. */
export function KeySpecs() {
  const items = [
    { label: "Ripetibilità", value: "± 0,02 mm" },
    { label: "Sorgente laser", value: "Fibra 3 kW" },
    { label: "Velocità saldatura", value: "6 m/min" },
    { label: "Inferenza visione", value: "< 18 ms/pz" },
  ];
  return (
    <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`py-4 ${index % 2 === 1 ? "border-l border-line pl-4" : ""} ${index > 1 ? "border-t border-line sm:border-t-0" : ""} sm:border-l sm:border-line sm:px-4 sm:first:border-l-0 sm:first:pl-0`}
        >
          <dt className="text-sm text-faint">{item.label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ArchitectureComparison() {
  return (
    <>
      {/* Mobile: una scheda per aspetto */}
      <ul className="divide-y divide-line border-y border-line md:hidden">
        {ARCHITECTURE_COMPARISON.map((row) => (
          <li key={row.aspect} className="py-4">
            <p className="font-medium text-ink">{row.aspect}</p>
            <dl className="mt-2 grid gap-1.5 text-sm">
              <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                <dt className="text-faint">Legacy</dt>
                <dd className="text-muted">{row.legacy}</dd>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                <dt className="text-faint">Edge</dt>
                <dd className="text-ink">{row.edge}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      {/* Desktop: tabella */}
      <table className="hidden w-full text-left text-[15px] md:table">
        <caption className="sr-only">Confronto tra architettura legacy e architettura headless su Edge</caption>
        <thead className="border-b border-line-strong text-sm text-faint">
          <tr>
            <th scope="col" className="w-1/5 py-3 pr-4 font-medium">Aspetto</th>
            <th scope="col" className="py-3 pr-4 font-medium">WordPress legacy</th>
            <th scope="col" className="py-3 font-medium">Headless su Edge</th>
          </tr>
        </thead>
        <tbody>
          {ARCHITECTURE_COMPARISON.map((row) => (
            <tr key={row.aspect} className="border-b border-line align-top">
              <th scope="row" className="py-3 pr-4 font-medium text-ink">{row.aspect}</th>
              <td className="py-3 pr-4 text-muted">{row.legacy}</td>
              <td className="py-3 text-ink">{row.edge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function Applications() {
  return (
    <ul className="grid gap-8 md:grid-cols-3 md:gap-6">
      {APPLICATIONS.map((application) => (
        <li key={application.title} className="border-t-2 border-ink pt-4">
          <h3 className="text-lg font-semibold text-ink">{application.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{application.description}</p>
          <p className="mt-3 text-sm font-medium text-accent">{application.metric}</p>
        </li>
      ))}
    </ul>
  );
}

export function SpecsTable() {
  const groups = X400_SPECS.reduce<Record<string, TechnicalSpec[]>>((acc, spec) => {
    (acc[spec.group] ??= []).push(spec);
    return acc;
  }, {});
  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
      {Object.entries(groups).map(([group, specs]) => (
        <section key={group} aria-labelledby={`spec-${group}`}>
          <h3 id={`spec-${group}`} className="border-b border-line-strong pb-2 text-sm font-semibold text-ink">
            {group}
          </h3>
          <dl className="divide-y divide-line">
            {specs.map((spec) => (
              <div key={spec.parameter} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <dt className="text-sm text-muted">{spec.parameter}</dt>
                <dd className="text-[15px] text-ink">
                  <span className="tabular-nums">{spec.value}</span>
                  {spec.note ? <span className="block text-sm text-faint">{spec.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

export function SectorsServed() {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {SECTORS_SERVED.map((sector) => (
        <li key={sector.name} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-6">
          <h3 className="font-semibold text-ink">{sector.name}</h3>
          <p className="text-[15px] text-muted">{sector.parts}</p>
          <p className="text-sm tabular-nums text-faint">{sector.standard}</p>
        </li>
      ))}
    </ul>
  );
}
