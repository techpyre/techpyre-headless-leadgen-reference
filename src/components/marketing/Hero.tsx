import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { X400Illustration } from "@/components/marketing/X400Illustration";
import { KeySpecs } from "@/components/marketing/Sections";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12 lg:pb-12 lg:pt-16">
        <div>
          <p className="text-sm text-faint">Cella robotizzata · Saldatura laser + visione 3D</p>
          <h1 id="hero-title" className="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Kinetix-X400
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
            Salda e controlla ogni pezzo nella stessa cella. Calcola in un minuto quanto rende sulla tua linea.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="#configuratore" className="btn-primary">
              Calcola il ROI <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link href="/x400" className="btn-secondary">
              Scheda tecnica
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-term">
          <X400Illustration />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <KeySpecs />
      </div>
    </section>
  );
}
