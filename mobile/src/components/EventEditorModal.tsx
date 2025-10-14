// src/components/EventEditorModal.tsx
import * as React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Chip, Card } from 'react-native-paper';
import type { Event, EventStatus, FoodItem } from '../types';
import theme from '../lib/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventEditorModalProps {
  event: Partial<Event> | null;
  visible: boolean;
  onDismiss: () => void;
  onSave: (event: Partial<Event>) => Promise<void>;
  loading?: boolean;
  onDraftChange?: (draft: Partial<Event>) => void;
}

export function EventEditorModal({
  event,
  visible,
  onDismiss,
  onSave,
  loading = false,
  onDraftChange,
}: EventEditorModalProps) {
  const [draft, setDraft] = React.useState<Partial<Event> | null>(null);
  const [showPicker, setShowPicker] = React.useState(false);

  // Initialize modal draft when opened
  React.useEffect(() => {
    if (visible) {
      const init = event ?? {};
      console.log("📥 Modal mounted / visible:", visible, "event:", init);
      setDraft(init);
    }
  }, [visible, event]);

  // ✅ Notify parent AFTER draft changes (not during render)
  React.useEffect(() => {
    if (draft && visible) {
      onDraftChange?.(draft);
    }
  }, [draft, visible]);

  const handleSave = async () => {
    console.log("🧾 Modal save pressed. Current draft:", draft);
    if (draft) {
      try {
        await onSave(draft);
        console.log("✅ onSave callback complete.");
        onDismiss();
      } catch (err) {
        console.error("❌ Error saving draft:", err);
      }
    } else {
      console.warn("⚠️ No draft to save!");
    }
  };

  const update = (next: Partial<Event>) => {
    setDraft(next);
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
    setDraft(prev => ({
      ...prev,
      foods: prev?.foods?.filter((_, i) => i !== index),
    }));
  };

  if (!draft) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
    console.log("❌ Modal dismissed before save");
    onDismiss();
  }}
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
              onChangeText={t => update({ ...draft, host: t })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Event Name"
              value={draft.name ?? ''}
              onChangeText={t => update({ ...draft, name: t })}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Location Name"
              value={draft.Location?.name ?? ''}
              onChangeText={t =>
                update({
                  ...draft,
                  Location: { ...(draft.Location ?? {}), name: t },
                })
              }
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Location Address"
              value={draft.Location?.address ?? ''}
              onChangeText={t =>
                update({
                  ...draft,
                  Location: { ...(draft.Location ?? {}), address: t },
                })
              }
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Campus Section"
              value={draft.Location?.campus_section ?? ''}
              onChangeText={t =>
                update({
                  ...draft,
                  Location: { ...(draft.Location ?? {}), campus_section: t },
                })
              }
              style={{ marginBottom: theme.spacing.sm }}
            />

            {/* 🕒 Food Available Time Picker */}
            <View style={{ marginBottom: theme.spacing.sm }}>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setShowPicker(true)}
              >
                {draft.foodAvailable
                  ? `Food Available: ${new Date(draft.foodAvailable as string).toLocaleString('en-US', {
                      timeZone: 'America/New_York',
                    })}`
                  : 'Set Food Available Time'}
              </Button>

              {showPicker && (
                <DateTimePicker
                  value={
                    draft.foodAvailable
                      ? new Date(draft.foodAvailable as string)
                      : new Date()
                  }
                  mode="datetime"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selected) => {
                    if (Platform.OS === 'ios') {
                      if (event.type === 'set' && selected) {
                        update({ ...draft, foodAvailable: selected.toISOString() });
                      }
                      if (event.type === 'set' || event.type === 'dismissed') {
                        setShowPicker(false);
                      }
                    } else {
                      setShowPicker(false);
                      if (selected) {
                        update({ ...draft, foodAvailable: selected.toISOString() });
                      }
                    }
                  }}
                />
              )}
            </View>

            <TextInput
              mode="outlined"
              label="Duration (minutes)"
              value={String(draft.duration ?? 30)}
              onChangeText={t => update({ ...draft, duration: parseInt(t) || 30 })}
              keyboardType="numeric"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <TextInput
              mode="outlined"
              label="Notes"
              value={draft.notes ?? ''}
              onChangeText={t => update({ ...draft, notes: t })}
              multiline
              numberOfLines={3}
              style={{ marginBottom: theme.spacing.md }}
            />

            {/* 🔖 Status */}
            <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              {(['drafted', 'saved', 'open', 'closed'] as EventStatus[]).map(status => (
                <Chip
                  key={status}
                  selected={draft.status === status}
                  onPress={() => update({ ...draft, status })}
                >
                  {status}
                </Chip>
              ))}
            </View>

            {/* 🍽 Food Items */}
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

            <Button
              mode="text"
              icon="plus"
              onPress={addFoodItem}
              style={{ marginBottom: theme.spacing.md }}
            >
              Add Food Item
            </Button>

            {/* 🖼 Event Photos */}
            <Text variant="titleSmall" style={{ marginBottom: theme.spacing.xs }}>
              Event Photos (Paste Firebase URLs)
            </Text>
            {(draft.images ?? []).map((url, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <TextInput
                  mode="outlined"
                  label={`Photo ${i + 1} URL`}
                  value={url}
                  onChangeText={t => {
                    const next = { ...draft, images: [...(draft.images ?? [])] };
                    next.images![i] = t;
                    update(next);
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() => {
                    const next = { ...draft, images: draft.images?.filter((_, j) => j !== i) ?? [] };
                    update(next);
                  }}
                >
                  Remove
                </Button>
              </View>
            ))}

            <Button
              mode="text"
              icon="plus"
              onPress={() => update({ ...draft, images: [...(draft.images ?? []), ''] })}
              style={{ marginBottom: theme.spacing.md }}
            >
              Add Photo
            </Button>

            {/* 💾 Save / Cancel */}
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
