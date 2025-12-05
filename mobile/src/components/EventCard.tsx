// src/components/EventCard.tsx
import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Text,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';
import { formatTimestamp } from '../lib/utils';
import { tsToMs } from '../lib/time';
import { useCountdown } from '../hooks/useCountdown';
import type { Event } from '../types';
import { useRouter } from 'expo-router';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  isAdmin?: boolean;
  onEdit?: (event: Event) => void;
}

export function EventCard({
  event,
  onPress,
  isAdmin = false,
  onEdit,
}: EventCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  // Timer should ONLY show for open events and ONLY depend on duration
  const shouldShowCountdown = event.status === 'open';

  // Calculate expiry based ONLY on duration (in minutes)
  const durationMs = (event.duration ?? 30) * 60 * 1000;
  const startMs = tsToMs(event.foodAvailable);
  const expiryMs = startMs ? startMs + durationMs : null;

  const { remainingMs, hours, minutes, seconds, isElapsed } = useCountdown(
    shouldShowCountdown && expiryMs ? expiryMs : null,
  );

  const toggleExpand = () => {
    setExpanded(!expanded);
    onPress?.();
  };

  // Auto-slideshow
  React.useEffect(() => {
    if (!event.images || event.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [event.images]);

  const openInMaps = async (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    
    const googleMapsApp = Platform.select({
      ios: `comgooglemaps://?q=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
      default: null,
    });

    try {
      if (googleMapsApp) {
        const canOpen = await Linking.canOpenURL(googleMapsApp);
        if (canOpen) {
          await Linking.openURL(googleMapsApp);
          return;
        }
      }
      
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      );
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  // Progress bar for countdown
  const progress = React.useMemo(() => {
    if (!shouldShowCountdown || !expiryMs || !startMs || !(remainingMs > 0))
      return 0;
    const totalDurationMs = (event.duration ?? 30) * 60 * 1000;
    return Math.max(0, Math.min(1, remainingMs / totalDurationMs));
  }, [shouldShowCountdown, remainingMs, expiryMs, startMs, event.duration]);

  // Admin auto-close logic
  React.useEffect(() => {
    if (
      isAdmin &&
      isElapsed &&
      event.status === 'open' &&
      event.id &&
      shouldShowCountdown
    ) {
      import('../lib/firebase/events').then(({ updateEventStatus }) => {
        updateEventStatus(event.id, 'closed').catch(console.error);
      });
    }
  }, [isElapsed, isAdmin, event.status, event.id, shouldShowCountdown]);

  // Students should not see expired open events
  if (isElapsed && !isAdmin && event.status === 'open') return null;

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
    imageCarouselContainer: {
      position: 'relative',
    },
    pagination: {
      position: 'absolute',
      bottom: spacing.sm,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.border.light,
    },
    dotActive: {
      backgroundColor: colors.primary,
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
    reviewButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    reviewButtonText: {
      ...typography.body,
      color: colors.text.onPrimary,
      fontWeight: '600',
    },
  });

  return (
    <Pressable onPress={toggleExpand} style={styles.card}>
      
      {/* ------------------------------ */}
      {/*        AUTO SLIDESHOW AREA     */}
      {/* ------------------------------ */}
      {event.images && event.images.length > 0 && (
        <View style={styles.imageCarouselContainer}>
          <Image
            key={event.images[currentImageIndex]}
            source={{ uri: event.images[currentImageIndex] }}
            style={styles.image}
          />

          {event.images.length > 1 && (
            <View style={styles.pagination}>
              {event.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {event.name}
        </Text>

        <Text style={styles.subtitle} numberOfLines={1}>
          📍 {event.Location?.name || event.host} • {formatTimestamp(event.foodAvailable)}
        </Text>

        {/* Countdown */}
        {shouldShowCountdown && !!expiryMs && !isElapsed && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              ⏰{' '}
              {hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : minutes}
              :{seconds.toString().padStart(2, '0')} left
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

        {/* Food preview */}
        {!expanded && event.foods?.length > 0 && (
          <View style={styles.foodPreview}>
            {event.foods.slice(0, 2).map((f, i) => (
              <Text key={i} style={styles.foodItem} numberOfLines={1}>
                • {f.item} ({f.quantity} {f.unit})
              </Text>
            ))}
            {event.foods.length > 2 && (
              <Text style={styles.moreItems}>+{event.foods.length - 2} more</Text>
            )}
          </View>
        )}

        {/* Expanded details */}
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            <InfoRow 
              label="Address"
              value={event.Location.address}
              isLink={true}
              onPress={() => openInMaps(event.Location.address)}
            />

            {event.locationDetails && (
              <InfoRow label="Details" value={event.locationDetails} />
            )}

            <InfoRow label="Duration" value={`${event.duration} minutes`} />

            {event.notes && <InfoRow label="Notes" value={event.notes} />}

            {event.foods.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Available Food:</Text>
                {event.foods.map((f, i) => (
                  <Text key={i} style={styles.foodDetailItem}>
                    • {f.item} ({f.quantity} {f.unit})
                  </Text>
                ))}
              </>
            )}

            {isAdmin && onEdit && (
              <Pressable style={styles.editButton} onPress={() => onEdit(event)}>
                <Text style={styles.editButtonText}>✏️ Edit Event</Text>
              </Pressable>
            )}

            {isAdmin && event.status === 'closed' && (
              <Pressable
                style={[styles.editButton, { backgroundColor: colors.secondary }]}
                onPress={() =>
                  router.push(
                    `/(admin)/reviews/${event.id}?eventName=${encodeURIComponent(event.name)}`
                  )
                }
              >
                <Text style={styles.editButtonText}>💬 View Feedback</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Student review button */}
        {!isAdmin && (
          <Pressable
            style={styles.reviewButton}
            onPress={() => router.push(`/feedback?eventId=${event.id}`)}
          >
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </Pressable>
        )}

        <Text style={styles.expandIndicator}>
          {expanded ? '▲ Tap to collapse' : '▼ Tap for details'}
        </Text>
      </View>
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  isLink = false,
  onPress,
}: {
  label: string;
  value: string;
  isLink?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
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
        linkContainer: {
          marginTop: spacing.xs / 2,
        },
        infoValueLink: {
          ...typography.body,
          color: '#007AFF',
          textDecorationLine: 'underline',
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      {isLink && onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.linkContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.infoValueLink}>{value}</Text>
        </Pressable>
      ) : (
        <Text style={styles.infoValue}>{value}</Text>
      )}
    </View>
  );
}