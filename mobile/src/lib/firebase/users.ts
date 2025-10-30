import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type DocumentData,
  arrayUnion,
  arrayRemove,
  getDocs,
  collection,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { firestore } from './config';
import {
  validateEnsureUser,
  validateUpdatePreferences,
  validateUserEventOp,
} from '../schemas/users.schema';

export type Role = 'User' | 'Admin';
export type UserDoc = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  events: string[]; // Event IDs user created/joined
  reviews: string[]; // Event IDs user reviewed
  locPref: string[]; // Location preferences
  timePref: string[]; // Time preferences
  foodPref: string[]; // Food preferences
  agreedToTerms: boolean;
};

const USERS = 'Users';
const usersCol = collection(firestore, USERS);

// Remove undefined values to avoid Firestore errors
const stripUndef = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
};

// Converter handles serialization between UserDoc and Firestore
const userConverter: FirestoreDataConverter<UserDoc> = {
  toFirestore(u: UserDoc): DocumentData {
    return stripUndef(u) as DocumentData;
  },
  fromFirestore(snap: QueryDocumentSnapshot, _opts: SnapshotOptions): UserDoc {
    const d = snap.data() as any;
    return {
      uid: snap.id,
      email: d?.email ?? '',
      name: d?.name ?? '',
      role: (d?.role ?? 'User') as Role,
      events: Array.isArray(d?.events) ? d.events : [],
      reviews: Array.isArray(d?.reviews) ? d.reviews : [],
      locPref: Array.isArray(d?.locPref) ? d.locPref : [],
      timePref: Array.isArray(d?.timePref) ? d.timePref : [],
      foodPref: Array.isArray(d?.foodPref) ? d.foodPref : [],
      agreedToTerms: !!d?.agreedToTerms,
    };
  },
};

const userRef = (uid: string) =>
  doc(firestore, USERS, uid).withConverter(userConverter);

/**
 * READ: Fetch a user by UID
 * @returns UserDoc if exists, null otherwise
 */
export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * READ: Fetch a user by email (normalized to lowercase)
 * @returns UserDoc if exists, null otherwise
 */
export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  const normalized = email.trim().toLowerCase();
  const q = query(usersCol, where('email', '==', normalized), limit(1));
  const snap = await getDocs(q);
  return snap.docs.length ? (snap.docs[0].data() as UserDoc) : null;
}

/**
 * CREATE: Create user if doesn't exist
 * Initializes with seed data or defaults
 */
export async function ensureUser(uid: string, seed: Partial<UserDoc> = {}) {
  const validated = validateEnsureUser(uid, seed);
  
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const full: UserDoc = {
      uid: validated.uid,
      email: (validated.email ?? '').trim().toLowerCase(),
      name: validated.name ?? '',
      role: (validated.role ?? 'User') as Role,
      events: [],
      reviews: [],
      locPref: [],
      timePref: [],
      foodPref: [],
      agreedToTerms: false,
    };
    await setDoc(ref, full);
  }
}

/**
 * UPDATE: Modify user preferences
 * Only updates provided preference fields
 */
export async function updateUserPreferences(
  uid: string,
  prefs: Partial<Pick<UserDoc, 'locPref' | 'timePref' | 'foodPref'>>,
) {
  const validated = validateUpdatePreferences(prefs);
  await updateDoc(userRef(uid), stripUndef(validated));
}

/**
 * UPDATE: Mark terms as accepted
 */
export async function acceptTerms(uid: string) {
  await updateDoc(userRef(uid), { agreedToTerms: true });
}

/**
 * UPDATE: Add event to user's events array
 * Uses arrayUnion to avoid duplicates
 */
export async function addEventToUser(uid: string, eventId: string) {
  validateUserEventOp(uid, eventId);
  const batch = writeBatch(firestore);
  batch.update(userRef(uid), { events: arrayUnion(eventId) });
  await batch.commit();
}

/**
 * UPDATE: Remove event from user's events array
 */
export async function removeEventFromUser(uid: string, eventId: string) {
  validateUserEventOp(uid, eventId);
  const batch = writeBatch(firestore);
  batch.update(userRef(uid), { events: arrayRemove(eventId) });
  await batch.commit();
}
