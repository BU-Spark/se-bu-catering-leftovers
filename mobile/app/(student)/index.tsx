// app/(student)/index.tsx
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing } from '../../src/lib/theme';
import { useOpenEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import { router } from 'expo-router';

export default function StudentHomeScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { events, loading, refresh } = useOpenEvents();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

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
        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  signOutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  signOutText: {
    ...typography.bodySmall,
    color: colors.text.onPrimary,
    fontWeight: '600',
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
});