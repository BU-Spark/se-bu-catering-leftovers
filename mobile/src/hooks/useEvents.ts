// src/hooks/useEvents.ts
import { useState, useEffect } from 'react';
import { fetchOpenEventsPage, fetchEventsPage } from '../lib/firebase/events';
import type { Event } from '../types';
import { Timestamp } from 'firebase/firestore';

export function useOpenEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { events: fetchedEvents } = await fetchOpenEventsPage({
        pageSize: 50,
      });

      // Sort by expiry time (soonest first)
      const sorted = fetchedEvents.sort((a, b) => {
        const expiryA = getEventExpiryTime(a);
        const expiryB = getEventExpiryTime(b);
        return expiryA - expiryB;
      });

      setEvents(sorted);
      setError(null);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadEvents();
  };

  return { events, loading, error, refresh };
}

export function useAllEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { events: fetchedEvents } = await fetchEventsPage({
        pageSize: 100,
        order: 'foodAvailable',
        direction: 'desc',
      });
      setEvents(fetchedEvents);
      setError(null);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadEvents();
  };

  return { events, loading, error, refresh };
}

function getEventExpiryTime(event: Event): number {
  try {
    // Handle Firestore Timestamp
    let startMs = 0;
    if (event.foodAvailable) {
      if (event.foodAvailable instanceof Timestamp) {
        startMs = event.foodAvailable.toMillis();
      } else if (
        typeof event.foodAvailable === 'object' &&
        'toDate' in event.foodAvailable
      ) {
        startMs = event.foodAvailable.toDate().getTime();
      } else if (typeof event.foodAvailable === 'number') {
        startMs = event.foodAvailable;
      }
    }

    const durationMs = (event.duration ?? 30) * 60 * 1000;
    return startMs + durationMs;
  } catch {
    return Date.now() + 30 * 60 * 1000; // Default to 30 minutes from now
  }
}
