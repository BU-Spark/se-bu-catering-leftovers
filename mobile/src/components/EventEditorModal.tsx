// src/components/EventEditorModal.tsx
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useState, useEffect } from 'react';
import { storage } from '../lib/firebase/config';
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
  Image,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';
import type { Event, EventStatus, FoodItem } from '../types';
import { Timestamp } from 'firebase/firestore';
import { PRESET_LOCATIONS } from '../lib/constants';

const DEFAULT_IMAGES = [
  require('../../assets/defaultEventFoodPics/Breakfast.jpg'),
  require('../../assets/defaultEventFoodPics/Lunch.jpg'),
  require('../../assets/defaultEventFoodPics/Snacks.jpg'),
  require('../../assets/defaultEventFoodPics/Dinner.jpg'),
];

interface EventEditorModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onSave?: (event: Partial<Event>) => Promise<void>;
  onCreate?: (event: Partial<Event>) => Promise<void>;
}

const MAX_FOOD_DURATION_HOURS = 4;
const MAX_FOOD_DURATION_MINUTES = MAX_FOOD_DURATION_HOURS * 60;

export function EventEditorModal({
  visible,
  event,
  onClose,
  onSave,
  onCreate,
}: EventEditorModalProps) {
  const { colors } = useTheme();
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Date picker states
  const [foodArrived, setFoodArrived] = useState<Date>(new Date());
  const [foodAvailable, setFoodAvailable] = useState<Date>(new Date());
  const [showArrivedPicker, setShowArrivedPicker] = useState(false);
  const [showAvailablePicker, setShowAvailablePicker] = useState(false);

  // Location preset picker
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(
    null,
  );

  // Calculate max available time (4 hours after arrival)
  const maxAvailableTime = React.useMemo(() => {
    return new Date(
      foodArrived.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000,
    );
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

      const eventImages = event.images || [];
      const defaultImageUris = DEFAULT_IMAGES.map(
        (img) => Image.resolveAssetSource(img).uri,
      );
      const defaultSelected = eventImages.filter((img) =>
        defaultImageUris.includes(img),
      );
      const uploadedSelected = eventImages.filter(
        (img) => !defaultImageUris.includes(img),
      );

      setImages(defaultSelected);
      setUploadedImages(uploadedSelected);

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

      // Infer preset from incoming event (if exact match)
      const matched = PRESET_LOCATIONS.findIndex(
        (p) =>
          p.name === (event.Location?.name || '') &&
          p.address === (event.Location?.address || '') &&
          p.campus_section === (event.Location?.campus_section || ''),
      );
      setSelectedPresetIndex(matched >= 0 ? matched : null);
    }
  }, [event, visible]);

  const handleDurationChange = (value: string) => {
    const durationNum = parseInt(value) || 0;
    if (durationNum > maxDuration) {
      Alert.alert(
        'Duration Limit Exceeded',
        `Maximum duration is ${maxDuration} minutes. Food cannot be given more than ${MAX_FOOD_DURATION_HOURS} hours after arrival.`,
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
        `Duration cannot exceed ${maxDuration} minutes due to food safety regulations (max ${MAX_FOOD_DURATION_HOURS} hours from arrival)`,
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
        foods: foods.filter((f) => f.item?.trim()),
        images: [...images, ...uploadedImages].filter((img) => img.trim()),
        foodArrived: Timestamp.fromDate(foodArrived),
        foodAvailable: Timestamp.fromDate(foodAvailable),
      };

      if (event?.id && onSave) {
        await onSave({ ...updates, id: event.id });
      } else if (onCreate) {
        await onCreate(updates);
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const addFoodItem = () => {
    setFoods([
      ...foods,
      { id: Date.now().toString(), item: '', quantity: '', unit: 'pieces' },
    ]);
  };

  const updateFoodItem = (
    index: number,
    field: keyof FoodItem,
    value: string,
  ) => {
    const updated = [...foods];
    updated[index] = { ...updated[index], [field]: value };
    setFoods(updated);
  };

  const removeFoodItem = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const getTotalSelectedImages = () => images.length + uploadedImages.length;

  const canSelectMoreImages = () => getTotalSelectedImages() < 2;

  const toggleDefaultImage = (imgUri: string) => {
    if (images.includes(imgUri)) {
      setImages(images.filter((img) => img !== imgUri));
    } else {
      if (!canSelectMoreImages()) {
        Alert.alert(
          'Limit Reached',
          'You can only select up to 2 images total.',
        );
        return;
      }
      setImages([...images, imgUri]);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // ----- Date pickers (iOS text forced to black via textColor) -----
  const handleArrivedDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (event.type === 'dismissed' || !selectedDate) {
        setShowArrivedPicker(false);
        return;
      }
    }
    if (!selectedDate) return;

    const maxAvailable = new Date(
      selectedDate.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000,
    );
    setFoodArrived(selectedDate);

    if (foodAvailable > maxAvailable) {
      setFoodAvailable(maxAvailable);
      setTimeout(() => {
        Alert.alert(
          'Pickup Time Adjusted',
          `Pickup time was adjusted to ${MAX_FOOD_DURATION_HOURS} hours after arrival (food safety limit)`,
        );
      }, 100);
    } else if (foodAvailable < selectedDate) {
      setFoodAvailable(selectedDate);
    }
  };

  const handleAvailableDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (event.type === 'dismissed' || !selectedDate) {
        setShowAvailablePicker(false);
        return;
      }
    }
    if (!selectedDate) return;

    if (selectedDate < foodArrived) {
      setTimeout(() => {
        Alert.alert('Invalid Time', 'Pickup time must be after arrival time');
      }, 100);
      return;
    }

    const maxAvailable = new Date(
      foodArrived.getTime() + MAX_FOOD_DURATION_HOURS * 60 * 60 * 1000,
    );
    if (selectedDate > maxAvailable) {
      setTimeout(() => {
        Alert.alert(
          'Time Limit Exceeded',
          `Pickup time cannot be more than ${MAX_FOOD_DURATION_HOURS} hours after arrival (food safety limit)`,
        );
      }, 100);
      return;
    }
    setFoodAvailable(selectedDate);
  };

  const handleAddImage = async () => {
    if (!canSelectMoreImages()) {
      Alert.alert('Limit Reached', 'You can only select up to 2 images total.');
      return;
    }
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to upload images.',
        );
        return;
      }

      const remainingSlots = 2 - getTotalSelectedImages();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (result.canceled) return;
      const uploadedUrls: string[] = [];

      for (const asset of result.assets) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const fileName = `event_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const storageRef = ref(storage, `events/${fileName}`);

        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }
      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading image(s):', error);
      Alert.alert(
        'Upload Failed',
        'Could not upload one or more images. Please try again.',
      );
    }
  };

  // Preset picker helpers
  const openPresetPicker = () => setShowLocationDropdown(true);
  const closePresetPicker = () => setShowLocationDropdown(false);
  const applyPreset = (index: number) => {
    const p = PRESET_LOCATIONS[index];
    setSelectedPresetIndex(index);
    setLocationName(p.name);
    setLocationAddress(p.address);
    setCampusSection(p.campus_section);
    closePresetPicker();
  };
  const clearPreset = () => {
    setSelectedPresetIndex(null);
    closePresetPicker();
  };

  // If user edits location fields manually, clear preset selection
  const onChangeLocationName = (v: string) => {
    if (selectedPresetIndex !== null) setSelectedPresetIndex(null);
    setLocationName(v);
  };
  const onChangeLocationAddress = (v: string) => {
    if (selectedPresetIndex !== null) setSelectedPresetIndex(null);
    setLocationAddress(v);
  };
  const onChangeCampusSection = (v: string) => {
    if (selectedPresetIndex !== null) setSelectedPresetIndex(null);
    setCampusSection(v);
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
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
        imageRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        imageItem: {
          position: 'relative',
        },
        imagePreview: {
          width: 120,
          height: 120,
          borderRadius: borderRadius.md,
        },
        deleteButton: {
          position: 'absolute',
          top: 4,
          right: 4,
          backgroundColor: colors.error,
          borderRadius: 12,
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
        },
        deleteText: {
          color: colors.text.onPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        removeButton: {
          padding: spacing.sm,
          backgroundColor: colors.error,
          borderRadius: borderRadius.sm,
          justifyContent: 'center',
          alignItems: 'center',
          width: 40,
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
        defaultImageGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        defaultImageWrapper: {
          width: '48%',
          aspectRatio: 1,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          borderWidth: 3,
          borderColor: 'transparent',
          backgroundColor: colors.surface,
        },
        selectedDefaultImage: {
          borderColor: colors.primary,
        },
        defaultImage: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        selectedImagesContainer: {
          marginBottom: spacing.lg,
        },
        imageSection: {
          marginBottom: spacing.lg,
        },
        subsectionTitle: {
          ...typography.body,
          color: colors.text.primary,
          fontWeight: '600',
          marginBottom: spacing.sm,
        },
        imageLabel: {
          position: 'absolute',
          bottom: 4,
          left: 4,
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.sm,
        },
        imageLabelText: {
          ...typography.caption,
          color: colors.text.onPrimary,
          fontWeight: '600',
          fontSize: 10,
        },
        selectedOverlay: {
          position: 'absolute',
          top: 4,
          right: 4,
          backgroundColor: colors.primary,
          borderRadius: 12,
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
        },
        selectedCheckmark: {
          color: colors.text.onPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        addButtonDisabled: {
          backgroundColor: colors.surface,
          borderColor: colors.border.light,
          opacity: 0.5,
        },
        addButtonTextDisabled: {
          color: colors.text.secondary,
        },

        // Preset UI
        presetButtonRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        },
        presetButton: {
          alignSelf: 'flex-start',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.default,
          borderRadius: borderRadius.sm,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        presetButtonText: {
          ...typography.bodySmall,
          color: colors.primary,
          fontWeight: '600',
        },
        presetBadge: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: borderRadius.sm,
        },
        presetBadgeText: {
          ...typography.caption,
          color: colors.text.onPrimary,
          fontWeight: '600',
        },
        presetModalBackdrop: {
          flex: 1,
          backgroundColor: '#00000066',
        },
        presetModalSheet: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '70%',
          backgroundColor: colors.surface,
          borderTopLeftRadius: borderRadius.md,
          borderTopRightRadius: borderRadius.md,
          padding: spacing.lg,
          borderTopWidth: 1,
          borderColor: colors.border.light,
        },
        presetModalTitle: {
          ...typography.h6,
          color: colors.text.primary,
          marginBottom: spacing.md,
        },
        presetList: {
          marginBottom: spacing.md,
        },
        presetOption: {
          borderWidth: 1,
          borderColor: colors.border.default,
          borderRadius: borderRadius.sm,
          padding: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: colors.surface,
        },
        presetOptionSelected: {
          borderColor: colors.primary,
        },
        presetOptionLabel: {
          ...typography.body,
          color: colors.text.primary,
          fontWeight: '600',
          marginBottom: 2,
        },
        presetOptionSub: {
          ...typography.caption,
          color: colors.text.secondary,
          marginBottom: 2,
        },
        presetOptionMeta: {
          ...typography.caption,
          color: colors.text.secondary,
          fontStyle: 'italic',
        },
        presetActions: {
          flexDirection: 'row',
          gap: spacing.md,
        },
      }),
    [colors],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {event?.id ? 'Edit Event' : 'Create Event'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
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
            onPress={() => {
              if (Platform.OS === 'android') {
                DateTimePickerAndroid.open({
                  value: foodArrived,
                  mode: 'date',
                  minimumDate: new Date(),
                  onChange: (event, date) => {
                    if (event.type === 'set' && date) {
                      DateTimePickerAndroid.open({
                        value: date,
                        mode: 'time',
                        onChange: (timeEvent, time) => {
                          if (timeEvent.type === 'set' && time) {
                            handleArrivedDateChange(timeEvent, time);
                          }
                        },
                      });
                    }
                  },
                });
              } else {
                setShowArrivedPicker(true);
              }
            }}
          >
            <Text style={styles.dateButtonText}>
              📅 {formatDate(foodArrived)}
            </Text>
          </Pressable>
          {Platform.OS === 'ios' && showArrivedPicker && (
            <>
              <DateTimePicker
                value={foodArrived}
                mode="datetime"
                display="spinner"
                onChange={handleArrivedDateChange}
                minimumDate={new Date()}
                /* Force black text on iOS pickers */
                textColor="black"
              />
              <Pressable
                style={styles.doneButton}
                onPress={() => setShowArrivedPicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.label}>Available for Pickup</Text>
          <Text style={styles.helperText}>
            Must be within {MAX_FOOD_DURATION_HOURS} hours of arrival time (food
            safety)
          </Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => {
              if (Platform.OS === 'android') {
                DateTimePickerAndroid.open({
                  value: foodAvailable,
                  mode: 'date',
                  minimumDate: foodArrived,
                  maximumDate: maxAvailableTime,
                  onChange: (event, date) => {
                    if (event.type === 'set' && date) {
                      DateTimePickerAndroid.open({
                        value: date,
                        mode: 'time',
                        onChange: (timeEvent, time) => {
                          if (timeEvent.type === 'set' && time) {
                            handleAvailableDateChange(timeEvent, time);
                          }
                        },
                      });
                    }
                  },
                });
              } else {
                setShowAvailablePicker(true);
              }
            }}
          >
            <Text style={styles.dateButtonText}>
              📅 {formatDate(foodAvailable)}
            </Text>
          </Pressable>
          {Platform.OS === 'ios' && showAvailablePicker && (
            <>
              <DateTimePicker
                value={foodAvailable}
                mode="datetime"
                display="spinner"
                onChange={handleAvailableDateChange}
                minimumDate={foodArrived}
                maximumDate={maxAvailableTime}
                /* Force black text on iOS pickers */
                textColor="black"
              />
              <Pressable
                style={styles.doneButton}
                onPress={() => setShowAvailablePicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.label}>
            Duration (minutes) - Max: {maxDuration} min
          </Text>
          <Text style={styles.helperText}>
            Food must be closed within {MAX_FOOD_DURATION_HOURS} hours of
            arrival. Current gap between arrival and pickup:{' '}
            {Math.floor(
              (foodAvailable.getTime() - foodArrived.getTime()) / 60000,
            )}{' '}
            minutes
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

          {/* Preset trigger row with selected label shown beside the button */}
          <View style={styles.presetButtonRow}>
            <Pressable style={styles.presetButton} onPress={openPresetPicker}>
              <Text style={styles.presetButtonText}>
                {selectedPresetIndex !== null
                  ? 'Change preset'
                  : 'Choose from presets (optional)'}
              </Text>
            </Pressable>
            {selectedPresetIndex !== null && (
              <View style={styles.presetBadge}>
                <Text style={styles.presetBadgeText}>
                  {PRESET_LOCATIONS[selectedPresetIndex].label}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.helperText}>
            You can still type a custom location below even after choosing a
            preset.
          </Text>

          <Text style={styles.label}>Location Name</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={onChangeLocationName}
            placeholder="e.g., Engineering Building"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={locationAddress}
            onChangeText={onChangeLocationAddress}
            placeholder="e.g., 8 St. Mary's St"
            placeholderTextColor={colors.text.secondary}
          />

          <Text style={styles.label}>Campus Section</Text>
          <TextInput
            style={styles.input}
            value={campusSection}
            onChangeText={onChangeCampusSection}
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
            {(['drafted', 'saved', 'open', 'closed'] as EventStatus[]).map(
              (s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusChip,
                    status === s && styles.statusChipActive,
                  ]}
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
              ),
            )}
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
                  onChangeText={(text) =>
                    updateFoodItem(index, 'quantity', text)
                  }
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
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.helperText}>
            Select up to 2 images total (default + uploaded). Current:{' '}
            {getTotalSelectedImages()}/2
          </Text>

          {(images.length > 0 || uploadedImages.length > 0) && (
            <View style={styles.selectedImagesContainer}>
              <Text style={styles.subsectionTitle}>Selected Images</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {images.map((uri, index) => (
                  <View key={`default-${index}`} style={styles.imageItem}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <View style={styles.imageLabel}>
                      <Text style={styles.imageLabelText}>Default</Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() =>
                        setImages(images.filter((_, i) => i !== index))
                      }
                    >
                      <Text style={styles.deleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {uploadedImages.map((uri, index) => (
                  <View key={`uploaded-${index}`} style={styles.imageItem}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <View style={styles.imageLabel}>
                      <Text style={styles.imageLabelText}>Uploaded</Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => removeUploadedImage(index)}
                    >
                      <Text style={styles.deleteText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Default Images Section */}
          <View style={styles.imageSection}>
            <Text style={styles.subsectionTitle}>Default Images</Text>
            <Text style={styles.helperText}>
              Tap to select from default options
            </Text>
            <View style={styles.defaultImageGrid}>
              {DEFAULT_IMAGES.map((img, index) => {
                const imgUri = Image.resolveAssetSource(img).uri;
                const isSelected = images.includes(imgUri);
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.defaultImageWrapper,
                      isSelected && styles.selectedDefaultImage,
                    ]}
                    onPress={() => toggleDefaultImage(imgUri)}
                  >
                    <Image source={img} style={styles.defaultImage} />
                    {isSelected && (
                      <View style={styles.selectedOverlay}>
                        <Text style={styles.selectedCheckmark}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Upload Section */}
          <View style={styles.imageSection}>
            <Text style={styles.subsectionTitle}>Upload Your Own</Text>
            <Text style={styles.helperText}>
              Upload up to {2 - getTotalSelectedImages()} more image(s)
            </Text>
            <Pressable
              style={[
                styles.addButton,
                !canSelectMoreImages() && styles.addButtonDisabled,
              ]}
              onPress={handleAddImage}
              disabled={!canSelectMoreImages()}
            >
              <Text
                style={[
                  styles.addButtonText,
                  !canSelectMoreImages() && styles.addButtonTextDisabled,
                ]}
              >
                {canSelectMoreImages() ? 'Upload Photo' : 'Limit Reached'}
              </Text>
            </Pressable>
          </View>
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

      {/* Preset Location Modal */}
      <Modal
        visible={showLocationDropdown}
        transparent
        animationType="fade"
        onRequestClose={closePresetPicker}
      >
        <Pressable
          style={styles.presetModalBackdrop}
          onPress={closePresetPicker}
        >
          <View />
        </Pressable>
        <View style={styles.presetModalSheet}>
          <Text style={styles.presetModalTitle}>Pick a location</Text>
          <ScrollView style={styles.presetList}>
            {PRESET_LOCATIONS.map((p, idx) => (
              <Pressable
                key={p.label}
                style={[
                  styles.presetOption,
                  selectedPresetIndex === idx && styles.presetOptionSelected,
                ]}
                onPress={() => applyPreset(idx)}
              >
                <Text style={styles.presetOptionLabel}>{p.label}</Text>
                <Text style={styles.presetOptionSub}>{p.address}</Text>
                <Text style={styles.presetOptionMeta}>
                  Section: {p.campus_section}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.presetActions}>
            <Pressable
              style={[styles.footerButton, styles.cancelButton]}
              onPress={clearPreset}
            >
              <Text style={styles.cancelButtonText}>Clear</Text>
            </Pressable>
            <Pressable
              style={[styles.footerButton, styles.saveButton]}
              onPress={closePresetPicker}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
