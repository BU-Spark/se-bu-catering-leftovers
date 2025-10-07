import { useCallback, useEffect, useState } from 'react';
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
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { firestore } from '../firebase/config';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

type FoodItem = { id: string; item: string; quantity: string; unit: string };
type EventItem = {
  id?: string;
  host?: string;
  name?: string;
  status?: 'drafted' | 'saved' | 'open' | 'closed';
  Location?: { name?: string; address?: string; campus_section?: string };
  locationDetails?: string;
  notes?: string;
  duration?: number;
  foodArrived?: any;
  foodAvailable?: any;
  foods?: FoodItem[];
  images?: string[];
  reviewedBy?: string[];
};

export default function AdminEventsScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EventItem | null>(null);

  const fetchEvents = useCallback(async () => {
    setErr(null);
    const q = query(
      collection(firestore, 'Events'),
      orderBy('foodAvailable', 'desc'),
    );
    const snap = await getDocs(q);
    setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventItem));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchEvents();
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchEvents();
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvents]);

  const fmt = (value: any) => {
    if (!value) return 'TBD';
    try {
      const d =
        typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
      if (Number.isNaN(d.getTime())) return 'TBD';
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'TBD';
    }
  };

  const openEditor = (ev?: EventItem) => {
    const toIso = (v: any) => {
      if (!v) return '';
      const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
      return Number.isNaN(d.getTime())
        ? ''
        : new Date(d).toISOString().slice(0, 16);
    };
    setDraft({
      id: ev?.id,
      host: ev?.host ?? '',
      name: ev?.name ?? '',
      status: ev?.status ?? 'drafted',
      Location: {
        name: ev?.Location?.name ?? '',
        address: ev?.Location?.address ?? '',
        campus_section: ev?.Location?.campus_section ?? '',
      },
      locationDetails: ev?.locationDetails ?? '',
      notes: ev?.notes ?? '',
      duration: ev?.duration ?? 30,
      foodArrived: toIso(ev?.foodArrived),
      foodAvailable: toIso(ev?.foodAvailable),
      foods: ev?.foods ?? [{ id: '1', item: '', quantity: '', unit: 'Pieces' }],
      images: ev?.images ?? [],
      reviewedBy: ev?.reviewedBy ?? [],
    });
    setEditing(true);
  };

  const saveDraft = useCallback(async () => {
    if (!draft) return;
    try {
      setMutating(true);
      const data: any = {
        host: draft.host || 'Unknown',
        name: draft.name || 'Untitled',
        status: draft.status || 'drafted',
        Location: draft.Location,
        locationDetails: draft.locationDetails || '',
        notes: draft.notes || '',
        duration: Number(draft.duration) || 30,
        foodArrived: draft.foodArrived
          ? Timestamp.fromDate(new Date(draft.foodArrived))
          : null,
        foodAvailable: draft.foodAvailable
          ? Timestamp.fromDate(new Date(draft.foodAvailable))
          : null,
        foods: (draft.foods || []).filter((f) => f.item.trim()),
        images: draft.images || [],
        reviewedBy: draft.reviewedBy || [],
      };
      if (draft.id) {
        await updateDoc(doc(firestore, 'Events', draft.id), data);
      } else {
        await addDoc(collection(firestore, 'Events'), data);
      }
      setEditing(false);
      setSelected(null);
      await fetchEvents();
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setMutating(false);
    }
  }, [draft, fetchEvents]);

  const deleteEvent = useCallback(
    async (ev: EventItem) => {
      if (!ev?.id) return;
      try {
        setMutating(true);
        await deleteDoc(doc(firestore, 'Events', ev.id));
        setSelected(null);
        await fetchEvents();
      } catch (e: any) {
        setErr(e.message ?? String(e));
      } finally {
        setMutating(false);
      }
    },
    [fetchEvents],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage all events</Text>
        </View>
        {err && <Text style={styles.errorText}>{err}</Text>}
        {loading ? (
          <ActivityIndicator color="#7a3cff" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(e) => e.id!}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={
              events.length === 0
                ? { flexGrow: 1, justifyContent: 'center' }
                : undefined
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => setSelected(item)} style={styles.card}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.cardMeta}>
                  {item.host} • {fmt(item.foodAvailable)}
                </Text>
                <Text style={styles.cardLocation}>{item.Location?.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999' }}>
                No events yet
              </Text>
            }
          />
        )}

        <Pressable onPress={() => openEditor()} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>

        {/* Detail Sheet */}
        <Modal
          visible={!!selected && !editing}
          animationType="slide"
          transparent
          onRequestClose={() => setSelected(null)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setSelected(null)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <ScrollView>
              <Text style={styles.sheetTitle}>{selected?.name}</Text>
              <InfoRow label="Host" value={selected?.host} />
              <InfoRow label="Status" value={selected?.status} />
              <InfoRow label="Location" value={selected?.Location?.name} />
              <InfoRow label="Details" value={selected?.locationDetails} />
              <InfoRow label="Available" value={fmt(selected?.foodAvailable)} />
              <InfoRow label="Arrived" value={fmt(selected?.foodArrived)} />
              <InfoRow label="Duration" value={`${selected?.duration} min`} />
              <InfoRow label="Notes" value={selected?.notes} />
              <View style={{ marginTop: 12 }}>
                <Text style={styles.bold}>Food Items</Text>
                {selected?.foods?.map((f) => (
                  <Text key={f.id} style={{ marginTop: 4 }}>
                    • {f.item} ({f.quantity} {f.unit})
                  </Text>
                ))}
              </View>
              <View style={{ marginTop: 16, gap: 10 }}>
                <Pressable
                  onPress={() => openEditor(selected!)}
                  style={[styles.btn, { backgroundColor: '#2952e3' }]}
                >
                  <Text style={styles.btnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteEvent(selected!)}
                  disabled={mutating}
                  style={[styles.btn, { backgroundColor: '#d93025' }]}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelected(null)}
                  style={[styles.btn, { backgroundColor: '#666' }]}
                >
                  <Text style={styles.btnText}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Edit/Create Modal */}
        <Modal
          visible={editing}
          animationType="slide"
          transparent
          onRequestClose={() => setEditing(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <Pressable
              style={styles.backdrop}
              onPress={() => setEditing(false)}
            />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.handle} />
              <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.sheetTitle}>
                  {draft?.id ? 'Edit Event' : 'New Event'}
                </Text>
                <Input
                  label="Host"
                  value={draft?.host}
                  onChangeText={(t) => setDraft((d) => ({ ...d!, host: t }))}
                />
                <Input
                  label="Event Name"
                  value={draft?.name}
                  onChangeText={(t) => setDraft((d) => ({ ...d!, name: t }))}
                />
                <Input
                  label="Location Name"
                  value={draft?.Location?.name}
                  onChangeText={(t) =>
                    setDraft((d) => ({
                      ...d!,
                      Location: { ...d!.Location, name: t },
                    }))
                  }
                />
                <Input
                  label="Location Address"
                  value={draft?.Location?.address}
                  onChangeText={(t) =>
                    setDraft((d) => ({
                      ...d!,
                      Location: { ...d!.Location, address: t },
                    }))
                  }
                />
                <Input
                  label="Campus Section"
                  value={draft?.Location?.campus_section}
                  onChangeText={(t) =>
                    setDraft((d) => ({
                      ...d!,
                      Location: { ...d!.Location, campus_section: t },
                    }))
                  }
                />
                <Input
                  label="Location Details"
                  value={draft?.locationDetails}
                  onChangeText={(t) =>
                    setDraft((d) => ({ ...d!, locationDetails: t }))
                  }
                />
                <Input
                  label="Food Arrived (ISO)"
                  value={draft?.foodArrived}
                  onChangeText={(t) =>
                    setDraft((d) => ({ ...d!, foodArrived: t }))
                  }
                />
                <Input
                  label="Food Available (ISO)"
                  value={draft?.foodAvailable}
                  onChangeText={(t) =>
                    setDraft((d) => ({ ...d!, foodAvailable: t }))
                  }
                />
                <Input
                  label="Duration (min)"
                  value={String(draft?.duration ?? '')}
                  onChangeText={(t) =>
                    setDraft((d) => ({ ...d!, duration: parseInt(t) || 30 }))
                  }
                />
                <Input
                  label="Notes"
                  value={draft?.notes}
                  onChangeText={(t) => setDraft((d) => ({ ...d!, notes: t }))}
                  multiline
                />

                <Text
                  style={{ fontWeight: '700', marginTop: 12, marginBottom: 6 }}
                >
                  Status
                </Text>
                <View
                  style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}
                >
                  {['drafted', 'saved', 'open', 'closed'].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() =>
                        setDraft((d) => ({ ...d!, status: s as any }))
                      }
                      style={[
                        styles.chip,
                        draft?.status === s && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft?.status === s && styles.chipTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text
                  style={{ fontWeight: '700', marginTop: 12, marginBottom: 6 }}
                >
                  Food Items
                </Text>
                {draft?.foods?.map((f, i) => (
                  <View
                    key={f.id}
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      backgroundColor: '#f9f9f9',
                      borderRadius: 8,
                    }}
                  >
                    <Input
                      label="Item"
                      value={f.item}
                      onChangeText={(t) =>
                        setDraft((d) => {
                          const updated = [...d!.foods!];
                          updated[i].item = t;
                          return { ...d!, foods: updated };
                        })
                      }
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label="Qty"
                          value={f.quantity}
                          onChangeText={(t) =>
                            setDraft((d) => {
                              const updated = [...d!.foods!];
                              updated[i].quantity = t;
                              return { ...d!, foods: updated };
                            })
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          label="Unit"
                          value={f.unit}
                          onChangeText={(t) =>
                            setDraft((d) => {
                              const updated = [...d!.foods!];
                              updated[i].unit = t;
                              return { ...d!, foods: updated };
                            })
                          }
                        />
                      </View>
                    </View>
                    <Pressable
                      onPress={() =>
                        setDraft((d) => ({
                          ...d!,
                          foods: d!.foods!.filter((_, idx) => idx !== i),
                        }))
                      }
                      style={{ marginTop: 4 }}
                    >
                      <Text style={{ color: '#d93025', fontSize: 12 }}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={() =>
                    setDraft((d) => ({
                      ...d!,
                      foods: [
                        ...d!.foods!,
                        {
                          id: Date.now().toString(),
                          item: '',
                          quantity: '',
                          unit: 'Pieces',
                        },
                      ],
                    }))
                  }
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: '#2952e3', fontWeight: '600' }}>
                    + Add Food Item
                  </Text>
                </Pressable>

                <View style={{ marginTop: 16, gap: 10 }}>
                  <Pressable
                    onPress={saveDraft}
                    disabled={mutating}
                    style={[styles.btn, { backgroundColor: '#0b8457' }]}
                  >
                    <Text style={styles.btnText}>Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditing(false)}
                    style={[styles.btn, { backgroundColor: '#666' }]}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    open: '#0b8457',
    closed: '#999',
    drafted: '#f59e0b',
    saved: '#2952e3',
  };
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: colors[status || 'drafted'] || '#999',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
        {status || 'draft'}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: any }) {
  if (!value) return null;
  return (
    <Text style={{ marginTop: 6 }}>
      <Text style={styles.bold}>{label}:</Text> {value}
    </Text>
  );
}

function Input({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value?: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: '700', marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value || ''}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 8,
          backgroundColor: '#fff',
          minHeight: multiline ? 60 : undefined,
        }}
      />
    </View>
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
  title: { fontSize: 28, fontWeight: '700', color: '#29134e' },
  subtitle: { fontSize: 16, color: '#5b4d79', marginTop: 4 },
  errorText: {
    color: '#d93025',
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
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#29134e', flex: 1 },
  cardMeta: { color: '#6f6c7d', fontSize: 14, marginTop: 4 },
  cardLocation: { fontSize: 15, color: '#352b52', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7a3cff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#29134e',
  },
  bold: { fontWeight: '700', color: '#29134e' },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: { backgroundColor: '#7a3cff', borderColor: '#7a3cff' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
});
