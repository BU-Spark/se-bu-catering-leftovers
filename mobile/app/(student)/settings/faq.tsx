import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../../../src/lib/theme';

type FaqItem = { id: string; q: string; a: string };

const STUDENT_FAQS: FaqItem[] = [
  {
    id: 'who-can-claim',
    q: 'Who can claim free leftovers?',
    a: 'Any BU student with a valid ID can claim food while supplies last and within the posted pickup window.',
  },
  {
    id: 'pickup-window',
    q: 'How long is food available?',
    a: 'Food must be picked up within 4 hours of arrival for safety; each post shows the exact closing time.',
  },
  {
    id: 'status-meaning',
    q: 'What do the event statuses mean?',
    a: '“Open” = available now, “Closed” = ended, “Saved/Drafted” = organizer prep, not visible to students.',
  },
  {
    id: 'notifications',
    q: 'How do I get notifications?',
    a: 'Go to Settings → Notifications and enable push; allow system permissions to receive alerts.',
  },
  {
    id: 'allergies',
    q: 'Are allergens listed?',
    a: 'Organizers can add notes and food items, but always double-check in person if you have allergies.',
  },
  {
    id: 'finding-location',
    q: 'How do I find the pickup location?',
    a: 'Each post includes a name, address, campus section, and details (e.g., “Room 101, first floor”).',
  },
  {
    id: 'arriving-late',
    q: 'What if I arrive after the closing time?',
    a: 'Events close automatically; if you are late and food is gone or closed, we can’t guarantee availability.',
  },
  {
    id: 'report-issue',
    q: 'How do I report incorrect info?',
    a: 'Use the in-app feedback flow (Student → Feedback) and include the event name, time, and issue details.',
  },
  {
    id: 'photos-privacy',
    q: 'Why do some posts include photos?',
    a: 'Photos help students see what’s available; images are provided by organizers.',
  },
  {
    id: 'favorites',
    q: 'Can I follow certain buildings or hosts?',
    a: 'This isn’t available yet; for now, enable notifications to get timely alerts for all new posts.',
  },
];

export default function StudentFAQ() {
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: spacing.xxl + 20,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          gap: spacing.md,
        },
        headerTitle: { ...typography.h4, color: colors.text.primary, flex: 1 },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.default,
        },
        content: { padding: spacing.lg },
        card: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.light,
          borderRadius: borderRadius.md,
          marginBottom: spacing.md,
          overflow: 'hidden',
        },
        questionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        questionText: { ...typography.body, color: colors.text.primary, fontWeight: '600', flex: 1, paddingRight: spacing.md },
        chevron: { marginLeft: spacing.sm },
        answer: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
        answerText: { ...typography.body, color: colors.text.secondary },
      }),
    [colors]
  );

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Student FAQs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {STUDENT_FAQS.map(item => {
          const open = expandedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <Pressable
                onPress={() => toggle(item.id)}
                style={styles.questionRow}
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${item.q}`}
              >
                <Text style={styles.questionText}>{item.q}</Text>
                <Ionicons
                  style={styles.chevron}
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </Pressable>
              {open && (
                <View style={styles.answer}>
                  <Text style={styles.answerText}>{item.a}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
