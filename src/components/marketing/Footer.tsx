import { TriangleAlert } from "lucide-react";
import { COMPANY, TECHPYRE } from "@/data/kinetix";
import { GithubMark } from "@/components/ui/GithubMark";

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex gap-3 rounded-xl border border-amber/40 bg-amber/5 p-4 text-sm text-ink-muted">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
          <p>
            <strong className="text-ink">Azienda fittizia a scopo dimostrativo — dati simulati in memoria / nessun dato reale.</strong>{" "}
            {COMPANY.name} non esiste: prodotti, prezzi, parametri ROI e ipotesi del benchmark sono valori di modello. I
            lead inviati restano nell&apos;IndexedDB del tuo browser e nel webhook CRM simulato (memoria volatile del
            server), senza alcun invio a CRM reali.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-ink">
              Reference Architecture progettata da{" "}
              <a href={TECHPYRE.url} className="font-semibold text-emerald-soft underline-offset-4 hover:underline">
                {TECHPYRE.name}
              </a>{" "}
              — {TECHPYRE.studio}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              <a href={TECHPYRE.url} className="underline-offset-4 hover:text-ink hover:underline">
                https://www.techpyre.eu
              </a>{" "}
              · Head of Studio: {TECHPYRE.head}
            </p>
          </div>
          <a
            href={TECHPYRE.repoUrl}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-cyan hover:text-cyan"
          >
            <GithubMark /> Codice sorgente su GitHub (MIT)
          </a>
        </div>
        <p className="mt-8 font-mono text-[11px] text-ink-faint">
          Next.js App Router · React Server Components · Prerendering statico · Route Handler /api/crm/webhook · IndexedDB
          Outbox · Web Crypto HMAC SHA-256
        </p>
      </div>
    </footer>
  );
}
