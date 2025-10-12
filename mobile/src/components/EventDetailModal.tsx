// src/components/EventDetailModal.tsx
import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Divider, IconButton } from 'react-native-paper';
import type { Event } from '../types';
import { formatTimestamp } from '../lib/utils';
import theme from '../lib/theme';

interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onDismiss: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
  loading?: boolean;
}

export function EventDetailModal({
  event,
  visible,
  onDismiss,
  onEdit,
  onDelete,
  isAdmin = false,
  loading = false,
}: EventDetailModalProps) {
  if (!event) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          margin: theme.spacing.lg,
          borderRadius: theme.borderRadius?.xl ?? 16,
          padding: theme.spacing.lg,
          maxHeight: '85%',
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headlineSmall" style={{ flex: 1 }}>
              {event.name}
            </Text>
            {isAdmin && onEdit && <IconButton icon="pencil" size={20} onPress={onEdit} />}
          </View>

          <Divider style={{ marginVertical: theme.spacing.md }} />

          <InfoRow label="Host" value={event.host} />
          {isAdmin && <InfoRow label="Status" value={event.status} />}
          <InfoRow label="Location" value={event.Location?.name} />
          {event.Location?.address && <InfoRow label="Address" value={event.Location.address} />}
          {event.locationDetails && <InfoRow label="Details" value={event.locationDetails} />}
          <InfoRow label="Available" value={formatTimestamp(event.foodAvailable)} />
          <InfoRow label="Duration" value={`${event.duration} minutes`} />
          {event.notes && <InfoRow label="Notes" value={event.notes} />}

          {event.foods && event.foods.length > 0 && (
            <View style={{ marginTop: theme.spacing.md }}>
              <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs }}>
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

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            {isAdmin && onDelete && (
              <Button mode="contained" onPress={onDelete} loading={loading} buttonColor={theme.colors.error}>
                Delete
              </Button>
            )}
            <Button mode="text" onPress={onDismiss}>
              Close
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
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
