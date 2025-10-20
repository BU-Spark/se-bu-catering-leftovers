// src/lib/time.ts
import type { Event } from '../types';
import { Timestamp } from 'firebase/firestore';

export function tsToMs(ts?: any): number | null {
  if (!ts) return null;
  
  try {
    // Handle Firestore Timestamp
    if (ts instanceof Timestamp) {
      return ts.toMillis();
    }
    
    // Handle object with toDate method
    if (typeof ts === 'object' && 'toDate' in ts && typeof ts.toDate === 'function') {
      const date = ts.toDate();
      return date.getTime();
    }
    
    // Handle object with seconds property (Firestore timestamp-like)
    if (typeof ts === 'object' && 'seconds' in ts) {
      return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
    }
    
    // Handle number (already milliseconds)
    if (typeof ts === 'number') {
      return ts;
    }
    
    // Handle string or Date
    const date = ts instanceof Date ? ts : new Date(ts);
    const time = date.getTime();
    return isNaN(time) ? null : time;
  } catch (error) {

    return null;
  }
}

export function getExpiryMs(event: Pick<Event, 'foodAvailable' | 'duration'>): number | null {
  const startMs = tsToMs(event.foodAvailable);
  if (!startMs) return null;
  
  const durationMin = typeof event.duration === 'number'
    ? event.duration
    : Number(event.duration ?? 30);
  
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