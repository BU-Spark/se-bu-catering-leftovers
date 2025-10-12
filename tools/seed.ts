import * as admin from 'firebase-admin';

// Ensure we're connected to emulator
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('⚠️  FIRESTORE_EMULATOR_HOST not set');
  console.error('Run: export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
  process.exit(1);
}

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('⚠️  FIREBASE_AUTH_EMULATOR_HOST not set');
  console.error('Run: export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099');
  process.exit(1);
}

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'bu-catering-leftovers' });
}

const db = admin.firestore();
const auth = admin.auth();

async function upsert(col: string, id: string, data: Record<string, any>) {
  await db
    .collection(col)
    .doc(id)
    .set({ id, ...data }, { merge: true });
}

const now = new Date();
const ts = (d: Date) => admin.firestore.Timestamp.fromDate(d);

async function seed() {
  console.log('🌱 Seeding Firebase emulators...');

  // --- AUTH USERS ---
  console.log('\n📧 Creating Auth users...');

  try {
    await auth.createUser({
      uid: 'user_admin_1',
      email: 'admin@bu.edu',
      password: 'password123',
      displayName: 'Admin User',
    });
    console.log('  ✓ Created admin@bu.edu (password: password123)');
  } catch (e: any) {
    if (e.code === 'auth/uid-already-exists') {
      console.log('  - admin@bu.edu already exists');
    } else {
      throw e;
    }
  }

  try {
    await auth.createUser({
      uid: 'user_student_1',
      email: 'student@bu.edu',
      password: 'password123',
      displayName: 'Student User',
    });
    console.log('  ✓ Created student@bu.edu (password: password123)');
  } catch (e: any) {
    if (e.code === 'auth/uid-already-exists') {
      console.log('  - student@bu.edu already exists');
    } else {
      throw e;
    }
  }

  // --- FIRESTORE USERS ---
  console.log('\n👥 Creating Firestore user documents...');

  await upsert('Users', 'user_admin_1', {
    uid: 'user_admin_1',
    email: 'admin@bu.edu',
    name: 'Admin User',
    role: 'Admin',
    events: ['event_open_1', 'event_saved_1'],
    reviews: [],
    locPref: ['Central'],
    timePref: [],
    foodPref: [],
    agreedToTerms: true,
  });

  await upsert('Users', 'user_student_1', {
    uid: 'user_student_1',
    email: 'student@bu.edu',
    name: 'Student User',
    role: 'User',
    events: [],
    reviews: [],
    locPref: ['Central', 'East'],
    timePref: [],
    foodPref: ['vegetarian'],
    agreedToTerms: true,
  });

  // --- EVENTS ---
  // Open event happening now
  await upsert('Events', 'event_open_1', {
    host: 'BU Dining',
    name: 'Bagels & Coffee',
    Location: {
      name: 'George Sherman Union',
      abbreviation: 'GSU',
      address: '775 Commonwealth Avenue, Boston, MA',
      campus_section: 'Central',
      lat: '42.3509',
      lon: '-71.1089',
    },
    locationDetails: '2nd Floor – Ziskind Lounge',
    notes: 'Assorted bagels with cream cheese',
    duration: 30,
    foodArrived: ts(new Date(now.getTime() - 20 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() - 10 * 60 * 1000)),
    foods: [
      { id: 'f1', item: 'Plain Bagels', quantity: '12', unit: 'Pieces' },
      { id: 'f2', item: 'Everything Bagels', quantity: '8', unit: 'Pieces' },
      { id: 'f3', item: 'Coffee', quantity: '2', unit: 'Carafes' },
    ],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  // Open event starting soon
  await upsert('Events', 'event_open_2', {
    host: 'Questrom School of Business',
    name: 'Lunch Buffet Leftovers',
    Location: {
      name: 'Questrom School of Business',
      abbreviation: 'QST',
      address: '595 Commonwealth Ave, Boston, MA',
      campus_section: 'Central',
      lat: '42.3493',
      lon: '-71.1062',
    },
    locationDetails: 'Lobby near main entrance',
    notes: 'Veg and chicken options available',
    duration: 45,
    foodArrived: ts(new Date(now.getTime() - 5 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 15 * 60 * 1000)),
    foods: [
      { id: 'f1', item: 'Chicken Skewers', quantity: '20', unit: 'Pieces' },
      {
        id: 'f2',
        item: 'Vegetable Spring Rolls',
        quantity: '30',
        unit: 'Pieces',
      },
      { id: 'f3', item: 'Rice Bowls', quantity: '10', unit: 'Portions' },
    ],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  // Open event at Warren Towers
  await upsert('Events', 'event_open_3', {
    host: 'Student Housing',
    name: 'Pizza Party Leftovers',
    Location: {
      name: 'Warren Towers',
      abbreviation: 'WAR',
      address: '700 Commonwealth Ave, Boston, MA',
      campus_section: 'Central',
      lat: '42.3499',
      lon: '-71.1027',
    },
    locationDetails: 'Main lobby desk',
    notes: 'Cheese and pepperoni pizza',
    duration: 20,
    foodArrived: ts(new Date(now.getTime() - 15 * 60 * 1000)),
    foodAvailable: ts(now),
    foods: [
      { id: 'f1', item: 'Cheese Pizza', quantity: '3', unit: 'Boxes' },
      { id: 'f2', item: 'Pepperoni Pizza', quantity: '2', unit: 'Boxes' },
    ],
    status: 'open',
    images: [],
    reviewedBy: [],
  });

  // Closed event
  await upsert('Events', 'event_closed_1', {
    host: 'Physics Department',
    name: 'Research Seminar Snacks',
    Location: {
      name: 'Science & Engineering Complex',
      abbreviation: 'SEC',
      address: '665 Commonwealth Ave, Boston, MA',
      campus_section: 'East',
      lat: '42.3498',
      lon: '-71.0995',
    },
    locationDetails: 'Room 101',
    notes: 'Event concluded',
    duration: 30,
    foodArrived: ts(new Date(now.getTime() - 120 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() - 90 * 60 * 1000)),
    foods: [{ id: 'f1', item: 'Cookies', quantity: '30', unit: 'Pieces' }],
    status: 'closed',
    images: [],
    reviewedBy: [],
  });

  // Saved (draft) event
  await upsert('Events', 'event_saved_1', {
    host: 'Student Activities Office',
    name: 'Taco Tuesday Prep',
    Location: {
      name: 'GSU Student Activities',
      abbreviation: 'GSU',
      address: '775 Commonwealth Avenue, Boston, MA',
      campus_section: 'Central',
      lat: '42.3509',
      lon: '-71.1089',
    },
    locationDetails: 'Downstairs office',
    notes: 'Draft - not yet published',
    duration: 30,
    foodArrived: ts(new Date(now.getTime() + 60 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 90 * 60 * 1000)),
    foods: [{ id: 'f1', item: 'Taco Trays', quantity: '4', unit: 'Trays' }],
    status: 'saved',
    images: [],
    reviewedBy: [],
  });

  // Drafted event
  await upsert('Events', 'event_drafted_1', {
    host: 'Athletics',
    name: 'Post-Game Refreshments',
    Location: {
      name: 'FitRec Center',
      abbreviation: 'FIT',
      address: '915 Commonwealth Ave, Boston, MA',
      campus_section: 'West',
      lat: '42.3507',
      lon: '-71.1162',
    },
    locationDetails: 'Front desk area',
    notes: 'Testing draft status',
    duration: 15,
    foodArrived: ts(new Date(now.getTime() + 30 * 60 * 1000)),
    foodAvailable: ts(new Date(now.getTime() + 45 * 60 * 1000)),
    foods: [{ id: 'f1', item: 'Energy Bars', quantity: '50', unit: 'Pieces' }],
    status: 'drafted',
    images: [],
    reviewedBy: [],
  });

  // --- REVIEWS ---
  await db
    .collection('Reviews')
    .doc('event_open_1')
    .collection('Reviews')
    .doc('r1')
    .set({
      id: 'r1',
      comment: 'Great bagels! Well organized pickup.',
      date: ts(now),
      images: [],
      shareContact: true,
      name: 'Student User',
      email: 'student@bu.edu',
    });

  console.log('✅ Seeding complete!');
  console.log('\n📊 Summary:');
  console.log('   - 2 Auth Users (admin@bu.edu, student@bu.edu)');
  console.log('   - 2 Firestore User docs');
  console.log('   - 6 Events (3 Open, 1 Closed, 1 Saved, 1 Drafted)');
  console.log('   - 1 Review');
  console.log('\n🔐 Test credentials:');
  console.log('   Admin:   admin@bu.edu / password123');
  console.log('   Student: student@bu.edu / password123');
  console.log('');
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
