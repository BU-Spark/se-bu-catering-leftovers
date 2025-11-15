// app/(admin)/analytics/page.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/lib/ThemeProvider';
import { typography, spacing } from '../../../src/lib/theme';
import CoreImpactMetrics from '../../../src/components/CoreImpactMetrics';
import { useUser } from '@clerk/clerk-expo';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.lg,
          paddingTop: spacing.xxl + 20,
          justifyContent: 'flex-start',
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
        message: {
          ...typography.body,
          color: colors.text.secondary,
          marginTop: spacing.lg,
        },
      }),
    [colors]
  );

  const role =
    (user?.publicMetadata as any)?.role?.toString().toLowerCase() ?? 'student';

  // Staff see a simple message.
  if (role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.message}>
          This page is only available to admins.
        </Text>
      </View>
    );
  }

  // Admin-only view
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>View event statistics and insights</Text>

      {/* Metric card component */}
      <CoreImpactMetrics />
    </View>
  );
}
