// src/hooks/useCountdown.ts
import * as React from 'react';
import { breakdown, remainingMs as remainingMsFn } from '../lib/time';

export function useCountdown(targetMs: number | null, tickMs = 1000) {
  const [now, setNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    if (!targetMs || targetMs <= 0) {
      // Reset to current time when target is invalid
      setNow(Date.now());
      return;
    }

    // Update immediately when targetMs changes
    setNow(Date.now());

    const id = setInterval(() => {
      setNow(Date.now());
    }, tickMs);

    return () => clearInterval(id);
  }, [targetMs, tickMs]);

  const remainingMs = React.useMemo(() => {
    if (!targetMs || targetMs <= 0) return 0;
    const remaining = remainingMsFn(targetMs, now);
    return Math.max(0, remaining);
  }, [targetMs, now]);

  const parts = React.useMemo(() => breakdown(remainingMs), [remainingMs]);
  const isElapsed = targetMs ? remainingMs <= 0 : true;

  return { remainingMs, ...parts, isElapsed };
}
