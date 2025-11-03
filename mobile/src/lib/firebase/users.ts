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
  events: string[];
  reviews: string[];
  locPref: string[];
  timePref: string[];
  foodPref: string[];
  agreedToTerms: boolean;
  pushToken?: string;
  devicePlatform?: string;
  notificationsEnabled?: boolean;
};

const USERS = 'Users';
const usersCol = collection(firestore, USERS);

const stripUndef = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
};

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
      pushToken: d?.pushToken,
      devicePlatform: d?.devicePlatform,
      notificationsEnabled: d?.notificationsEnabled ?? true,
    };
  },
};

const userRef = (uid: string) =>
  doc(firestore, USERS, uid).withConverter(userConverter);

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  const normalized = email.trim().toLowerCase();
  const q = query(usersCol, where('email', '==', normalized), limit(1));
  const snap = await getDocs(q);
  return snap.docs.length ? (snap.docs[0].data() as UserDoc) : null;
}

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
      pushToken: seed.pushToken,
      devicePlatform: seed.devicePlatform,
      notificationsEnabled: seed.notificationsEnabled ?? true,
    };
    await setDoc(ref, full);
  }
}

export async function updateUserPreferences(
  uid: string,
  prefs: Partial<Pick<UserDoc, 'locPref' | 'timePref' | 'foodPref'>>,
) {
  const validated = validateUpdatePreferences(prefs);
  await updateDoc(userRef(uid), stripUndef(validated));
}

export async function acceptTerms(uid: string) {
  await updateDoc(userRef(uid), { agreedToTerms: true });
}

export async function addEventToUser(uid: string, eventId: string) {
  validateUserEventOp(uid, eventId);
  const batch = writeBatch(firestore);
  batch.update(userRef(uid), { events: arrayUnion(eventId) });
  await batch.commit();
}

export async function removeEventFromUser(uid: string, eventId: string) {
  validateUserEventOp(uid, eventId);
  const batch = writeBatch(firestore);
  batch.update(userRef(uid), { events: arrayRemove(eventId) });
  await batch.commit();
}

export async function setPushToken(uid: string, token: string, platform?: string) {
  await updateDoc(userRef(uid), stripUndef({ pushToken: token, devicePlatform: platform }));
}

export async function setNotificationsEnabled(uid: string, enabled: boolean) {
  await updateDoc(userRef(uid), { notificationsEnabled: enabled });
}

export async function getPushTokensByRole(role: Role): Promise<string[]> {
  try {
    const qy = query(
      usersCol,
      where('role', '==', role),
      where('notificationsEnabled', '==', true)
    );
    const snap = await getDocs(qy);
    const tokens: string[] = [];
    snap.forEach((d) => {
      const t = (d.data() as any)?.pushToken;
      if (typeof t === 'string' && t.startsWith('ExponentPushToken')) tokens.push(t);
    });
    return tokens;
  } catch {
    const qy = query(usersCol, where('role', '==', role));
    const snap = await getDocs(qy);
    const tokens: string[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data?.notificationsEnabled === false) return;
      const t = data?.pushToken;
      if (typeof t === 'string' && t.startsWith('ExponentPushToken')) tokens.push(t);
    });
    return tokens;
  }
}
