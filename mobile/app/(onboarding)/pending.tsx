// app/(onboarding)/pending.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/lib/ThemeProvider';
import { spacing, typography, borderRadius } from '../../src/lib/theme';

export default function PendingScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleContinueAsStudent = () => {
    router.replace('/(student)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>Access request pending</Text>

        <Text style={styles.body}>
          An admin is reviewing your staff access request.
        </Text>
        <Text style={styles.bodySecondary}>
          You can use the app as a student until approval.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={handleContinueAsStudent}
        >
          <Text style={styles.primaryButtonText}>
            Continue as student for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    emoji: {
      fontSize: 56,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.body,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    bodySecondary: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
    },
    primaryButtonText: {
      ...typography.h5,
      color: colors.text.onPrimary,
      fontWeight: '600',
    },
  });
