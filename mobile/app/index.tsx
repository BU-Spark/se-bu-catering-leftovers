import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { firestore } from '../firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type AnyEvent = any;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<AnyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnyEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setErr(null);
    try {
      const q = query(
        collection(firestore, 'Events'),
        orderBy('foodAvailable', 'desc'),
      );
      const snap = await getDocs(q);
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchEvents();
      setLoading(false);
    })();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const openEvents = useMemo(
    () => events.filter((e) => e.status === 'open'),
    [events],
  );
  const sortedEvents = useMemo(() => {
    return [...openEvents].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? '')),
    );
  }, [openEvents]);

  const fmt = (value: any) => {
    if (!value) return 'Time TBD';
    try {
      const d =
        typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return 'Time TBD';
      const dPart = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const tPart = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${dPart} • ${tPart}`;
    } catch {
      return 'Time TBD';
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BU Catering</Text>
          <Text style={styles.subtitle}>Leftovers Made Easy</Text>
        </View>

        {err ? <Text style={styles.errorText}>Error: {err}</Text> : null}

        <Text style={styles.sectionTitle}>
          Open Events ({sortedEvents.length})
        </Text>

        {loading ? (
          <ActivityIndicator color="#7a3cff" style={styles.loadingIndicator} />
        ) : (
          <FlatList
            data={sortedEvents}
            keyExtractor={(e) => e.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={
              sortedEvents.length === 0 ? styles.emptyStateContainer : undefined
            }
            renderItem={({ item: event }) => {
              const location =
                event.Location?.name ?? event.locationDetails ?? 'Location TBD';
              const when = fmt(event.foodAvailable);
              return (
                <Pressable
                  onPress={() => setSelected(event)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && { opacity: 0.9 },
                  ]}
                  android_ripple={{ color: '#eee' }}
                >
                  <Text style={styles.cardTitle}>
                    {event.name?.trim() || 'Untitled Event'}
                  </Text>
                  <Text style={styles.cardMeta}>{when}</Text>
                  <Text style={styles.cardLocation}>{location}</Text>
                  {event.notes ? (
                    <Text numberOfLines={3} style={styles.cardNotes}>
                      {event.notes}
                    </Text>
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyStateText}>
                There are no open events right now.
              </Text>
            }
          />
        )}

        {/* Bottom sheet (Modal) */}
        <Modal
          animationType="slide"
          transparent
          visible={!!selected}
          onRequestClose={() => setSelected(null)}
        >
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setSelected(null)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.sheetTitle}>
                {selected?.name ?? 'Event Details'}
              </Text>
              <Text style={styles.sheetRow}>
                <Text style={styles.bold}>Status:</Text>{' '}
                {selected?.status ?? '—'}
              </Text>
              <Text style={styles.sheetRow}>
                <Text style={styles.bold}>When:</Text>{' '}
                {fmt(selected?.foodAvailable)}
              </Text>
              <Text style={styles.sheetRow}>
                <Text style={styles.bold}>Location:</Text>{' '}
                {selected?.Location?.name ?? selected?.locationDetails ?? '—'}
              </Text>
              {Array.isArray(selected?.foods) && selected!.foods.length > 0 && (
                <Text style={styles.sheetRow}>
                  <Text style={styles.bold}>Foods:</Text>{' '}
                  {selected!.foods.map((f: any) => f.item ?? 'item').join(', ')}
                </Text>
              )}
              {selected?.notes ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.bold}>Notes</Text>
                  <Text style={{ color: '#4a4a4a', marginTop: 4 }}>
                    {selected.notes}
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => setSelected(null)}
                style={styles.sheetButton}
              >
                <Text style={styles.sheetButtonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f5ff' },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: { alignItems: 'center', marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#29134e',
    letterSpacing: 1,
  },
  subtitle: { fontSize: 16, color: '#5b4d79', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#29134e',
    marginBottom: 12,
  },
  errorText: {
    color: '#d93025',
    borderWidth: 1,
    borderColor: '#f2b8b5',
    backgroundColor: '#fdecea',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1f1341',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#29134e',
    marginBottom: 6,
  },
  cardMeta: { color: '#6f6c7d', fontSize: 14, marginBottom: 4 },
  cardLocation: { fontSize: 15, color: '#352b52', marginBottom: 4 },
  cardNotes: { fontSize: 13, color: '#5b4d79' },
  emptyStateContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyStateText: { textAlign: 'center', color: '#6f6c7d', fontSize: 16 },
  loadingIndicator: { marginTop: 40 },

  // Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#29134e',
  },
  sheetRow: { marginTop: 6, color: '#424242' },
  bold: { fontWeight: '700', color: '#29134e' },
  sheetButton: {
    marginTop: 16,
    backgroundColor: '#7a3cff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetButtonText: { color: '#fff', fontWeight: '600' },
});
