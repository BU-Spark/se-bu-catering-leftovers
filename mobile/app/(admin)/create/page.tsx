// app/(admin)/create/page.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { EventEditorModal } from '../../../src/components/EventEditorModal';
import { createEvent } from '../../../src/lib/firebase/events';
import type { Event } from '../../../src/types';
import { getUser } from '../../../src/lib/firebase/users';
import { sendPush, notifyStudents } from '../../../src/lib/notifications';

export default function CreateEventScreen() {
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);

  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      const eventId = await createEvent({ ...eventData, creatorUid: user?.id });

      const locationBits = [
        eventData?.Location?.name,
        eventData?.Location?.address,
        eventData?.locationDetails,
      ].filter(Boolean);
      const loc = locationBits.join(' • ') || 'BU Campus';

      const creatorUid = user?.id ?? '';
      if (creatorUid) {
        const adminUser = await getUser(creatorUid);
        const token = adminUser?.pushToken ? [adminUser.pushToken] : [];
        if (token.length) {
          await sendPush(
            token,
            'Catering Leftovers',
            `${eventData.name ?? 'Event'} created at ${loc}`,
            { eventId }
          );
        }
      }

      if ((eventData.status ?? 'drafted') === 'open') {
        await notifyStudents(
          'Catering Leftovers',
          `${eventData.name ?? 'An event'} • ${loc} • Tap for details.`,
          { eventId }
        );
      }

      Alert.alert('Success', 'Event created successfully!');
      setShowModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Event</Text>
      <Text style={styles.subtitle}>Create a new food event for students</Text>
      <View style={styles.content}>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Tap the button below to create a new event with all the details like location, food items, and timing.
          </Text>
        </View>
        <Pressable style={styles.createButton} onPress={() => setShowModal(true)}>
          <Text style={styles.createButtonText}>+ Create New Event</Text>
        </Pressable>
      </View>
      <EventEditorModal
        visible={showModal}
        event={null}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xxl + 20,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  instructionBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    maxWidth: 300,
  },
  instructionText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createButtonText: {
    ...typography.h5,
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
});
