// src/hooks/useCountdown.ts
import * as React from 'react';
import { breakdown, remainingMs as remainingMsFn } from '../lib/time';

export function useCountdown(targetMs: number | null, tickMs = 1000) {
  const [now, setNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [targetMs, tickMs]);

  const remainingMs = React.useMemo(() => {
    if (!targetMs) return 0;
    return remainingMsFn(targetMs, now);
  }, [targetMs, now]);

  const parts = React.useMemo(() => breakdown(remainingMs), [remainingMs]);
  const isElapsed = remainingMs <= 0;

  return { remainingMs, ...parts, isElapsed };
}
