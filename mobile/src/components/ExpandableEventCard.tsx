import * as React from 'react';
import { View, LayoutAnimation, Image } from 'react-native';
import {
  Card,
  Chip,
  Text,
  Button,
  Divider,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import type { Event } from '../types';
import { formatTimestamp } from '../lib/utils';
import theme from '../lib/theme';
import { getExpiryMs, tsToMs } from '../lib/time';
import { useCountdown } from '../hooks/useCountdown';

interface ExpandableEventCardProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExpandableEventCard({
  event,
  isAdmin = false,
  onEdit,
  onDelete,
  isExpanded,
  onToggle,
}: ExpandableEventCardProps) {
  const statusColor =
    theme.status?.[event.status as keyof typeof theme.status] ??
    theme.colors.secondary;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const startMs = tsToMs(event.foodAvailable);
  const expiryMs = getExpiryMs(event);
  const now = Date.now();

  const { remainingMs, minutes, seconds, isElapsed } = useCountdown(expiryMs ?? 0);

  const hasStarted = startMs ? now >= startMs : false;
  const isExpired = expiryMs ? now >= expiryMs : false;
  const shouldShowCountdown = event.status === 'open' && hasStarted && !isExpired;

  if (!isAdmin && isElapsed) return null;

  const totalMs =
    expiryMs && startMs ? expiryMs - startMs : (event.duration ?? 30) * 60_000;
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const timerColor = minutes < 5 ? theme.colors.error : theme.colors.primary;

  return (
    <Card
      mode="elevated"
      style={{
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      {/* Event photo (first image) */}
      {event.images && event.images.length > 0 && event.images[0] ? (
        <Image
          source={{ uri: event.images[0] }}
          style={{
            width: '100%',
            height: 180,
            resizeMode: 'cover',
          }}
        />
      ) : null}

      {/* Header */}
      <Card.Title
        title={event.name}
        subtitle={`📍 ${
          event.Location?.name || event.host || 'BU Campus'
        } • ${formatTimestamp(event.foodAvailable)}`}
        right={() => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isAdmin && (
              <Chip
                compact
                mode="flat"
                style={{
                  backgroundColor: statusColor,
                  marginRight: theme.spacing.sm,
                }}
                textStyle={{
                  color: theme.colors.text?.onPrimary ?? '#fff',
                  fontSize: 12,
                }}
              >
                {event.status}
              </Chip>
            )}
            <IconButton
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              onPress={handleToggle}
            />
          </View>
        )}
      />

      <Card.Content>
        {/* Countdown bar */}
        {shouldShowCountdown && expiryMs && (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="bodySmall"
              style={{
                color: timerColor,
                fontWeight: '600',
                marginBottom: theme.spacing.xs,
              }}
            >
              ⏰ {minutes}:{seconds.toString().padStart(2, '0')} left
            </Text>
            <ProgressBar
              progress={progress}
              color={timerColor}
              style={{ height: 6, borderRadius: 3 }}
            />
          </View>
        )}

        {/* Food preview */}
        {event.foods && event.foods.length > 0 && (
          <View style={{ marginBottom: isExpanded ? theme.spacing.md : 0 }}>
            {event.foods
              .filter((f) => f.item?.trim())
              .map((food, index) => (
                <Text
                  key={index}
                  variant="bodyMedium"
                  style={{ marginBottom: theme.spacing.xs }}
                >
                  • {food.item} ({food.quantity} {food.unit})
                </Text>
              ))}
          </View>
        )}

        {/* Expanded section */}
        {isExpanded && (
          <View style={{ marginTop: theme.spacing.md }}>
            <Divider style={{ marginBottom: theme.spacing.md }} />

            <InfoRow label="Host" value={event.host} />
            {isAdmin && <InfoRow label="Status" value={event.status} />}
            {event.Location?.address && (
              <InfoRow label="Address" value={event.Location.address} />
            )}
            {event.locationDetails && (
              <InfoRow label="Details" value={event.locationDetails} />
            )}
            <InfoRow label="Available" value={formatTimestamp(event.foodAvailable)} />
            <InfoRow label="Duration" value={`${event.duration} minutes`} />
            {event.notes && <InfoRow label="Notes" value={event.notes} />}

            {event.foods && event.foods.length > 0 && (
              <View style={{ marginTop: theme.spacing.md }}>
                <Text
                  variant="titleSmall"
                  style={{ marginBottom: theme.spacing.xs, opacity: 0.7 }}
                >
                  Available Food
                </Text>
                <Text variant="bodyMedium">
                  {event.foods
                    .filter((f) => f.item?.trim())
                    .map((f) => `${f.item} (${f.quantity} ${f.unit})`)
                    .join(' • ')}
                </Text>
              </View>
            )}

            {/* Admin buttons */}
            {isAdmin && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.lg,
                }}
              >
                {onEdit && (
                  <Button mode="contained-tonal" icon="pencil" onPress={onEdit}>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    mode="contained"
                    icon="delete"
                    onPress={onDelete}
                    buttonColor={theme.colors.error}
                  >
                    Delete
                  </Button>
                )}
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: any }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: theme.spacing.sm }}>
      <Text variant="titleSmall" style={{ opacity: 0.7 }}>
        {label}
      </Text>
      <Text variant="bodyMedium">{String(value)}</Text>
    </View>
  );
}
