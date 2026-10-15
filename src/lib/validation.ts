import type { LeadFormErrors, LeadFormValues, LeadPayload } from "../types/lead.ts";

/**
 * Validazioni formali del form "Richiesta studio di fattibilità".
 * Funzioni pure, riusate dal Client Component e dal Route Handler.
 */

/** Domini webmail consumer non accettati per una richiesta B2B. */
export const WEBMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.it",
  "outlook.com",
  "outlook.it",
  "live.com",
  "live.it",
  "msn.com",
  "yahoo.com",
  "yahoo.it",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "libero.it",
  "virgilio.it",
  "alice.it",
  "tin.it",
  "tiscali.it",
  "email.it",
  "inwind.it",
  "iol.it",
  "fastwebnet.it",
  "aol.com",
  "gmx.com",
  "gmx.it",
  "proton.me",
  "protonmail.com",
];

const EMAIL_PATTERN = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;

export function getEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed.slice(trimmed.lastIndexOf("@") + 1);
}

export function isWebmailDomain(domain: string): boolean {
  return WEBMAIL_DOMAINS.includes(domain.toLowerCase());
}

/** Normalizza una P.IVA: rimuove spazi, punti, trattini e il prefisso "IT". */
export function normalizeVatNumber(raw: string): string {
  return raw.replace(/[\s.\-]/g, "").toUpperCase().replace(/^IT/, "");
}

/**
 * Verifica formale della partita IVA italiana (11 cifre).
 * - cifre 1–7: matricola (non tutta a zero);
 * - cifre 8–10: codice dell'ufficio provinciale (non 000);
 * - cifra 11: carattere di controllo calcolato con l'algoritmo di Luhn
 *   (cifre in posizione dispari sommate, cifre in posizione pari raddoppiate
 *   e ridotte di 9 se maggiori di 9; controllo = (10 − somma mod 10) mod 10).
 */
export function isValidItalianVat(raw: string): boolean {
  const vat = normalizeVatNumber(raw);
  if (!/^\d{11}$/.test(vat)) return false;
  if (vat.slice(0, 7) === "0000000") return false;
  if (vat.slice(7, 10) === "000") return false;
  return computeVatCheckDigit(vat.slice(0, 10)) === Number(vat[10]);
}

/** Calcola la cifra di controllo sulle prime 10 cifre della P.IVA. */
export function computeVatCheckDigit(firstTenDigits: string): number {
  if (!/^\d{10}$/.test(firstTenDigits)) {
    throw new Error("Servono esattamente 10 cifre per calcolare il controllo.");
  }
  let sum = 0;
  for (let index = 0; index < 10; index += 1) {
    const digit = Number(firstTenDigits[index]);
    if (index % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return (10 - (sum % 10)) % 10;
}

export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (values.fullName.trim().length < 3) {
    errors.fullName = "Indica nome e cognome del referente.";
  }
  if (values.role.trim().length < 2) {
    errors.role = "Indica il ruolo in azienda (es. Responsabile Produzione).";
  }
  if (values.company.trim().length < 2) {
    errors.company = "Indica la ragione sociale dell'azienda.";
  }

  const domain = getEmailDomain(values.email);
  if (domain === null) {
    errors.email = "Inserisci un indirizzo email valido.";
  } else if (isWebmailDomain(domain)) {
    errors.email = `Per lo studio di fattibilità ci serve un indirizzo aziendale: gli indirizzi @${domain} non sono accettati. Grazie per la comprensione.`;
  }

  const vat = normalizeVatNumber(values.vatNumber);
  if (vat.length === 0) {
    errors.vatNumber = "Inserisci la partita IVA dell'azienda.";
  } else if (!/^\d{11}$/.test(vat)) {
    errors.vatNumber = "La partita IVA italiana è composta da 11 cifre.";
  } else if (!isValidItalianVat(vat)) {
    errors.vatNumber = "La cifra di controllo non è corretta: verifica la partita IVA.";
  }

  if (!values.privacyConsent) {
    errors.privacyConsent = "Il consenso al trattamento dei dati è necessario per ricontattarti.";
  }

  return errors;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Type guard usato dal Route Handler sul corpo JSON ricevuto. */
export function isLeadPayload(value: unknown): value is LeadPayload {
  if (!isRecord(value)) return false;
  const { idempotencyKey, submittedAt, source, contact, consent } = value;
  if (typeof idempotencyKey !== "string" || typeof submittedAt !== "string") return false;
  if (source !== "kinetix-x400-feasibility-form") return false;
  if (!isRecord(contact) || !isRecord(consent)) return false;
  const fields = ["fullName", "role", "company", "email", "vatNumber"] as const;
  if (!fields.every((field) => typeof contact[field] === "string")) return false;
  return consent.privacy === true;
}
