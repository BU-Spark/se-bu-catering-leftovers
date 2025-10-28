// src/components/EventCard.tsx
import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../lib/theme';
import { formatTimestamp } from '../lib/utils';
import { tsToMs } from '../lib/time';
import { useCountdown } from '../hooks/useCountdown';
import type { Event } from '../types';
import { useRouter } from "expo-router";

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  isAdmin?: boolean;
  onEdit?: (event: Event) => void;
}

export function EventCard({ event, onPress, isAdmin = false, onEdit }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // Timer should ONLY show for open events and ONLY depend on duration
  const shouldShowCountdown = event.status === 'open';

  // Calculate expiry based ONLY on duration (in minutes)
  const durationMs = (event.duration ?? 30) * 60 * 1000;
  const startMs = tsToMs(event.foodAvailable);
  const expiryMs = startMs ? startMs + durationMs : null;

  // Pass null if shouldn't show countdown to ensure hook resets
  const { remainingMs, hours, minutes, seconds, isElapsed } = useCountdown(
    shouldShowCountdown && expiryMs ? expiryMs : null
  );

  const toggleExpand = () => {
    setExpanded(!expanded);
    onPress?.();
  };

  // Calculate progress for countdown bar
  const progress = React.useMemo(() => {
    if (!shouldShowCountdown || !expiryMs || !startMs || !(remainingMs > 0)) return 0;
    const totalDurationMs = (event.duration ?? 30) * 60 * 1000;
    if (totalDurationMs <= 0) return 0;
    return Math.max(0, Math.min(1, remainingMs / totalDurationMs));
  }, [shouldShowCountdown, remainingMs, expiryMs, startMs, event.duration, event.name]);

  // Auto-close event when timer expires (admin only)
  React.useEffect(() => {
    if (isAdmin && isElapsed && event.status === 'open' && event.id && shouldShowCountdown) {
      import('../lib/firebase/events').then(({ updateEventStatus }) => {
        updateEventStatus(event.id, 'closed').catch(console.error);
      });
    }
  }, [isElapsed, isAdmin, event.status, event.id, shouldShowCountdown]);

  // Don't show expired open events to students
  if (isElapsed && !isAdmin && event.status === 'open') return null;

  return (
    <Pressable onPress={toggleExpand} style={styles.card}>
      {/* Event Image */}
      {event.images?.[0] && (
        <Image source={{ uri: event.images[0] }} style={styles.image} />
      )}

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {event.name}
        </Text>

        {/* Location & Time */}
        <Text style={styles.subtitle} numberOfLines={1}>
          📍 {event.Location?.name || event.host} • {formatTimestamp(event.foodAvailable)}
        </Text>

        {/* Countdown Bar */}
        {shouldShowCountdown && !!expiryMs && !isElapsed && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              ⏰ {hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : minutes}:{seconds.toString().padStart(2, '0')} left
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%`, backgroundColor: colors.error },
                ]}
              />
            </View>
          </View>
        )}

        {/* Food Items Preview */}
        {event.foods && event.foods.length > 0 && !expanded && (
          <View style={styles.foodPreview}>
            {event.foods.slice(0, 2).filter(f => f.item?.trim()).map((food, i) => (
              <Text key={i} style={styles.foodItem} numberOfLines={1}>
                • {food.item} ({food.quantity} {food.unit})
              </Text>
            ))}
            {event.foods.length > 2 && (
              <Text style={styles.moreItems}>
                +{event.foods.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Expanded Details */}
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            {event.Location?.address && (
              <InfoRow label="Address" value={event.Location.address} />
            )}
            {event.locationDetails && (
              <InfoRow label="Details" value={event.locationDetails} />
            )}
            <InfoRow label="Duration" value={`${event.duration} minutes`} />
            {event.notes && <InfoRow label="Notes" value={event.notes} />}

            {event.foods && event.foods.length > 0 && (
              <View style={styles.foodList}>
                <Text style={styles.sectionLabel}>Available Food:</Text>
                {event.foods.filter(f => f.item?.trim()).map((food, i) => (
                  <Text key={i} style={styles.foodDetailItem}>
                    • {food.item} ({food.quantity} {food.unit})
                  </Text>
                ))}
              </View>
            )}

            {/* Admin Buttons */}
            {isAdmin && (
              <>
                {onEdit && (
                  <Pressable style={styles.editButton} onPress={() => onEdit(event)}>
                    <Text style={styles.editButtonText}>✏️ Edit Event</Text>
                  </Pressable>
                )}

                {event.status === "closed" && (
                  <Pressable
                    style={[styles.editButton, { backgroundColor: colors.secondary }]}
                    onPress={() => {
                      console.log('Navigating to event:', event.id);
                      console.log('Full pathname:', `/(admin)/reviews/${event.id}`);
                      router.push(`/(admin)/reviews/${event.id}?eventName=${encodeURIComponent(event.name)}`);
                    }}
                  >
                    <Text style={styles.editButtonText}>💬 View Feedback</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        {/* Expand Indicator */}
        <Text style={styles.expandIndicator}>
          {expanded ? '▲ Tap to collapse' : '▼ Tap for details'}
        </Text>
      </View>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  countdownContainer: {
    marginBottom: spacing.sm,
  },
  countdownText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  foodPreview: {
    marginTop: spacing.sm,
  },
  foodItem: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  moreItems: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.xs / 2,
  },
  foodList: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  foodDetailItem: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  editButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.body,
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
  expandIndicator: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});