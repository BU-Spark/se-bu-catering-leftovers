// src/components/EventEditorModal.tsx
import * as React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Chip, Card } from 'react-native-paper';
import type { Event, EventStatus, FoodItem } from '../types';
import theme from '../lib/theme';

interface EventEditorModalProps {
  event: Partial<Event> | null;
  visible: boolean;
  onDismiss: () => void;
  onSave: (event: Partial<Event>) => Promise<void>;
  loading?: boolean;
}

export function EventEditorModal({
  event,
  visible,
  onDismiss,
  onSave,
  loading = false,
}: EventEditorModalProps) {
  const [draft, setDraft] = React.useState<Partial<Event> | null>(null);

  React.useEffect(() => {
    if (visible && event) setDraft(event);
  }, [visible, event]);

  const handleSave = async () => {
    if (draft) {
      await onSave(draft);
      onDismiss();
    }
  };

  const addFoodItem = () => {
    setDraft(prev => ({
      ...prev,
      foods: [
        ...(prev?.foods ?? []),
        { id: Date.now().toString(), item: '', quantity: '', unit: 'Pieces' },
      ],
    }));
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: string) => {
    setDraft(prev => ({
      ...prev,
      foods: prev?.foods?.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  };

  const removeFoodItem = (index: number) => {
    setDraft(prev => ({ ...prev, foods: prev?.foods?.filter((_, i) => i !== index) }));
  };

  if (!draft) return null;

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
          maxHeight: '90%',
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '100%' }}>
            <Text variant="headlineSmall" style={{ marginBottom: theme.spacing.md }}>
              {draft.id ? 'Edit Event' : 'New Event'}
            </Text>

            <TextInput
              mode="outlined"
              label="Host"
              value={draft.host ?? ''}
              onChangeText={t => setDraft({ ...draft, host: t })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Event Name"
              value={draft.name ?? ''}
              onChangeText={t => setDraft({ ...draft, name: t })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Location Name"
              value={draft.Location?.name ?? ''}
              onChangeText={t => setDraft({ ...draft, Location: { ...(draft.Location ?? {} as any), name: t } })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Location Address"
              value={draft.Location?.address ?? ''}
              onChangeText={t => setDraft({ ...draft, Location: { ...(draft.Location ?? {} as any), address: t } })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Campus Section"
              value={draft.Location?.campus_section ?? ''}
              onChangeText={t => setDraft({ ...draft, Location: { ...(draft.Location ?? {} as any), campus_section: t } })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Food Available (YYYY-MM-DDTHH:MM)"
              value={(draft.foodAvailable as string) ?? ''}
              onChangeText={t => setDraft({ ...draft, foodAvailable: t })}
              placeholder="2025-10-15T12:00"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Duration (minutes)"
              value={String(draft.duration ?? 30)}
              onChangeText={t => setDraft({ ...draft, duration: parseInt(t) || 30 })}
              keyboardType="numeric"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Notes"
              value={draft.notes ?? ''}
              onChangeText={t => setDraft({ ...draft, notes: t })}
              multiline
              numberOfLines={3}
              style={{ marginBottom: theme.spacing.md }}
            />

            <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              {(['drafted', 'saved', 'open', 'closed'] as EventStatus[]).map(status => (
                <Chip key={status} selected={draft.status === status} onPress={() => setDraft({ ...draft, status })}>
                  {status}
                </Chip>
              ))}
            </View>

            <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs }}>
              Food Items
            </Text>
            {draft.foods?.map((food, i) => (
              <Card key={food.id} style={{ marginBottom: theme.spacing.sm }}>
                <Card.Content>
                  <TextInput
                    mode="outlined"
                    label="Item"
                    value={food.item}
                    onChangeText={t => updateFoodItem(i, 'item', t)}
                    style={{ marginBottom: theme.spacing.xs }}
                  />
                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <TextInput
                      mode="outlined"
                      label="Quantity"
                      value={food.quantity}
                      onChangeText={t => updateFoodItem(i, 'quantity', t)}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      mode="outlined"
                      label="Unit"
                      value={food.unit}
                      onChangeText={t => updateFoodItem(i, 'unit', t)}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <Button
                    mode="text"
                    textColor={theme.colors.error}
                    onPress={() => removeFoodItem(i)}
                    style={{ marginTop: theme.spacing.xs }}
                  >
                    Remove
                  </Button>
                </Card.Content>
              </Card>
            ))}

            <Button mode="text" icon="plus" onPress={addFoodItem} style={{ marginBottom: theme.spacing.md }}>
              Add Food Item
            </Button>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button mode="contained" onPress={handleSave} loading={loading} style={{ flex: 1 }}>
                Save
              </Button>
              <Button mode="text" onPress={onDismiss}>
                Cancel
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}
