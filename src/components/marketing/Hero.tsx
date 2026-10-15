import { ArrowRight, Gauge, ShieldCheck, Zap } from "lucide-react";
import { COMPANY } from "@/data/kinetix";
import { X400Illustration } from "@/components/marketing/X400Illustration";

const HIGHLIGHTS = [
  { icon: Zap, label: "HTML pre-renderizzato su Edge", detail: "Nessuna query al database a ogni visita" },
  { icon: ShieldCheck, label: "Zero lead persi", detail: "Outbox IndexedDB, retry e Dead-Letter Queue" },
  { icon: Gauge, label: "Telemetria reale", detail: "TTFB, LCP e idratazione misurati nel tuo browser" },
] as const;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
            {COMPANY.name} · {COMPANY.location}
          </p>
          <h1 id="hero-title" className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {COMPANY.product}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {COMPANY.tagline} Saldatura laser a fibra e ispezione ottica 3D nella stessa cella, con ROI calcolato sul tuo
            reparto in meno di un minuto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#configuratore"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald px-5 py-3 text-sm font-semibold text-void transition-colors hover:bg-emerald-soft"
            >
              Calcola il ROI della tua linea <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#failover"
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan"
            >
              Apri il Chaos &amp; Failover Inspector
            </a>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="rounded-lg border border-line bg-surface/80 p-4">
                <Icon className="h-5 w-5 text-emerald-soft" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3 shadow-[0_0_80px_-30px_rgba(34,211,238,0.35)]">
          <X400Illustration />
        </div>
      </div>
    </section>
  );
}
