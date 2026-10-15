import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeVatCheckDigit,
  isValidItalianVat,
  isWebmailDomain,
  getEmailDomain,
  validateLeadForm,
} from "../src/lib/validation.ts";

test("cifra di controllo della partita IVA (algoritmo di Luhn)", () => {
  assert.equal(computeVatCheckDigit("0074311015"), 7);
  assert.equal(computeVatCheckDigit("1234567890"), 3);
});

test("P.IVA valide, con prefisso IT e separatori", () => {
  assert.equal(isValidItalianVat("00743110157"), true);
  assert.equal(isValidItalianVat("IT 00743110157"), true);
  assert.equal(isValidItalianVat("12345678903"), true);
});

test("P.IVA non valide", () => {
  assert.equal(isValidItalianVat("00743110158"), false, "cifra di controllo errata");
  assert.equal(isValidItalianVat("0074311015"), false, "10 cifre");
  assert.equal(isValidItalianVat("00000000000"), false, "matricola nulla");
  assert.equal(isValidItalianVat("ABCDEFGHILM"), false, "caratteri non numerici");
});

test("domini webmail rifiutati, domini aziendali accettati", () => {
  assert.equal(getEmailDomain("Mario.Rossi@Gmail.com"), "gmail.com");
  assert.equal(isWebmailDomain("gmail.com"), true);
  assert.equal(isWebmailDomain("libero.it"), true);
  assert.equal(isWebmailDomain("hotmail.it"), true);
  assert.equal(isWebmailDomain("kinetix-robotics.it"), false);
  assert.equal(getEmailDomain("non-una-email"), null);
});

test("validazione completa del form", () => {
  const valid = {
    fullName: "Giulia Ferrari",
    role: "Responsabile Qualità",
    company: "Officine Meccaniche Esempio S.p.A.",
    email: "g.ferrari@officine-esempio.it",
    vatNumber: "00743110157",
    privacyConsent: true,
  };
  assert.deepEqual(validateLeadForm(valid), {});

  const errors = validateLeadForm({ ...valid, email: "giulia@gmail.com", vatNumber: "00743110150", privacyConsent: false });
  assert.ok(errors.email?.includes("@gmail.com"));
  assert.ok(errors.vatNumber);
  assert.ok(errors.privacyConsent);
});
