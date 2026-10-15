import Link from "next/link";
import { COMPANY, TECHPYRE } from "@/data/kinetix";
import { GithubMark } from "@/components/ui/GithubMark";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/x400", label: "Scheda tecnica X400" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/architettura", label: "Architettura" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line bg-panel" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          <strong className="font-semibold text-ink">Azienda fittizia a scopo dimostrativo — dati simulati in memoria / nessun dato reale.</strong>{" "}
          {COMPANY.name} non esiste: prezzi e ipotesi sono valori di modello. I lead restano nel tuo browser e in un webhook
          simulato, mai in un CRM reale.
        </p>

        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:justify-between">
          <nav aria-label="Pagine">
            <ul className="grid grid-cols-2 gap-x-8 text-sm sm:flex sm:gap-6">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center text-muted hover:text-ink sm:min-h-0">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <a href={TECHPYRE.repoUrl} className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted hover:text-ink sm:min-h-0">
            <GithubMark /> Codice sorgente (MIT)
          </a>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-sm text-faint">
          Reference Architecture #2 di{" "}
          <a href={TECHPYRE.url} className="text-link">
            {TECHPYRE.name}
          </a>{" "}
          — {TECHPYRE.studio} · {TECHPYRE.head}
        </p>
      </div>
    </footer>
  );
}
