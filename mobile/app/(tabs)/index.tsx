import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { firestore } from '../../firebase/config'; // adjust path
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';

type Food = { id?: string; item?: string; quantity?: string | number; unit?: string };
type Loc  = { name?: string; abbreviation?: string; address?: string; campus_section?: string; lat?: string | number; lon?: string | number };
type EventDoc = {
  id: string;
  host?: string;
  name?: string;
  Location?: Loc;
  locationDetails?: string;
  notes?: string;
  duration?: number | string;
  foodArrived?: Timestamp;
  foodAvailable?: Timestamp;
  foods?: Food[];
  status?: 'drafted'|'saved'|'open'|'closed'|string;
  images?: string[];
  reviewedBy?: string[];
};

function fmt(ts?: Timestamp) {
  return ts ? ts.toDate().toLocaleString() : '—';
}

export default function HomeScreen() {
  const extra = Constants.expoConfig?.extra as any;
  const projectId = extra?.firebase?.projectId ?? 'NO_PROJECT_ID';

  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  const [rows, setRows] = useState<EventDoc[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Order by foodAvailable desc (no composite index needed if we filter status client-side)
        const q = query(collection(firestore, 'Events'), orderBy('foodAvailable', 'desc'));
        const snap = await getDocs(q);
        const events = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as EventDoc[];
        if (!mounted) return;
        setRows(events);
        setStatus('ok');
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? String(e));
        setStatus('error');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter to open events per your spec
  const openEvents = useMemo(() => rows.filter(e => e.status === 'open'), [rows]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BU CATERING</Text>
      <Text style={styles.subtitle}>Leftovers made easy.</Text>
      <Text style={{ marginTop: 12 }}>Project: {projectId}</Text>

      {status === 'loading' && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Connecting to Firestore…</Text>
        </View>
      )}

      {status === 'error' && (
        <Text style={{ marginTop: 16, color: '#c00', textAlign: 'center' }}>
          Error: {err}
        </Text>
      )}

      {status === 'ok' && (
        <View style={{ marginTop: 16, width: '100%', paddingHorizontal: 24 }}>
          <Text style={{ marginBottom: 8 }}>Open events: {openEvents.length}</Text>
          <FlatList
            data={openEvents}
            keyExtractor={(e) => e.id}
            renderItem={({ item: e }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{e.name ?? '(untitled event)'}</Text>
                <Text>Location: {e.Location?.name ?? e.locationDetails ?? '—'}</Text>
                <Text>Food available: {fmt(e.foodAvailable)}</Text>
                {!!e.foods?.length && (
                  <Text>Foods: {e.foods.map(f => f.item ?? 'item').join(', ')}</Text>
                )}
                <Text>Status: {e.status ?? '—'}</Text>
              </View>
            )}
            ListEmptyComponent={<Text>No open events — set one event’s status to "open".</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: 2 },
  subtitle: { marginTop: 12, fontSize: 16, textAlign: 'center', color: '#666' },
  card: { padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 12, backgroundColor: '#fafafa' },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
});
