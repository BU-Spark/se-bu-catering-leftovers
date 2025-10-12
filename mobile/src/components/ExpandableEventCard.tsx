// src/components/ExpandableEventCard.tsx
import * as React from 'react';
import { View, LayoutAnimation } from 'react-native';
import { Card, Chip, Text, Button, Divider, IconButton } from 'react-native-paper';
import type { Event } from '../types';
import { formatTimestamp } from '../lib/utils';
import theme from '../lib/theme';

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
    theme.status[(event.status as keyof typeof theme.status)] ?? theme.colors.secondary;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <Card mode="elevated" style={{ marginBottom: theme.spacing.md }}>
      <Card.Title
        title={event.name}
        subtitle={`📍 ${event.host} • ${formatTimestamp(event.foodAvailable)}`}
        right={() => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isAdmin && (
              <Chip
                compact
                mode="flat"
                style={{ backgroundColor: statusColor, marginRight: theme.spacing.sm }}
                textStyle={{ color: theme.colors.text.onPrimary, fontSize: 12 }}
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
        {event.foods && event.foods.length > 0 && (
          <View style={{ marginBottom: isExpanded ? theme.spacing.md : 0 }}>
            {event.foods.filter(f => f.item?.trim()).map((food, index) => (
              <Text key={index} variant="bodyMedium" style={{ marginBottom: theme.spacing.xs }}>
                • {food.item} ({food.quantity} {food.unit})
              </Text>
            ))}
          </View>
        )}

        {isExpanded && (
          <View style={{ marginTop: theme.spacing.md }}>
            <Divider style={{ marginBottom: theme.spacing.md }} />

            <InfoRow label="Host" value={event.host} />
            {isAdmin && <InfoRow label="Status" value={event.status} />}
            {event.Location?.address && <InfoRow label="Address" value={event.Location.address} />}
            {event.locationDetails && <InfoRow label="Details" value={event.locationDetails} />}
            <InfoRow label="Available" value={formatTimestamp(event.foodAvailable)} />
            <InfoRow label="Duration" value={`${event.duration} minutes`} />
            {event.notes && <InfoRow label="Notes" value={event.notes} />}

            {event.foods && event.foods.length > 0 && (
              <View style={{ marginTop: theme.spacing.md }}>
                <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs, opacity: 0.7 }}>
                  Available Food
                </Text>
                <Text variant="bodyMedium">
                  {event.foods
                    .filter(f => f.item?.trim())
                    .map(f => `${f.item} (${f.quantity} ${f.unit})`)
                    .join(' • ')}
                </Text>
              </View>
            )}

            {isAdmin && (
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
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
