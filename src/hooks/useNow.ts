"use client";

import { useEffect, useState } from "react";

/** Orologio a bassa frequenza per countdown visivi (es. prossimo retry). */
export function useNow(intervalMs = 250, active = true): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(timer);
    };
  }, [intervalMs, active]);

  return now;
}
