import * as admin from 'firebase-admin';

// Ensure we're connected to emulator
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('⚠️  FIRESTORE_EMULATOR_HOST not set');
  console.error('Run: export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
  process.exit(1);
}

// Initialize Firebase Admin
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
  console.log('🌱 Seeding Firebase emulators...');

  // --- EVENTS ---
  console.log('\n📅 Creating Events...');

  // TEST CASE 1: Open event - Just started (full duration remaining)
  // Timer should show full 30 minutes
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
    duration: 30, // 30 minutes duration
    foodArrived: ts(new Date(now.getTime() - 15 * 60 * 1000)), // Arrived 15 min ago
    foodAvailable: ts(now), // Available RIGHT NOW (just opened)
    foods: [
      { id: 'f1', item: 'Plain Bagels', quantity: '12', unit: 'pieces' },
      { id: 'f2', item: 'Everything Bagels', quantity: '8', unit: 'pieces' },
      { id: 'f3', item: 'Cream Cheese', quantity: '4', unit: 'containers' },
      { id: 'f4', item: 'Coffee', quantity: '2', unit: 'carafes' },
    ],
    status: 'open',
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    ],
    reviewedBy: [],
  });
  console.log('  ✓ event_open_1: Just started (30 min timer)');

  // TEST CASE 2: Open event - Started 10 minutes ago with 45 min duration
  // Timer should show 35 minutes remaining
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
    notes: 'Vegetarian and chicken options available. Come quick!',
    duration: 45, // 45 minutes duration
    foodArrived: ts(new Date(now.getTime() - 30 * 60 * 1000)), // Arrived 30 min ago
    foodAvailable: ts(new Date(now.getTime() - 10 * 60 * 1000)), // Available 10 min ago
    foods: [
      { id: 'f1', item: 'Chicken Skewers', quantity: '20', unit: 'pieces' },
      { id: 'f2', item: 'Vegetable Spring Rolls', quantity: '30', unit: 'pieces' },
      { id: 'f3', item: 'Rice Bowls', quantity: '10', unit: 'portions' },
      { id: 'f4', item: 'Salad', quantity: '15', unit: 'portions' },
    ],
    status: 'open',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    ],
    reviewedBy: [],
  });
  console.log('  ✓ event_open_2: Started 10 min ago (35 min remaining)');

  // TEST CASE 3: Open event - Short duration, almost expiring
  // Timer should show ~5 minutes remaining
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
    notes: 'Hurry! Almost gone!',
    duration: 20, // 20 minutes duration
    foodArrived: ts(new Date(now.getTime() - 30 * 60 * 1000)), // Arrived 30 min ago
    foodAvailable: ts(new Date(now.getTime() - 15 * 60 * 1000)), // Available 15 min ago
    foods: [
      { id: 'f1', item: 'Cheese Pizza', quantity: '3', unit: 'boxes' },
      { id: 'f2', item: 'Pepperoni Pizza', quantity: '2', unit: 'boxes' },
      { id: 'f3', item: 'Soda', quantity: '12', unit: 'cans' },
    ],
    status: 'open',
    images: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    ],
    reviewedBy: [],
  });
  console.log('  ✓ event_open_3: Almost expiring (5 min remaining)');

  // TEST CASE 4: Open event - Future start (available in 15 minutes)
  // Timer should NOT show yet (event not available)
  await upsert('Events', 'event_open_4', {
    host: 'Computer Science Department',
    name: 'CS Seminar Snacks',
    Location: {
      name: 'Science & Engineering Complex',
      abbreviation: 'SEC',
      address: '665 Commonwealth Ave, Boston, MA',
      campus_section: 'East',
      lat: '42.3498',
      lon: '-71.0995',
    },
    locationDetails: 'Room 101, First floor',
    notes: 'Event starts soon!',
    duration: 60, // 1 hour duration
    foodArrived: ts(now), // Just arrived now
    foodAvailable: ts(new Date(now.getTime() + 15 * 60 * 1000)), // Available in 15 minutes
    foods: [
      { id: 'f1', item: 'Cookies', quantity: '40', unit: 'pieces' },
      { id: 'f2', item: 'Brownies', quantity: '30', unit: 'pieces' },
      { id: 'f3', item: 'Fruit Platter', quantity: '2', unit: 'trays' },
    ],
    status: 'open',
    images: [
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
    ],
    reviewedBy: [],
  });
  console.log('  ✓ event_open_4: Future start (available in 15 min)');

  // TEST CASE 5: Closed event (should NOT show timer)
  await upsert('Events', 'event_closed_1', {
    host: 'Physics Department',
    name: 'Research Seminar Refreshments',
    Location: {
      name: 'Science & Engineering Complex',
      abbreviation: 'SEC',
      address: '665 Commonwealth Ave, Boston, MA',
      campus_section: 'East',
      lat: '42.3498',
      lon: '-71.0995',
    },
    locationDetails: 'Room 205',
    notes: 'Event concluded. Thanks to all who came!',
    duration: 30,
    foodArrived: ts(new Date(now.getTime() - 180 * 60 * 1000)), // 3 hours ago
    foodAvailable: ts(new Date(now.getTime() - 150 * 60 * 1000)), // 2.5 hours ago
    foods: [
      { id: 'f1', item: 'Cookies', quantity: '30', unit: 'pieces' },
      { id: 'f2', item: 'Coffee', quantity: '1', unit: 'carafe' },
    ],
    status: 'closed',
    images: [],
    reviewedBy: [],
  });
  console.log('  ✓ event_closed_1: Closed (no timer)');

  // TEST CASE 6: Saved event (should NOT show timer)
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
    duration: 40,
    foodArrived: ts(new Date(now.getTime() + 60 * 60 * 1000)), // 1 hour from now
    foodAvailable: ts(new Date(now.getTime() + 90 * 60 * 1000)), // 1.5 hours from now
    foods: [
      { id: 'f1', item: 'Taco Trays', quantity: '4', unit: 'trays' },
      { id: 'f2', item: 'Salsa', quantity: '3', unit: 'containers' },
      { id: 'f3', item: 'Guacamole', quantity: '2', unit: 'containers' },
    ],
    status: 'saved',
    images: [],
    reviewedBy: [],
  });
  console.log('  ✓ event_saved_1: Saved draft (no timer)');

  // TEST CASE 7: Drafted event (should NOT show timer)
  await upsert('Events', 'event_drafted_1', {
    host: 'Athletics Department',
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
    notes: 'Testing draft status - not visible to students',
    duration: 25,
    foodArrived: ts(new Date(now.getTime() + 120 * 60 * 1000)), // 2 hours from now
    foodAvailable: ts(new Date(now.getTime() + 135 * 60 * 1000)), // 2.25 hours from now
    foods: [
      { id: 'f1', item: 'Energy Bars', quantity: '50', unit: 'pieces' },
      { id: 'f2', item: 'Sports Drinks', quantity: '30', unit: 'bottles' },
    ],
    status: 'drafted',
    images: [],
    reviewedBy: [],
  });
  console.log('  ✓ event_drafted_1: Drafted (no timer)');

  // TEST CASE 8: Testing larger duration (3+ hours)
  // Food just arrived, available now, 180 min (3 hour) duration
  // This tests longer events and large timer values
  await upsert('Events', 'event_open_5', {
    host: 'Engineering Department',
    name: 'Engineering Career Fair Food',
    Location: {
      name: 'Photonics Center',
      abbreviation: 'PHO',
      address: '8 St. Mary\'s St, Boston, MA',
      campus_section: 'East',
      lat: '42.3496',
      lon: '-71.0988',
    },
    locationDetails: 'Ground floor lobby',
    notes: 'Lots of variety! All day event.',
    duration: 180, // 3 hours - testing large durations
    foodArrived: ts(new Date(now.getTime() - 10 * 60 * 1000)), // Arrived 10 min ago
    foodAvailable: ts(now), // Available RIGHT NOW
    foods: [
      { id: 'f1', item: 'Sandwich Platters', quantity: '5', unit: 'trays' },
      { id: 'f2', item: 'Chips', quantity: '20', unit: 'bags' },
      { id: 'f3', item: 'Cookies', quantity: '40', unit: 'pieces' },
      { id: 'f4', item: 'Soda', quantity: '24', unit: 'cans' },
    ],
    status: 'open',
    images: [
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',
    ],
    reviewedBy: [],
  });
  console.log('  ✓ event_open_5: Large duration test (3 hours)');

  // --- REVIEWS (optional, for testing review display) ---
  console.log('\n⭐ Creating sample reviews...');
  
  await db
    .collection('Reviews')
    .doc('event_closed_1')
    .collection('Reviews')
    .doc('r1')
    .set({
      id: 'r1',
      comment: 'Great cookies! Event was well organized.',
      date: ts(new Date(now.getTime() - 120 * 60 * 1000)),
      images: [],
      shareContact: true,
      name: 'Student User',
      email: 'student@bu.edu',
    });

  console.log('  ✓ Added review for event_closed_1');

  console.log('\n✅ Seeding complete!');
  console.log('\n📊 Summary:');
  console.log('   - 8 Events (5 Open, 1 Closed, 1 Saved, 1 Drafted)');
  console.log('   - 1 Sample review');
  console.log('');
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});