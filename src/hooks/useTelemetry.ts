"use client";

import { useEffect, useState } from "react";
import type { TelemetrySnapshot } from "@/types/telemetry";

const EMPTY: TelemetrySnapshot = {
  hydrationMs: null,
  ttfbMs: null,
  lcpMs: null,
  transferBytes: null,
  encodedBodyBytes: null,
  protocol: null,
};

/**
 * Metriche reali del browser: nessun valore è simulato.
 * - idratazione: `performance.now()` al mount (ms dall'inizio della navigazione);
 * - TTFB e dimensioni del documento: `PerformanceNavigationTiming`;
 * - LCP: `PerformanceObserver` sul tipo `largest-contentful-paint` (con buffer).
 */
export function useTelemetry(): TelemetrySnapshot {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(EMPTY);

  useEffect(() => {
    const hydrationMs = performance.now();
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];

    // Aggiornamento differito di un frame: lo stato iniziale resta identico all'HTML prerenderizzato.
    const frame = requestAnimationFrame(() => {
      setSnapshot((previous) => ({
        ...previous,
        hydrationMs,
        ttfbMs: navigation ? Math.max(0, navigation.responseStart - navigation.startTime) : null,
        transferBytes: navigation ? navigation.transferSize : null,
        encodedBodyBytes: navigation ? navigation.encodedBodySize : null,
        protocol: navigation && navigation.nextHopProtocol ? navigation.nextHopProtocol : null,
      }));
    });

    let observer: PerformanceObserver | null = null;
    if (
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")
    ) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          setSnapshot((previous) => ({ ...previous, lcpMs: last.startTime }));
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return snapshot;
}
