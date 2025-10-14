import * as React from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  ActivityIndicator,
  FAB,
  IconButton,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useEvents } from '../../src/hooks/useEvents';
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../src/lib/firebase/events';
import { ExpandableEventCard } from '../../src/components/ExpandableEventCard';
import { EventEditorModal } from '../../src/components/EventEditorModal';
import { timestampToISO } from '../../src/lib/utils';
import type { Event } from '../../src/types';
import { spacing } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getExpiryMs } from '../../src/lib/time';

export default function AdminDashboard() {
  const { events, loading, error, loadEvents, refresh } = useEvents(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const [expandedEventId, setExpandedEventId] = React.useState<string | null>(
    null,
  );
  const [editingEvent, setEditingEvent] =
    React.useState<Partial<Event> | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [currentDraft, setCurrentDraft] =
    React.useState<Partial<Event> | null>(null);
  const [filterView, setFilterView] =
    React.useState<'active' | 'closed'>('active');
  const theme = useTheme();
  const { logout, user } = useAuth();

  // Load events initially
  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 🕒 Add 1-minute buffer to avoid “on-the-minute” invisible events
  const BUFFER_MS = 60_000;

  // ✅ Filter active vs closed events, handling time boundaries safely
  const filteredEvents = React.useMemo(() => {
    const now = Date.now();

    if (filterView === 'closed') {
      // Past events = manually closed OR expired
      return events.filter((e) => {
        const expiry = getExpiryMs(e);
        return e.status === 'closed' || (expiry && expiry < now - BUFFER_MS);
      });
    }

    // Active = not closed & not expired (with buffer)
    return events.filter((e) => {
      const expiry = getExpiryMs(e);
      return e.status !== 'closed' && (!expiry || expiry > now - BUFFER_MS);
    });
  }, [events, filterView]);

  // 🔁 Auto-close expired “open” events
  React.useEffect(() => {
    const now = Date.now();

    events.forEach(async (e) => {
      const expiry = getExpiryMs(e);

      // Only close if open + expired (beyond buffer)
      if (expiry && expiry < now - BUFFER_MS && e.status === 'open') {
        try {
          console.log(`⚙️ Auto-closing event ${e.id}:`, e.name);
          await updateEvent(e.id, { status: 'closed' });
          console.log(`✅ Event ${e.name} marked as closed`);
          await refresh(); // refresh after auto-close
        } catch (err) {
          console.error('❌ Auto-close failed for', e.id, err);
        }
      }
    });
  }, [events]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateNew = () => {
    console.log('🆕 Creating new draft event...');
    setEditingEvent({
      host: '',
      name: '',
      status: 'drafted',
      Location: {
        name: '',
        address: '',
        abbreviation: '',
        lat: '',
        lon: '',
        campus_section: '',
      },
      locationDetails: '',
      notes: '',
      duration: 30,
      foodArrived: '',
      foodAvailable: '',
      foods: [{ id: '1', item: '', quantity: '', unit: 'Pieces' }],
      images: [],
      reviewedBy: [],
    });
    setShowEditor(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent({
      ...event,
      foodArrived: timestampToISO(event.foodArrived),
      foodAvailable: timestampToISO(event.foodAvailable),
    });
    setShowEditor(true);
  };

  const handleSave = async (eventData: Partial<Event>) => {
    console.log('💾 handleSave called with:', eventData);
    setMutating(true);
    try {
      if (eventData.id) {
        await updateEvent(eventData.id, eventData);
      } else {
        await createEvent({ ...eventData, creatorUid: user?.uid });
      }
      await refresh();
      setShowEditor(false);
      setEditingEvent(null);
      setCurrentDraft(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save event');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (event: Event) => {
    Alert.alert('Delete Event', `Delete "${event.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setMutating(true);
          try {
            await deleteEvent(event.id, { ownerUid: user?.uid });
            setExpandedEventId(null);
            await refresh();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete event');
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
            Admin Dashboard
          </Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
            Manage catering events
          </Text>
        </View>
        <IconButton icon="logout" size={24} onPress={handleLogout} />
      </View>

      {/* Segmented Filter */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <SegmentedButtons
          value={filterView}
          onValueChange={(value) =>
            setFilterView(value as 'active' | 'closed')
          }
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'closed', label: 'Past Events' },
          ]}
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View
          style={{
            backgroundColor: theme.colors.errorContainer,
            padding: spacing.md,
            margin: spacing.lg,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      )}

      {/* Main Content */}
      {loading && events.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator animating size="large" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 56, lineHeight: 64, marginBottom: spacing.md }}>
            📋
          </Text>
          <Text
            variant="bodyLarge"
            style={{ textAlign: 'center', opacity: 0.7 }}
          >
            {filterView === 'closed'
              ? 'No past events yet.'
              : 'No active events.\nCreate one to get started!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {filteredEvents.map((event) => (
            <ExpandableEventCard
              key={event.id}
              event={event}
              isAdmin
              isExpanded={expandedEventId === event.id}
              onToggle={() =>
                setExpandedEventId(
                  expandedEventId === event.id ? null : event.id,
                )
              }
              onEdit={() => handleEdit(event)}
              onDelete={() => handleDelete(event)}
            />
          ))}
        </ScrollView>
      )}

      {/* Floating Action Buttons */}
      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.xl,
          backgroundColor: theme.colors.primary,
        }}
        onPress={handleCreateNew}
      />

      <EventEditorModal
        event={editingEvent}
        visible={showEditor}
        onDismiss={() => {
          setShowEditor(false);
          setEditingEvent(null);
          setCurrentDraft(null);
        }}
        onSave={handleSave}
        loading={mutating}
        onDraftChange={(d) => setCurrentDraft(d)}
      />

      {showEditor && (
        <FAB
          icon="content-save"
          style={{
            position: 'absolute',
            right: spacing.lg,
            bottom: spacing.xl * 3.2,
            backgroundColor: theme.colors.primary,
          }}
          loading={mutating}
          onPress={() => currentDraft && handleSave(currentDraft)}
          disabled={!currentDraft || mutating}
        />
      )}
    </SafeAreaView>
  );
}
