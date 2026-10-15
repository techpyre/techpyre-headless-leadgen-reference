"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleCheck, Lock, Send, Timer } from "lucide-react";
import type { LeadFormErrors, LeadFormValues, LeadPayload } from "@/types/lead";
import type { RoiSnapshot } from "@/types/roi";
import { normalizeVatNumber, validateLeadForm } from "@/lib/validation";
import { useSandbox } from "@/components/sandbox/SandboxProvider";

const EMPTY_VALUES: LeadFormValues = {
  fullName: "",
  role: "",
  company: "",
  email: "",
  vatNumber: "",
  privacyConsent: false,
};

const CONFIRMATION_TARGET_MS = 40;

interface Confirmation {
  id: string;
  ms: number;
  crmDown: boolean;
  backend: string;
}

interface TextFieldProps {
  name: Exclude<keyof LeadFormValues, "privacyConsent">;
  label: string;
  type?: "text" | "email";
  autoComplete: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "numeric";
  values: LeadFormValues;
  errors: LeadFormErrors;
  onChange: (name: keyof LeadFormValues, value: string) => void;
}

function TextField({ name, label, type = "text", autoComplete, placeholder, inputMode, values, errors, onChange }: TextFieldProps) {
  const id = useId();
  const error = errors[name];
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        value={values[name]}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field-input mt-1"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LeadForm({ roiSnapshot }: { roiSnapshot: RoiSnapshot }) {
  const { enqueue, crmDown, backend, ready } = useSandbox();
  const [values, setValues] = useState<LeadFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const consentId = useId();

  const handleChange = (name: keyof LeadFormValues, value: string | boolean) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startedAt = performance.now();
    const validation = validateLeadForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    const now = new Date().toISOString();
    const payload: LeadPayload = {
      idempotencyKey: crypto.randomUUID(),
      submittedAt: now,
      source: "kinetix-x400-feasibility-form",
      contact: {
        fullName: values.fullName.trim(),
        role: values.role.trim(),
        company: values.company.trim(),
        email: values.email.trim().toLowerCase(),
        vatNumber: normalizeVatNumber(values.vatNumber),
      },
      consent: { privacy: true, acceptedAt: now },
      roi: roiSnapshot,
    };

    try {
      const { record, confirmationMs } = await enqueue(payload, startedAt);
      setConfirmation({ id: record.id, ms: confirmationMs, crmDown, backend: backend ?? "memory" });
      setValues(EMPTY_VALUES);
    } catch (error) {
      setSubmitError(
        `Non è stato possibile salvare la richiesta in locale (${error instanceof Error ? error.message : "errore sconosciuto"}). Riprova.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillExample = () => {
    setErrors({});
    setValues({
      fullName: "Giulia Ferrari",
      role: "Responsabile Qualità",
      company: "Officine Meccaniche Esempio S.p.A.",
      email: "g.ferrari@officine-esempio.it",
      vatNumber: "00743110157",
      privacyConsent: true,
    });
  };

  return (
    <div id="studio-fattibilita" className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">Richiesta studio di fattibilità</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Il calcolo ROI corrente viene allegato alla richiesta. Risposta di un application engineer entro 2 giorni
            lavorativi.
          </p>
        </div>
        <button
          type="button"
          onClick={fillExample}
          className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:border-cyan hover:text-cyan"
        >
          Compila dati di esempio
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField name="fullName" label="Nome e cognome" autoComplete="name" values={values} errors={errors} onChange={handleChange} />
        <TextField name="role" label="Ruolo" autoComplete="organization-title" placeholder="es. Responsabile Produzione" values={values} errors={errors} onChange={handleChange} />
        <TextField name="company" label="Azienda" autoComplete="organization" values={values} errors={errors} onChange={handleChange} />
        <TextField name="email" label="Email aziendale" type="email" inputMode="email" autoComplete="email" placeholder="nome@azienda.it" values={values} errors={errors} onChange={handleChange} />
        <div className="sm:col-span-2">
          <TextField name="vatNumber" label="Partita IVA" inputMode="numeric" autoComplete="off" placeholder="11 cifre, con o senza prefisso IT" values={values} errors={errors} onChange={handleChange} />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={values.privacyConsent}
              onChange={(event) => handleChange("privacyConsent", event.target.checked)}
              aria-invalid={errors.privacyConsent ? true : undefined}
              aria-describedby={errors.privacyConsent ? `${consentId}-error` : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald"
            />
            <label htmlFor={consentId} className="text-xs leading-relaxed text-ink-muted">
              Acconsento al trattamento dei dati per essere ricontattato in merito allo studio di fattibilità (demo: i dati
              restano nel browser e nel webhook simulato, non vengono inviati a nessun CRM reale).
            </label>
          </div>
          {errors.privacyConsent ? (
            <p id={`${consentId}-error`} className="mt-1 text-xs text-danger">
              {errors.privacyConsent}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting || !ready}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald px-5 py-3 text-sm font-semibold text-void transition-colors hover:bg-emerald-soft disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {ready ? "Invia richiesta di fattibilità" : "Inizializzazione outbox…"}
          </button>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Lock className="h-3 w-3" aria-hidden="true" /> Payload firmato HMAC SHA-256 · chiave di idempotenza UUID ·
            persistenza locale prima della consegna
          </p>
        </div>
      </form>

      <div aria-live="polite" className="mt-4 min-h-[92px]">
        {confirmation ? (
          <div className="rounded-lg border border-emerald/40 bg-emerald/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-soft">
              <CircleCheck className="h-4 w-4" aria-hidden="true" /> Richiesta ricevuta: ti ricontatteremo a breve.
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                conferma in{" "}
                <span className={confirmation.ms < CONFIRMATION_TARGET_MS ? "text-emerald-soft" : "text-amber"}>
                  {confirmation.ms.toFixed(2)} ms
                </span>{" "}
                (obiettivo &lt; {CONFIRMATION_TARGET_MS} ms)
              </span>
              <span>outbox: {confirmation.backend}</span>
              <span>id {confirmation.id.slice(0, 8)}</span>
            </p>
            <p className="mt-1.5 text-xs text-ink-muted">
              {confirmation.crmDown
                ? "Il CRM è offline: il lead è al sicuro nell'outbox e verrà consegnato automaticamente quando il CRM torna disponibile."
                : "La conferma arriva dopo la persistenza locale, non dopo la risposta del CRM: la consegna prosegue in background."}
            </p>
          </div>
        ) : submitError ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{submitError}</p>
        ) : null}
      </div>
    </div>
  );
}
