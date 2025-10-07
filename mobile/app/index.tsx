import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { firestore } from '../firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(firestore, 'Events'),
          orderBy('foodAvailable', 'desc'),
        );
        const snap = await getDocs(q);
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e: any) {
        setErr(e.message ?? String(e));
      }
    })();
  }, []);

  const openEvents = events.filter((e) => e.status === 'open');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BU CATERING</Text>
      {err ? <Text style={{ color: '#c00' }}>Error: {err}</Text> : null}
      <Text style={{ marginVertical: 8 }}>
        Open events: {openEvents.length}
      </Text>
      <FlatList
        data={openEvents}
        keyExtractor={(e) => e.id}
        renderItem={({ item: e }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{e.name ?? '(untitled)'}</Text>
            <Text>
              Location: {e.Location?.name ?? e.locationDetails ?? '—'}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>No open events.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  card: { padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
});
