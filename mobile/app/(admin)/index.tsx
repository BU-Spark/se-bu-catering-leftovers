// app/(admin)/index.tsx
import * as React from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, FAB, IconButton, useTheme, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useEvents } from '../../src/hooks/useEvents';
import { createEvent, updateEvent, deleteEvent } from '../../src/lib/firebase/events';
import { ExpandableEventCard } from '../../src/components/ExpandableEventCard';
import { EventEditorModal } from '../../src/components/EventEditorModal';
import { timestampToISO } from '../../src/lib/utils';
import type { Event } from '../../src/types';
import { spacing } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminDashboard() {
  const { events, loading, error, loadEvents, refresh } = useEvents(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const [expandedEventId, setExpandedEventId] = React.useState<string | null>(null);
  const [editingEvent, setEditingEvent] = React.useState<Partial<Event> | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [filterView, setFilterView] = React.useState<'active' | 'closed'>('active');
  const theme = useTheme();
  const { logout, user } = useAuth();

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = React.useMemo(() => {
    if (filterView === 'closed') {
      return events.filter(e => e.status === 'closed');
    }
    return events.filter(e => e.status !== 'closed');
  }, [events, filterView]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateNew = () => {
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
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save event');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.name}"?`,
      [
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
      ]
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md 
      }}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
            Admin Dashboard
          </Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
            Manage catering events
          </Text>
        </View>
        <IconButton 
          icon="logout" 
          size={24} 
          onPress={handleLogout}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <SegmentedButtons
          value={filterView}
          onValueChange={(value) => setFilterView(value as 'active' | 'closed')}
          buttons={[
            {
              value: 'active',
              label: 'Active',
            },
            {
              value: 'closed',
              label: 'Past Events',
            },
          ]}
        />
      </View>

      {error && (
        <View style={{ 
          backgroundColor: theme.colors.errorContainer, 
          padding: spacing.md,
          margin: spacing.lg,
          borderRadius: 8 
        }}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      )}

      {loading && events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredEvents.map(event => (
            <ExpandableEventCard
              key={event.id}
              event={event}
              isAdmin
              isExpanded={expandedEventId === event.id}
              onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
              onEdit={() => handleEdit(event)}
              onDelete={() => handleDelete(event)}
            />
          ))}
        </ScrollView>
      )}

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
        }}
        onSave={handleSave}
        loading={mutating}
      />
    </SafeAreaView>
  );
}