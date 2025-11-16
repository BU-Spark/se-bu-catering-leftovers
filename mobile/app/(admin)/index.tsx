// app/(admin)/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '../../src/lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../../src/lib/theme';
import { useAllEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import { EventEditorModal } from '../../src/components/EventEditorModal';
import { router } from 'expo-router';
import type { Event } from '../../src/types';
import { updateEvent } from '../../src/lib/firebase/events';
import { notifyStudents } from '../../src/lib/notifications';
import SortDropdown, { SortOption } from '../../src/components/SortDropdown';
import { getExpiryMs } from '../../src/lib/time';

type TabType = 'open' | 'previous';

export default function AdminHomeScreen() {
  const { user } = useUser();
  const userRole = (user?.publicMetadata as any)?.role as string | undefined;
  const badgeLabel = userRole === 'staff' ? 'STAFF' : 'ADMIN';
  const { colors } = useTheme();
  const { events, loading, refresh } = useAllEvents();
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption | null>(null);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowEditor(true);
  };

  const handleSave = async (updates: Partial<Event>) => {
    if (!editingEvent?.id) return;
    const prevStatus = editingEvent.status;
    const nextStatus = updates.status ?? editingEvent.status;
    const becameOpen = prevStatus !== 'open' && nextStatus === 'open';

    try {
      await updateEvent(editingEvent.id, updates);

      if (becameOpen) {
        const name = (updates.name ?? editingEvent.name) || 'Event';
        const locBits = [
          updates.Location?.name ?? editingEvent.Location?.name,
          updates.Location?.address ?? editingEvent.Location?.address,
          updates.locationDetails ?? editingEvent.locationDetails,
        ].filter(Boolean) as string[];
        const loc = locBits.join(' • ') || 'BU Campus';
        await notifyStudents('New food available', `${name} • ${loc}`, {
          eventId: editingEvent.id,
        });
      }

      Alert.alert('Success', 'Event updated successfully');
      refresh();
      setShowEditor(false);
      setEditingEvent(null);
    } catch {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  // Filter events based on active tab
  const filteredEventsBase = events.filter((event) => {
    if (activeTab === 'open') {
      return event.status === 'open';
    } else {
      return (
        event.status === 'closed' ||
        event.status === 'drafted' ||
        event.status === 'saved'
      );
    }
  });

  const filteredEvents = React.useMemo(() => {
    if (!selectedSort) return filteredEventsBase;
    const withExpiry = filteredEventsBase.map((e) => ({
      e,
      expiry: getExpiryMs({
        foodAvailable: e.foodAvailable,
        duration: e.duration,
      }),
    }));
    const filtered = withExpiry.filter(
      (x) => typeof x.expiry === 'number' && x.expiry !== null,
    );
    filtered.sort((a, b) => {
      if (selectedSort === 'expiry-asc')
        return (a.expiry as number) - (b.expiry as number);
      return (b.expiry as number) - (a.expiry as number);
    });
    const missing = withExpiry.filter((x) => x.expiry === null);
    return [...filtered.map((x) => x.e), ...missing.map((x) => x.e)];
  }, [filteredEventsBase, selectedSort]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          padding: spacing.lg,
          paddingTop: spacing.xxl + 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        greeting: {
          ...typography.h4,
          color: colors.text.primary,
        },
        adminBadge: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: 4,
        },
        adminBadgeText: {
          ...typography.caption,
          color: colors.text.onPrimary,
          fontWeight: '700',
        },
        subtitle: {
          ...typography.bodySmall,
          color: colors.text.secondary,
          marginTop: spacing.xs,
        },
        tabContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          paddingRight: spacing.lg,
        },
        tabsLeft: {
          flexDirection: 'row',
          flex: 1,
        },
        tab: {
          flex: 1,
          paddingVertical: spacing.md,
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'transparent',
        },
        sortRight: {
          paddingLeft: spacing.md,
        },
        activeTab: {
          borderBottomColor: colors.primary,
        },
        tabText: {
          ...typography.body,
          color: colors.text.secondary,
          fontWeight: '600',
        },
        activeTabText: {
          color: colors.primary,
        },
        listContent: {
          padding: spacing.lg,
        },
        emptyState: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xxl * 2,
        },
        emptyText: {
          ...typography.h5,
          color: colors.text.secondary,
          textAlign: 'center',
        },
        emptySubtext: {
          ...typography.body,
          color: colors.text.secondary,
          textAlign: 'center',
          marginTop: spacing.sm,
        },
        adminCardWrapper: {
          position: 'relative',
        },
        statusBadge: {
          position: 'absolute',
          top: spacing.sm,
          right: spacing.sm,
          zIndex: 10,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
        },
        statusBadgeText: {
          ...typography.caption,
          color: colors.text.onPrimary,
          fontWeight: '700',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.greeting}>
              Welcome, {user?.firstName || 'Admin'}
            </Text>
            {userRole === 'admin' || userRole === 'staff' ? (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>Manage all events</Text>
        </View>
      </View>

      {/* Tabs + Sort */}
      <View style={styles.tabContainer}>
        <View style={styles.tabsLeft}>
          <Pressable
            style={[styles.tab, activeTab === 'open' && styles.activeTab]}
            onPress={() => setActiveTab('open')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'open' && styles.activeTabText,
              ]}
            >
              Open Events
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
            onPress={() => setActiveTab('previous')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'previous' && styles.activeTabText,
              ]}
            >
              Previous Events
            </Text>
          </Pressable>
        </View>
        <View style={styles.sortRight}>
          <SortDropdown
            currentSort={selectedSort ?? 'expiry-asc'}
            onSortChange={(s) => setSelectedSort(s)}
            buttonSize={28}
          />
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AdminEventCard event={item} onEdit={handleEdit} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading
                ? 'Loading events...'
                : activeTab === 'open'
                  ? 'No open events'
                  : 'No previous events'}
            </Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />

      <EventEditorModal
        visible={showEditor}
        event={editingEvent}
        onClose={() => {
          setShowEditor(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
      />
    </View>
  );
}

function AdminEventCard({
  event,
  onEdit,
}: {
  event: Event;
  onEdit: (event: Event) => void;
}) {
  const { colors } = useTheme();
  const statusColor =
    event.status === 'open'
      ? colors.success
      : event.status === 'closed'
        ? colors.text.secondary
        : event.status === 'drafted'
          ? colors.warning
          : colors.primary;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        adminCardWrapper: {
          position: 'relative',
        },
        statusBadge: {
          position: 'absolute',
          top: spacing.sm,
          right: spacing.sm,
          zIndex: 10,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
        },
        statusBadgeText: {
          ...typography.caption,
          color: colors.text.onPrimary,
          fontWeight: '700',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.adminCardWrapper}>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusBadgeText}>{event.status.toUpperCase()}</Text>
      </View>
      <EventCard event={event} isAdmin onEdit={onEdit} />
    </View>
  );
}
