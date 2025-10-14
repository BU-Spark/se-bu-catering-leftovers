// src/hooks/useStudentEvents.ts
import * as React from 'react';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  DocumentData,
} from 'firebase/firestore';
import type { Event } from '../types';
import { getExpiryMs, tsToMs } from '../lib/time';

type State = {
  events: Event[];
  loading: boolean;
  error: string | null;
};

export function useStudentEvents(options?: { pageSize?: number }) {
  const pageSize = options?.pageSize ?? 100;
  const [state, setState] = React.useState<State>({
    events: [],
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    const db = getFirestore();
    // Students see OPEN events only; ordered by most recent start
    const q = query(
      collection(db, 'Events'),
      where('status', '==', 'open'),
      orderBy('foodAvailable', 'desc'),
      limit(pageSize)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw: Event[] = [];
        snap.forEach((doc) => raw.push(doc.data() as Event));

        // Hide already expired on client for safety (server rules should also enforce)
        const now = Date.now();
        // Students see events currently open (status=open and within time window)
        const filtered = raw.filter(e => {
        const start = tsToMs(e.foodAvailable);
        const end = getExpiryMs(e);
        const now = Date.now();
        if (!start || !end) return false;
        return e.status === 'open' && start <= now && now <= end;
        });


        // For UX: sort by soonest to expire
        filtered.sort((a, b) => {
          const aExp = getExpiryMs(a) ?? 0;
          const bExp = getExpiryMs(b) ?? 0;
          return aExp - bExp;
        });

        setState({ events: filtered, loading: false, error: null });
      },
      (err) => setState({ events: [], loading: false, error: err.message })
    );

    return () => unsub();
  }, [pageSize]);

  const refresh = React.useCallback(async () => {
    // onSnapshot is live; no-op to satisfy pull-to-refresh UI
    return;
  }, []);

  return { ...state, refresh };
}
