import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type FirestoreDataConverter,
  type DocumentData,
  arrayRemove,
} from 'firebase/firestore';
import { firestore } from './config';
import type { Event, EventStatus } from '../../types';
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventIds,
  PaginationOptsSchema,
  OpenEventsPaginationSchema,
  DeleteOptsSchema,
} from '../schemas/events.schema';

const EVENTS = 'Events';

/** Helpers */

// Convert various date formats to Firestore Timestamp
const toTimestampOrUndef = (
  v: Date | string | number | Timestamp | null | undefined,
): Timestamp | undefined => {
  if (v == null) return undefined;
  if (v instanceof Timestamp) return v;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? undefined : Timestamp.fromDate(d);
};

// Remove undefined values to avoid Firestore errors
const stripUndef = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
};

// Converter handles serialization between Event and Firestore
const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore(e: Event): DocumentData {
    return stripUndef({
      id: e.id,
      host: e.host,
      name: e.name,
      status: e.status,
      Location: e.Location,
      locationDetails: e.locationDetails,
      notes: e.notes,
      duration: e.duration,
      foodArrived: e.foodArrived,
      foodAvailable: e.foodAvailable,
      foods: e.foods,
      images: e.images,
      reviewedBy: e.reviewedBy,
    });
  },
  fromFirestore(snap: QueryDocumentSnapshot, _opts: SnapshotOptions): Event {
    const d = snap.data() as any;
    return {
      id: snap.id,
      host: d?.host ?? 'Unknown',
      name: d?.name ?? 'Untitled',
      status: (d?.status ?? 'drafted') as EventStatus,
      Location: d?.Location,
      locationDetails: d?.locationDetails ?? '',
      notes: d?.notes ?? '',
      duration:
        typeof d?.duration === 'number'
          ? d.duration
          : Number(d?.duration ?? 30),
      foodArrived: d?.foodArrived,
      foodAvailable: d?.foodAvailable,
      foods: Array.isArray(d?.foods) ? d.foods : [],
      images: Array.isArray(d?.images) ? d.images : [],
      reviewedBy: Array.isArray(d?.reviewedBy) ? d.reviewedBy : [],
    };
  },
};

const eventsCol = collection(firestore, EVENTS).withConverter(eventConverter);

/** READ Operations */

/**
 * READ: Paginated event list with custom ordering
 * @param opts.pageSize Number of events per page (default 20)
 * @param opts.after Last doc from previous page for pagination
 * @param opts.order Field to sort by (foodAvailable or foodArrived)
 * @param opts.direction Sort direction (asc or desc)
 * @returns Events and last doc for next page
 */
export async function fetchEventsPage(opts?: {
  pageSize?: number;
  after?: QueryDocumentSnapshot<Event> | null;
  order?: 'foodAvailable' | 'foodArrived';
  direction?: 'asc' | 'desc';
}): Promise<{
  events: Event[];
  lastDoc: QueryDocumentSnapshot<Event> | null;
}> {
  const validated = PaginationOptsSchema.parse(opts ?? {});
  const pageSize = validated.pageSize ?? 20;
  const field = validated.order ?? 'foodAvailable';
  const dir = validated.direction ?? 'desc';

  const base = [orderBy(field, dir), limit(pageSize)];
  const q = opts?.after
    ? query(eventsCol, ...base, startAfter(opts.after))
    : query(eventsCol, ...base);

  const snap = await getDocs(q);
  const events = snap.docs.map((d) => d.data());
  const lastDoc = snap.docs.length
    ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<Event>)
    : null;
  return { events, lastDoc };
}

/**
 * READ: Paginated list of open events only
 * Filters by status='open' and orders by foodAvailable desc
 * @param opts.pageSize Number of events per page (default 20)
 * @param opts.after Last doc from previous page for pagination
 * @returns Open events and last doc for next page
 */
export async function fetchOpenEventsPage(opts?: {
  pageSize?: number;
  after?: QueryDocumentSnapshot<Event> | null;
}): Promise<{
  events: Event[];
  lastDoc: QueryDocumentSnapshot<Event> | null;
}> {
  const validated = OpenEventsPaginationSchema.parse(opts ?? {});
  const pageSize = validated.pageSize ?? 20;

  const base = [
    where('status', '==', 'open'),
    orderBy('foodAvailable', 'desc'),
    limit(pageSize),
  ];
  const q = opts?.after
    ? query(eventsCol, ...base, startAfter(opts.after))
    : query(eventsCol, ...base);

  const snap = await getDocs(q);
  const events = snap.docs.map((d) => d.data());
  const lastDoc = snap.docs.length
    ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<Event>)
    : null;
  return { events, lastDoc };
}

/**
 * READ: Fetch single event by ID
 * @returns Event if exists, null otherwise
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  const ref = doc(eventsCol, eventId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * READ: Fetch multiple events by IDs
 * Handles Firestore's 10-item 'in' query limit by chunking
 * @param eventIds Array of event IDs to fetch
 * @returns Array of events (may be fewer than requested if some don't exist)
 */
export async function fetchEventsByIds(eventIds: string[]): Promise<Event[]> {
  const validated = validateEventIds(eventIds);
  if (!validated.length) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < validated.length; i += 10)
    chunks.push(validated.slice(i, i + 10));

  const results: Event[] = [];
  for (const ids of chunks) {
    const q = query(eventsCol, where(documentId(), 'in', ids));
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => d.data()));
  }
  return results;
}

/** WRITE Operations */

/**
 * CREATE: Create new event
 * Atomically creates event and optionally adds to creator's events array
 * @param eventData Event fields (all optional except defaults)
 * @param eventData.creatorUid If provided, adds event to user's events array
 * @returns Generated event ID
 */
export async function createEvent(
  eventData: Partial<Event> & { creatorUid?: string },
): Promise<string> {
  const validated = validateCreateEvent(eventData);

  const payload = stripUndef({
    host: validated.host ?? 'Unknown',
    name: validated.name ?? 'Untitled',
    status: (validated.status ?? 'drafted') as EventStatus,
    Location: validated.Location,
    locationDetails: validated.locationDetails ?? '',
    notes: validated.notes ?? '',
    duration:
      typeof validated.duration === 'number'
        ? validated.duration
        : Number(validated.duration ?? 30),
    foodArrived: toTimestampOrUndef(validated.foodArrived),
    foodAvailable: toTimestampOrUndef(validated.foodAvailable),
    foods: Array.isArray(validated.foods)
      ? validated.foods.filter((f: any) => f?.item?.trim?.())
      : undefined,
    images: validated.images ?? undefined,
    reviewedBy: [] as string[],
  });

  const batch = writeBatch(firestore);
  const ref = doc(collection(firestore, EVENTS));

  // Mirror ID in the doc for convenience
  batch.set(ref, { ...payload, id: ref.id });

  if (validated.creatorUid) {
    const userRef = doc(firestore, 'Users', validated.creatorUid);
    batch.set(
      userRef,
      { uid: validated.creatorUid, events: [ref.id] },
      { merge: true }
    );
  }

  await batch.commit();
  return ref.id;
}

/**
 * UPDATE: Modify existing event fields
 * Only updates provided fields, leaves others unchanged
 * @param eventId Event to update
 * @param updates Partial event data to update
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Event>,
): Promise<void> {
  const validated = validateUpdateEvent(updates);

  const data: Record<string, any> = stripUndef({
    host: validated.host,
    name: validated.name,
    status: validated.status,
    Location: validated.Location,
    locationDetails: validated.locationDetails,
    notes: validated.notes,
    duration: validated.duration,
    foods: validated.foods,
    images: validated.images,
    foodArrived: toTimestampOrUndef(validated.foodArrived),
    foodAvailable: toTimestampOrUndef(validated.foodAvailable),
  });

  const ref = doc(firestore, EVENTS, eventId);
  await updateDoc(ref, data);
}

/**
 * UPDATE: Change event status only
 * @param eventId Event to update
 * @param status New status (drafted, open, closed)
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
): Promise<void> {
  const ref = doc(firestore, EVENTS, eventId);
  await updateDoc(ref, { status });
}

/**
 * DELETE: Remove event
 * Atomically deletes event and optionally removes from owner's events array
 * @param eventId Event to delete
 * @param opts.ownerUid If provided, removes event from user's events array
 */
export async function deleteEvent(
  eventId: string,
  opts?: { ownerUid?: string },
): Promise<void> {
  DeleteOptsSchema.parse(opts);

  const batch = writeBatch(firestore);
  const eventRef = doc(firestore, EVENTS, eventId);
  batch.delete(eventRef);

  if (opts?.ownerUid) {
    const userRef = doc(firestore, 'Users', opts.ownerUid);
    batch.update(userRef, { events: arrayRemove(eventId) });
  }

  await batch.commit();
}