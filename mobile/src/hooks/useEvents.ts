// src/hooks/useEvents.ts
import { useCallback, useRef, useState } from 'react';
import {
  fetchEventsPage,
  fetchOpenEventsPage,
} from '../lib/firebase/events';
import type { Event } from '../types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

type UseEventsOptions = {
  pageSize?: number;
  openOnly?: boolean;
  order?: 'foodAvailable' | 'foodArrived';
  direction?: 'asc' | 'desc';
};

export function useEvents(openOnly: boolean = false, options: UseEventsOptions = {}) {
  const {
    pageSize = 20,
    order = 'foodAvailable',
    direction = 'desc',
  } = options;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const afterRef = useRef<QueryDocumentSnapshot<Event> | null>(null);

  const loadEvents = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = openOnly
        ? await fetchOpenEventsPage({ pageSize, after: afterRef.current })
        : await fetchEventsPage({ pageSize, after: afterRef.current, order, direction });

      setEvents(prev => [...prev, ...result.events]);
      afterRef.current = result.lastDoc;
      setHasMore(Boolean(result.lastDoc));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [direction, hasMore, loading, openOnly, order, pageSize]);

  const refresh = useCallback(async () => {
    afterRef.current = null;
    setHasMore(true);
    setEvents([]);
    setLoading(false);
    await loadEvents();
  }, [loadEvents]);

  return { events, loading, error, hasMore, loadEvents, refresh };
}