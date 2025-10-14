import * as React from 'react';
import { Image, View } from 'react-native';
import { Card, Text, Badge, IconButton, useTheme } from 'react-native-paper';
import type { Event, UserRole } from '../types';
import { spacing } from '../lib/theme';

type Props = {
  event: Event;
  role: UserRole;
  onPress?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
};

function useCountdown(expiryMs: number | null) {
  const [now, setNow] = React.useState<number>(Date.now());
  React.useEffect(() => {
    if (!expiryMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiryMs]);
  const remainingMs = expiryMs ? Math.max(0, expiryMs - now) : 0;
  const expired = expiryMs ? now >= expiryMs : false;
  const secs = Math.floor(remainingMs / 1000) % 60;
  const mins = Math.floor(remainingMs / (1000 * 60)) % 60;
  const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
  const label = expired ? 'Expired' : `${hrs}h ${mins}m ${secs}s`;
  return { expired, label };
}

function computeExpiryMs(event: Event): number | null {
  // Expiration = foodAvailable + duration (minutes)
  // Fallback to foodArrived if needed; if missing, treat as no expiry
  const baseTs = (event.foodAvailable ?? event.foodArrived)?.toDate?.()
    ? (event.foodAvailable ?? event.foodArrived).toDate()
    : null;
  if (!baseTs) return null;
  const ms = baseTs.getTime() + (Number(event.duration || 0) * 60_000);
  return ms;
}

export default function EventCard({ event, role, onPress, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const expiryMs = React.useMemo(() => computeExpiryMs(event), [event]);
  const { expired, label } = useCountdown(expiryMs);

  // Students: card hidden by parent when expired. Admin: show with expired styling.
  const isAdmin = role === 'Admin';
  const showExpiredBadge = isAdmin && expired;
  const statusColor = expired ? theme.colors.error : theme.colors.primary;

  return (
    <Card
      mode="elevated"
      onPress={() => onPress?.(event)}
      style={{ marginBottom: spacing.lg }}
    >
      {event.images?.[0] ? (
        <Card.Cover source={{ uri: event.images[0] }} />
      ) : (
        <View style={{ height: 160, backgroundColor: theme.colors.surface }} />
      )}

      <Card.Title
        title={event.name}
        subtitle={event.Location?.name ?? 'Unknown location'}
        right={(props) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showExpiredBadge ? (
              <Badge style={{ backgroundColor: theme.colors.error, marginRight: spacing.sm }}>Expired</Badge>
            ) : null}
            <Badge style={{ backgroundColor: statusColor }}>{label}</Badge>
          </View>
        )}
      />

      {(isAdmin && (onEdit || onDelete)) ? (
        <Card.Actions>
          {onEdit ? (
            <IconButton icon="pencil" onPress={() => onEdit(event)} accessibilityLabel="Edit event" />
          ) : null}
          {onDelete ? (
            <IconButton icon="delete" onPress={() => onDelete(event)} accessibilityLabel="Delete event" />
          ) : null}
        </Card.Actions>
      ) : null}
    </Card>
  );
}


