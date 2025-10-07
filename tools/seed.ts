import * as admin from 'firebase-admin';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('⚠️ FIRESTORE_EMULATOR_HOST not set; aborting.');
  process.exit(1);
}
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'bu-catering-leftovers' });
}
const db = admin.firestore();

async function upsert(col: string, id: string, data: Record<string, any>) {
  await db
    .collection(col)
    .doc(id)
    .set({ id, ...data }, { merge: true });
}

const now = new Date();
const ts = (d: Date) => admin.firestore.Timestamp.fromDate(d);

async function seed() {
  // --- Users ---
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
    createdAt: ts(now),
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
    createdAt: ts(now),
  });

  // --- Events ---
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
    foodArrived: ts(new Date(now.getTime() - 30 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() - 10 * 60 * 1000)),
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
    foodArrived: ts(new Date(now.getTime() - 90 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() - 60 * 60 * 1000)),
    foods: [{ id: 'f1', item: 'Cheese Pizza', quantity: '5', unit: 'Trays' }],
    status: 'closed',
    images: [],
    reviewedBy: [],
  });

  await upsert('Events', 'event_open_2', {
    host: 'Questrom',
    name: 'Dumplings Drop',
    Location: {
      name: 'Questrom School of Business',
      abbreviation: 'QST',
      address: '595 Commonwealth Ave, Boston, MA',
      campus_section: 'Central',
      lat: '42.3493',
      lon: '-71.1062',
    },
    locationDetails: 'Atrium',
    notes: 'Veg + chicken options.',
    duration: 45,
    foodArrived: ts(new Date(now.getTime() - 5 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 25 * 60 * 1000)), // soon
    foods: [
      { id: 'f1', item: 'Pork Dumplings', quantity: '40', unit: 'Pieces' },
      { id: 'f2', item: 'Veg Dumplings', quantity: '30', unit: 'Pieces' },
    ],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  await upsert('Events', 'event_open_3', {
    host: 'Housing',
    name: 'Sandwiches @ Warren',
    Location: {
      name: 'Warren Towers',
      abbreviation: 'WAR',
      address: '700 Commonwealth Ave, Boston, MA',
      campus_section: 'Central',
      lat: '42.3499',
      lon: '-71.1027',
    },
    locationDetails: 'Lobby',
    notes: 'Gluten-free available.',
    duration: 20,
    foodArrived: ts(new Date(now.getTime() - 8 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 5 * 60 * 1000)),
    foods: [
      { id: 'f1', item: 'Turkey Sandwich', quantity: '10', unit: 'Pieces' },
      { id: 'f2', item: 'Veg Sandwich', quantity: '6', unit: 'Pieces' },
    ],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  await upsert('Events', 'event_saved_1', {
    host: 'Student Gov',
    name: 'Taco Trays',
    Location: {
      name: 'GSU Alley',
      abbreviation: 'GSU',
      address: '775 Commonwealth Avenue, Boston, MA',
      campus_section: 'Central',
      lat: '42.3509',
      lon: '-71.1089',
    },
    locationDetails: 'Downstairs',
    notes: 'Draft only; not visible to students.',
    duration: 30,
    foodArrived: ts(new Date(now.getTime() + 60 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 90 * 60 * 1000)),
    foods: [{ id: 'f1', item: 'Taco Tray', quantity: '4', unit: 'Trays' }],
    status: 'saved',
    images: [],
    reviewedBy: [],
  });

  await upsert('Events', 'event_drafted_1', {
    host: 'Athletics',
    name: 'Protein Shakes',
    Location: {
      name: 'FitRec',
      abbreviation: 'FIT',
      address: '915 Commonwealth Ave, Boston, MA',
      campus_section: 'West',
      lat: '42.3507',
      lon: '-71.1162',
    },
    locationDetails: 'Front desk',
    notes: 'Internal testing.',
    duration: 15,
    foodArrived: ts(new Date(now.getTime() + 30 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 40 * 60 * 1000)),
    foods: [
      { id: 'f1', item: 'Chocolate Shake', quantity: '12', unit: 'Bottles' },
    ],
    status: 'drafted',
    images: [],
    reviewedBy: [],
  });

  // --- Reviews (nested) ---
  await db
    .collection('Reviews')
    .doc(event1Id)
    .collection('Reviews')
    .doc('r1')
    .set({
      id: 'r1',
      comment: 'Bagels were fresh!',
      date: ts(now),
      images: [],
      shareContact: true,
      name: 'Student One',
      email: 'student@example.com',
    });

  console.log(
    '✅ Seeded Users + 5 Events (3 open, 1 closed, 1 saved, 1 drafted) + 1 Review.',
  );
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
