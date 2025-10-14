// src/lib/time.ts
import type { Event } from '../types';
import { Timestamp } from 'firebase/firestore';

/** Firestore Timestamp -> number (ms) */
export function tsToMs(ts?: Timestamp | null): number | null {
  if (!ts) return null;
  const d = ts.toDate?.() ?? new Date(ts as unknown as string);
  return d.getTime();
}

/** Compute event expiry time (ms since epoch) from schema. */
export function getExpiryMs(event: Pick<Event, 'foodAvailable' | 'duration'>): number | null {
  const startMs = tsToMs(event.foodAvailable);
  if (!startMs) return null;
  const durationMin = typeof event.duration === 'number'
    ? event.duration
    : Number(event.duration ?? 0);
  return startMs + durationMin * 60_000;
}

/** Remaining ms until a target timestamp. Negative means already passed. */
export function remainingMs(targetMs: number, nowMs = Date.now()): number {
  return targetMs - nowMs;
}

/** Nicely format remaining ms as {d,h,m,s}. */
export function breakdown(ms: number) {
  const clamped = Math.max(0, ms);
  const s = Math.floor(clamped / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds };
}
