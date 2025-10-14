// src/components/StudentEventCard.tsx
import * as React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Text, Badge, useTheme } from 'react-native-paper';
import type { Event } from '../types';
import { getExpiryMs, tsToMs } from '../lib/time';
import { useCountdown } from '../hooks/useCountdown';

type Props = {
  event: Event;
  onPress?: () => void;
};

export function StudentEventCard({ event, onPress }: Props) {
  const theme = useTheme();

  const startMs = tsToMs(event.foodAvailable);
  const expiryMs = getExpiryMs(event);

  const beforeStart = startMs ? Date.now() < startMs : false;
  const target = beforeStart ? startMs! : (expiryMs ?? 0);

  const { minutes, seconds, hours, days, isElapsed } = useCountdown(target || null, 1000);

  // If elapsed, parent list should already be hiding this card—early return makes it extra safe.
  if (!target || isElapsed) return null;

  const hasImage = Array.isArray(event.images) && event.images.length > 0;
  const imageUrl = hasImage ? event.images[0] : undefined;

  const timerLabel = beforeStart
    ? (days > 0 ? `Starts in ${days}d ${hours}h` :
       hours > 0 ? `Starts in ${hours}h ${minutes}m` :
       `Starts in ${minutes}m ${seconds}s`)
    : (days > 0 ? `${days}d ${hours}h left` :
       hours > 0 ? `${hours}h ${minutes}m left` :
       `${minutes}m ${seconds}s left`);

  const statusColor = beforeStart ? theme.colors.secondary : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        marginBottom: 12,
      })}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: 12 }} />
      )}

      <View style={{ padding: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>
            {event.name || 'Leftover Food'}
          </Text>
          <Badge style={{ backgroundColor: statusColor, color: 'white' }}>
            {beforeStart ? 'Upcoming' : 'Live'}
          </Badge>
        </View>

        {event.Location?.name ? (
          <Text variant="bodyMedium" style={{ opacity: 0.75 }}>
            📍 {event.Location.abbreviation || event.Location.name}
          </Text>
        ) : null}

        <Text
          variant="bodyLarge"
          style={{ fontWeight: '600', color: statusColor }}
          accessibilityLabel="Countdown timer"
        >
          ⏱ {timerLabel}
        </Text>
      </View>
    </Pressable>
  );
}
