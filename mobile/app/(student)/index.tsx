// app/(student)/index.tsx
import * as React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, IconButton, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useEvents } from '../../src/hooks/useEvents';
import { ExpandableEventCard } from '../../src/components/ExpandableEventCard';
import { spacing } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function StudentFeed() {
  const { events, loading, error, loadEvents, refresh } = useEvents(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedEventId, setExpandedEventId] = React.useState<string | null>(null);
  const theme = useTheme();
  const { logout } = useAuth();

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
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
        paddingVertical: spacing.md 
      }}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
            Available Catering
          </Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
            Find free food on campus
          </Text>
        </View>
        <IconButton 
          icon="logout" 
          size={24} 
          onPress={handleLogout}
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
      ) : events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
          <Text style={{ fontSize: 56, lineHeight: 64, marginBottom: spacing.md }}>
            🍽️
          </Text>
          <Text
            variant="bodyLarge"
            style={{ textAlign: 'center', opacity: 0.7 }}
          >
            No events available right now.{'\n'}Pull down to refresh!
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {events.map(event => (
            <ExpandableEventCard
              key={event.id}
              event={event}
              isAdmin={false}
              isExpanded={expandedEventId === event.id}
              onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}