// app/(student)/index.tsx
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '../../src/lib/ThemeProvider';
import { typography, spacing } from '../../src/lib/theme';
import { useOpenEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import React from 'react';
import SortDropdown, { SortOption } from '../../src/components/SortDropdown';
import LocationFilterDropdown, { LocationFilterOption } from '../../src/components/LocationFilterDropdown';
import { getExpiryMs } from '../../src/lib/time';
import { PRESET_LOCATIONS } from '../../src/lib/constants';

export default function StudentHomeScreen() {
  const { user } = useUser();
  const { colors } = useTheme();
  const { events, loading, refresh } = useOpenEvents();
  const [sort, setSort] = React.useState<SortOption>('expiry-asc');
  const [selectedLocations, setSelectedLocations] = React.useState<Set<LocationFilterOption>>(new Set());

  // Get preset location names for matching
  const presetLocationNames = React.useMemo(
    () => new Set(PRESET_LOCATIONS.map((p) => p.name)),
    []
  );

  const filteredAndSortedEvents = React.useMemo(() => {
    // First, filter by location if any locations are selected
    let filtered = events;
    if (selectedLocations.size > 0) {
      filtered = events.filter((event) => {
        const eventLocationName = event.Location?.name || '';
        const isPresetLocation = presetLocationNames.has(eventLocationName);

        // Check if event matches any selected location
        for (const selectedLocation of selectedLocations) {
          if (selectedLocation === 'other') {
            // Match "other" if location doesn't match any preset
            if (!isPresetLocation) {
              return true;
            }
          } else {
            // Match preset location by exact name match
            if (eventLocationName === selectedLocation) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Then sort by expiry
    const withExpiry = filtered.map((e) => ({
      e,
      expiry: getExpiryMs({ foodAvailable: e.foodAvailable, duration: e.duration }),
    }));
    const expiryFiltered = withExpiry.filter(
      (x) => typeof x.expiry === 'number' && x.expiry !== null
    );
    expiryFiltered.sort((a, b) => {
      if (sort === 'expiry-asc') return (a.expiry as number) - (b.expiry as number);
      return (b.expiry as number) - (a.expiry as number);
    });
    const missing = withExpiry.filter((x) => x.expiry === null);
    return [...expiryFiltered.map((x) => x.e), ...missing.map((x) => x.e)];
  }, [events, sort, selectedLocations, presetLocationNames]);

  const styles = React.useMemo(() => StyleSheet.create({
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
    greeting: {
      ...typography.h4,
      color: colors.text.primary,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      marginTop: spacing.xs,
    },
    sortRow: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    filterButton: {
      marginRight: spacing.sm,
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
  }), [colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName || 'Student'}!
          </Text>
          <Text style={styles.subtitle}>Browse available food events</Text>
        </View>
      </View>

      {/* Sort and Filter controls under header */}
      <View style={styles.sortRow}>
        <View style={styles.filterButton}>
          <LocationFilterDropdown
            selectedLocations={selectedLocations}
            onLocationChange={setSelectedLocations}
          />
        </View>
        <SortDropdown currentSort={sort} onSortChange={setSort} />
      </View>

      {/* Events List */}
      <FlatList
        data={filteredAndSortedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
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
              {loading ? 'Loading events...' : 'No open events right now'}
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
            </Text>
          </View>
        }
      />
    </View>
  );
}