"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLeadOutbox, type LeadOutbox } from "@/hooks/useLeadOutbox";

const SandboxContext = createContext<LeadOutbox | null>(null);

/**
 * Stato condiviso della sandbox (toggle chaos + outbox) tra Edge Inspector,
 * form di fattibilità e Chaos & Failover Inspector. I figli Server Component
 * restano prerenderizzati staticamente.
 */
export function SandboxProvider({ children }: { children: ReactNode }) {
  const outbox = useLeadOutbox();
  return <SandboxContext.Provider value={outbox}>{children}</SandboxContext.Provider>;
}

export function useSandbox(): LeadOutbox {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("useSandbox deve essere usato all'interno di <SandboxProvider>.");
  }
  return context;
}
