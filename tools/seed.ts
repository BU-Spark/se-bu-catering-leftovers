import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'bu-catering-leftovers' });
}
const db = admin.firestore();

// small helper: upsert with id mirrored into the doc
async function upsert(col: string, id: string, data: Record<string, any>) {
  await db
    .collection(col)
    .doc(id)
    .set({ id, ...data }, { merge: true });
}

const now = new Date();

async function seed() {
  // Users
  await upsert('Users', 'user_admin_1', {
    uid: 'user_admin_1',
    email: 'admin@example.com',
    name: 'Site Admin',
    role: 'Admin',
    events: [],
    reviews: [],
    locPref: ['Central'],
    timePref: [],
    foodPref: [],
    agreedToTerms: true,
    createdAt: admin.firestore.Timestamp.fromDate(now),
  });

  await upsert('Users', 'user_001', {
    uid: 'user_001',
    email: 'student@example.com',
    name: 'Student One',
    role: 'User',
    events: [],
    reviews: [],
    locPref: ['Central', 'East'],
    timePref: [],
    foodPref: [],
    agreedToTerms: true,
    createdAt: admin.firestore.Timestamp.fromDate(now),
  });

  // Events
  const event1Id = 'event_open_1';
  await upsert('Events', event1Id, {
    host: 'BU Dining',
    name: 'Test Event 1',
    Location: {
      name: 'George Sherman Union',
      abbreviation: 'GSU',
      address: '775 Commonwealth Avenue, Boston, MA',
      campus_section: 'Central',
      lat: '42.3509',
      lon: '-71.1089',
    },
    locationDetails: '2nd Floor – Ziskind Lounge',
    notes: '',
    duration: 30,
    foodArrived: admin.firestore.Timestamp.fromDate(
      new Date(now.getTime() - 30 * 60 * 1000),
    ),
    foodAvailable: admin.firestore.Timestamp.fromDate(
      new Date(now.getTime() - 10 * 60 * 1000),
    ),
    foods: [{ id: 'f1', item: 'Bagels', quantity: '12', unit: 'Portions' }],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  const event2Id = 'event_closed_1';
  await upsert('Events', event2Id, {
    host: 'Physics Dept',
    name: 'Leftover Pizza Night',
    Location: {
      name: 'Judson B. Coit Observatory',
      abbreviation: 'Observatory',
      address: '725 Commonwealth Avenue, Boston, MA',
      campus_section: 'Central',
      lat: '42.3502',
      lon: '-71.1058',
    },
    locationDetails: 'Roof access',
    notes: 'Bring your own plates.',
    duration: 30,
    foodArrived: admin.firestore.Timestamp.fromDate(
      new Date(now.getTime() - 90 * 60 * 1000),
    ),
    foodAvailable: admin.firestore.Timestamp.fromDate(
      new Date(now.getTime() - 60 * 60 * 1000),
    ),
    foods: [{ id: 'f1', item: 'Cheese Pizza', quantity: '5', unit: 'Trays' }],
    status: 'closed',
    images: [],
    reviewedBy: [],
  });

  // Reviews (nested): Reviews/{eventId}/Reviews/{reviewId}
  await db
    .collection('Reviews')
    .doc(event1Id)
    .collection('Reviews')
    .doc('r1')
    .set({
      id: 'r1',
      comment: 'Bagels were fresh!',
      date: admin.firestore.Timestamp.fromDate(now),
      images: [],
      shareContact: true,
      name: 'Student One',
      email: 'student@example.com',
    });

  console.log('✅ Seeded Users, Events (open+closed), and one Review.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
