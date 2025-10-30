import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { firestore } from './config';
import {
  validateCreateReview,
  validateFetchReviewsOpts,
} from '../schemas/reviews.schema';

export type Review = {
  id: string;
  comment: string;
  date: any; // Firestore Timestamp
  images: string[]; // Image URLs
  shareContact: boolean; // Whether user opted to share contact info
  name?: string; // Only set if shareContact is true
  email?: string; // Only set if shareContact is true
};

const REVIEWS_ROOT = 'Reviews';

// Converter handles serialization between Review and Firestore
const reviewConverter = {
  toFirestore(r: Partial<Review>) {
    return r;
  },
  fromFirestore(snap: QueryDocumentSnapshot, _opts: SnapshotOptions): Review {
    const d = snap.data() as any;
    return {
      id: d.id ?? snap.id,
      comment: d.comment ?? '',
      date: d.date,
      images: Array.isArray(d.images) ? d.images : [],
      shareContact: !!d.shareContact,
      name: d.name,
      email: d.email,
    };
  },
};

// Reviews are stored as subcollections: Reviews/{eventId}/Reviews/{reviewId}
const subcol = (eventId: string) =>
  collection(firestore, REVIEWS_ROOT, eventId, 'Reviews').withConverter(
    reviewConverter,
  );

/**
 * READ: Fetch reviews for an event
 * @param eventId Event to fetch reviews for
 * @param pageSize Number of reviews to return (default 20)
 * @returns Reviews ordered by date, newest first
 */
export async function fetchReviews(eventId: string, pageSize = 20) {
  const validated = validateFetchReviewsOpts({ eventId, pageSize });
  const q = query(
    subcol(validated.eventId),
    orderBy('date', 'desc'),
    limit(validated.pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

/**
 * CREATE: Add a review to an event
 * Atomically creates review doc and updates event.reviewedBy + user.reviews arrays
 * @param eventId Event being reviewed
 * @param uid User creating the review
 * @param input Review content and optional contact info
 */
export async function createReview(
  eventId: string,
  uid: string,
  input: {
    comment: string;
    images?: string[];
    shareContact?: boolean;
    name?: string;
    email?: string;
  },
) {
  const validated = validateCreateReview(input);

  const batch = writeBatch(firestore);

  // Create review doc with auto-generated ID
  const reviewsCol = collection(firestore, REVIEWS_ROOT, eventId, 'Reviews');
  const reviewRef = doc(reviewsCol);
  const payload = {
    id: reviewRef.id,
    comment: validated.comment,
    date: serverTimestamp(),
    images: validated.images ?? [],
    shareContact: !!validated.shareContact,
    name: validated.shareContact ? (validated.name ?? null) : null,
    email: validated.shareContact ? (validated.email ?? null) : null,
  };

  batch.set(reviewRef, payload);

  // Mirror participation in event and user docs
  const eventRef = doc(firestore, 'Events', eventId);
  const userRef = doc(firestore, 'Users', uid);
  const { arrayUnion } = await import('firebase/firestore');
  batch.update(eventRef, { reviewedBy: arrayUnion(uid) });
  batch.update(userRef, { reviews: arrayUnion(eventId) });

  await batch.commit();
}
