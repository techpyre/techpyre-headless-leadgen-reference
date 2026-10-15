import type { Metadata } from "next";
import { ArchitectureComparison, PageIntro, SectionHeading } from "@/components/marketing/Sections";
import { DEFAULT_BACKOFF_POLICY } from "@/lib/backoff";
import { TECHPYRE } from "@/data/kinetix";
import { GithubMark } from "@/components/ui/GithubMark";

export const metadata: Metadata = {
  title: "Architettura",
  description:
    "Da WordPress monolitico a headless su Edge: HTML pre-renderizzato in CDN e pipeline dei lead con outbox, retry con backoff esponenziale, Dead-Letter Queue e firma HMAC.",
  alternates: { canonical: "/architettura" },
};

const PIPELINE = [
  { title: "Validazione", detail: "Email aziendale e Partita IVA con cifra di controllo." },
  { title: "Firma", detail: "HMAC SHA-256 via Web Crypto, chiave di idempotenza UUID." },
  { title: "Outbox", detail: "Salvataggio in IndexedDB, poi conferma immediata all'utente." },
  {
    title: "Consegna",
    detail: `Webhook CRM con retry: ${DEFAULT_BACKOFF_POLICY.baseDelayMs / 1000}s × ${DEFAULT_BACKOFF_POLICY.factor}^n, max ${DEFAULT_BACKOFF_POLICY.maxDelayMs / 1000}s, jitter.`,
  },
  { title: "Dead-Letter Queue", detail: `Dopo ${DEFAULT_BACKOFF_POLICY.maxAttempts} tentativi; re-drive manuale dalla console.` },
] as const;

const STACK = [
  "Next.js App Router",
  "React Server Components",
  "Prerendering statico",
  "Route Handler /api/crm/webhook",
  "IndexedDB Outbox",
  "Web Crypto HMAC SHA-256",
] as const;

export default function ArchitecturePage() {
  return (
    <>
      <PageIntro title="Architettura">
        <p>
          Il vecchio sito Kinetix era un WordPress con 24 plugin e form sincrono verso il CRM. Qui lo sostituiamo con HTML
          pre-renderizzato in CDN e una coda dei lead che non dipende dal CRM.
        </p>
      </PageIntro>

      <section aria-labelledby="confronto-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Prima e dopo" id="confronto-title" />
          <div className="mt-6">
            <ArchitectureComparison />
          </div>
        </div>
      </section>

      <section aria-labelledby="pipeline-title" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Percorso di un lead" id="pipeline-title">
            <p>Nessun lead perso, anche con il CRM offline.</p>
          </SectionHeading>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {PIPELINE.map((step, index) => (
              <li key={step.title} className="border-t-2 border-ink pt-3">
                <p className="text-sm tabular-nums text-faint">{index + 1}</p>
                <h3 className="mt-1 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{step.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 font-mono text-xs text-faint">
            PENDING → IN_FLIGHT → QUEUED_FOR_RETRY → DELIVERED (HTTP 200 OK) / DEAD_LETTER
          </p>
        </div>
      </section>

      <section aria-labelledby="stack-title">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading title="Stack" id="stack-title" />
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted">
            {STACK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a href={TECHPYRE.repoUrl} className="btn-secondary mt-8">
            <GithubMark /> Codice sorgente su GitHub
          </a>
        </div>
      </section>
    </>
  );
}
