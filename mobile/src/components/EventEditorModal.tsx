// src/components/EventEditorModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../lib/theme';
import type { Event, EventStatus, FoodItem } from '../types';
import { Timestamp } from 'firebase/firestore';

interface EventEditorModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onSave: (event: Partial<Event>) => Promise<void>;
}

const MAX_FOOD_DURATION_HOURS = 4;
const MAX_FOOD_DURATION_MINUTES = MAX_FOOD_DURATION_HOURS * 60;

export function EventEditorModal({ visible, event, onClose, onSave }: EventEditorModalProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [campusSection, setCampusSection] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('30');
  const [status, setStatus] = useState<EventStatus>('drafted');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Date picker states
  const [foodArrived, setFoodArrived] = useState<Date>(new Date());
  const [foodAvailable, setFoodAvailable] = useState<Date>(new Date());
  const [showArrivedPicker, setShowArrivedPicker] = useState(false);
  const [showAvailablePicker, setShowAvailablePicker] = useState(false);

  // Calculate max available time (4 hours after arrival)
  const maxAvailableTime = React.useMemo(() => {
    return new Date(foodArrived.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000);
  }, [foodArrived]);

  // Calculate max duration based on arrival and pickup times
  const maxDuration = React.useMemo(() => {
    const arrivalTime = foodArrived.getTime();
    const pickupTime = foodAvailable.getTime();
    const timeBetweenMinutes = (pickupTime - arrivalTime) / (60 * 1000);
    const remainingMinutes = MAX_FOOD_DURATION_MINUTES - timeBetweenMinutes;
    return Math.max(0, Math.floor(remainingMinutes));
  }, [foodArrived, foodAvailable]);

  useEffect(() => {
    if (event && visible) {
      setName(event.name || '');
      setHost(event.host || '');
      setLocationName(event.Location?.name || '');
      setLocationAddress(event.Location?.address || '');
      setCampusSection(event.Location?.campus_section || '');
      setLocationDetails(event.locationDetails || '');
      setNotes(event.notes || '');
      setDuration(String(event.duration || 30));
      setStatus(event.status || 'drafted');
      setFoods(event.foods || []);
      setImages(event.images || []);

      // Set dates from event
      if (event.foodArrived) {
        const arrived = timestampToDate(event.foodArrived);
        setFoodArrived(arrived);
      } else {
        setFoodArrived(new Date());
      }

      if (event.foodAvailable) {
        const available = timestampToDate(event.foodAvailable);
        setFoodAvailable(available);
      } else {
        setFoodAvailable(new Date());
      }
    }
  }, [event, visible]);

  // Validate and adjust duration when it changes
  const handleDurationChange = (value: string) => {
    const durationNum = parseInt(value) || 0;
    if (durationNum > maxDuration) {
      Alert.alert(
        'Duration Limit Exceeded',
        `Maximum duration is ${maxDuration} minutes. Food cannot be given more than ${MAX_FOOD_DURATION_HOURS} hours after arrival.`
      );
      setDuration(String(maxDuration));
    } else {
      setDuration(value);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Event name is required');
      return;
    }

    const durationNum = parseInt(duration) || 30;
    if (durationNum > maxDuration) {
      Alert.alert(
        'Error',
        `Duration cannot exceed ${maxDuration} minutes due to food safety regulations (max ${MAX_FOOD_DURATION_HOURS} hours from arrival)`
      );
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Event> = {
        name: name.trim(),
        host: host.trim() || 'Unknown',
        Location: {
          name: locationName.trim() || 'BU Campus',
          address: locationAddress.trim(),
          abbreviation: '',
          lat: '',
          lon: '',
          campus_section: campusSection.trim(),
        },
        locationDetails: locationDetails.trim(),
        notes: notes.trim(),
        duration: durationNum,
        status,
        foods: foods.filter(f => f.item?.trim()),
        images: images.filter(img => img.trim()),
        foodArrived: Timestamp.fromDate(foodArrived),
        foodAvailable: Timestamp.fromDate(foodAvailable),
      };

      if (event?.id) {
        await onSave({ ...updates, id: event.id });
      }

      onClose();
    } catch (error) {

      Alert.alert('Error', 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const addFoodItem = () => {
    setFoods([...foods, { id: Date.now().toString(), item: '', quantity: '', unit: 'pieces' }]);
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: string) => {
    const updated = [...foods];
    updated[index] = { ...updated[index], [field]: value };
    setFoods(updated);
  };

  const removeFoodItem = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    setImages([...images, '']);
  };

  const updateImageUrl = (index: number, value: string) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const removeImageUrl = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Handler for Food Arrived date picker
  const handleArrivedDateChange = (event: any, selectedDate?: Date) => {
    // Always close picker on Android after selection
    if (Platform.OS === 'android') {
      setShowArrivedPicker(false);
    }
    
    if (selectedDate) {
      setFoodArrived(selectedDate);
      
      // Auto-adjust available time if it exceeds 4 hours from new arrival time
      const maxAvailable = new Date(selectedDate.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000);
      if (foodAvailable > maxAvailable) {
        setFoodAvailable(maxAvailable);
        Alert.alert(
          'Pickup Time Adjusted',
          `Pickup time was adjusted to ${MAX_FOOD_DURATION_HOURS} hours after arrival (food safety limit)`
        );
      } else if (foodAvailable < selectedDate) {
        // If available time is before arrival, set it to arrival time
        setFoodAvailable(selectedDate);
      }
    }
  };

  // Handler for Available for Pickup date picker
  const handleAvailableDateChange = (event: any, selectedDate?: Date) => {
    // Always close picker on Android after selection
    if (Platform.OS === 'android') {
      setShowAvailablePicker(false);
    }
    
    if (selectedDate) {
      // Ensure pickup is after arrival
      if (selectedDate < foodArrived) {
        Alert.alert('Invalid Time', 'Pickup time must be after arrival time');
        return;
      }
      
      // Ensure pickup is within 4 hours of arrival
      const maxAvailable = new Date(foodArrived.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000);
      if (selectedDate > maxAvailable) {
        Alert.alert(
          'Time Limit Exceeded',
          `Pickup time cannot be more than ${MAX_FOOD_DURATION_HOURS} hours after arrival (food safety limit)`
        );
        return;
      }
      
      setFoodAvailable(selectedDate);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Pizza Party"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Host</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            placeholder="e.g., Computer Science Department"
            placeholderTextColor={colors.text.secondary}
          />

          {/* Timing */}
          <Text style={styles.sectionTitle}>Timing & Duration</Text>

          <Text style={styles.label}>Food Arrived</Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowArrivedPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅 {formatDate(foodArrived)}
            </Text>
          </Pressable>
          {showArrivedPicker && (
            <DateTimePicker
              value={foodArrived}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleArrivedDateChange}
              minimumDate={new Date()}
            />
          )}
          {Platform.OS === 'ios' && showArrivedPicker && (
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowArrivedPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Available for Pickup</Text>
          <Text style={styles.helperText}>
            Must be within {MAX_FOOD_DURATION_HOURS} hours of arrival time (food safety)
          </Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowAvailablePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅 {formatDate(foodAvailable)}
            </Text>
          </Pressable>
          {showAvailablePicker && (
            <DateTimePicker
              value={foodAvailable}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleAvailableDateChange}
              minimumDate={foodArrived}
              maximumDate={maxAvailableTime}
            />
          )}
          {Platform.OS === 'ios' && showAvailablePicker && (
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowAvailablePicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          )}

          <Text style={styles.label}>
            Duration (minutes) - Max: {maxDuration} min
          </Text>
          <Text style={styles.helperText}>
            Food must be closed within {MAX_FOOD_DURATION_HOURS} hours of arrival. 
            Current gap between arrival and pickup: {Math.floor((foodAvailable.getTime() - foodArrived.getTime()) / 60000)} minutes
          </Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={handleDurationChange}
            placeholder="30"
            keyboardType="numeric"
            placeholderTextColor={colors.text.secondary}
          />

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.label}>Location Name</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="e.g., Engineering Building"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={locationAddress}
            onChangeText={setLocationAddress}
            placeholder="e.g., 8 St. Mary's St"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Campus Section</Text>
          <TextInput
            style={styles.input}
            value={campusSection}
            onChangeText={setCampusSection}
            placeholder="e.g., Central, East, West"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Location Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={locationDetails}
            onChangeText={setLocationDetails}
            placeholder="e.g., Room 101, First floor"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={2}
          />

          {/* Status & Notes */}
          <Text style={styles.sectionTitle}>Status & Notes</Text>
          
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusContainer}>
            {(['drafted', 'saved', 'open', 'closed'] as EventStatus[]).map((s) => (
              <Pressable
                key={s}
                style={[styles.statusChip, status === s && styles.statusChipActive]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    status === s && styles.statusChipTextActive,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional information..."
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={3}
          />

          {/* Food Items */}
          <Text style={styles.sectionTitle}>Food Items</Text>
          {foods.map((food, index) => (
            <View key={food.id} style={styles.foodItemContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={food.item}
                onChangeText={(text) => updateFoodItem(index, 'item', text)}
                placeholder="Food item"
                placeholderTextColor={colors.text.secondary}
              />
              <View style={styles.foodItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={food.quantity}
                  onChangeText={(text) => updateFoodItem(index, 'quantity', text)}
                  placeholder="Qty"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={food.unit}
                  onChangeText={(text) => updateFoodItem(index, 'unit', text)}
                  placeholder="Unit"
                  placeholderTextColor={colors.text.secondary}
                />
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeFoodItem(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable style={styles.addButton} onPress={addFoodItem}>
            <Text style={styles.addButtonText}>+ Add Food Item</Text>
          </Pressable>

          {/* Images */}
          <Text style={styles.sectionTitle}>Event Images (URLs)</Text>
          {images.map((img, index) => (
            <View key={index} style={styles.imageUrlRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={img}
                onChangeText={(text) => updateImageUrl(index, text)}
                placeholder="https://..."
                placeholderTextColor={colors.text.secondary}
              />
              <Pressable
                style={styles.removeButton}
                onPress={() => removeImageUrl(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addButton} onPress={addImageUrl}>
            <Text style={styles.addButtonText}>+ Add Image URL</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.footerButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.footerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function timestampToDate(ts: any): Date {
  if (ts instanceof Date) return ts;
  if (ts?.toDate) return ts.toDate();
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return new Date();
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl + 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.h4,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  doneButtonText: {
    ...typography.body,
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  statusChipTextActive: {
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
  foodItemContainer: {
    marginBottom: spacing.md,
  },
  foodItemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  imageUrlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  removeButton: {
    padding: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  removeButtonText: {
    color: colors.text.onPrimary,
    fontSize: 20,
  },
  addButton: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
});