"use client";

import { useEffect, useState } from "react";

const LIMIT_SECONDS = 15 * 60;

export function useSessionClock(readyAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (readyAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [readyAt]);
  if (readyAt === null) return 0;
  return Math.min(LIMIT_SECONDS, Math.max(0, Math.floor((now - readyAt) / 1000)));
}
