// app/(student)/settings/page.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useTheme } from '../../../src/lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../../../src/lib/theme';
import NotificationsToggle from '../../../src/components/NotificationsToggle';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { colors, themeMode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Manage your settings and preferences
      </Text>

      {/* Theme Toggle */}
      <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Theme</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            {themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
          </Text>
        </View>
        <Switch
          value={themeMode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border.default, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* Notifications Toggle */}
      <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Notifications</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Enable push notifications for events
          </Text>
        </View>
        <NotificationsToggle showLabel={false} />
      </View>

      {/* Sign Out Button */}
      <Pressable
        style={[styles.signOutButton, { backgroundColor: colors.error }]}
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: colors.text.onPrimary }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + 20,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    ...typography.caption,
  },
  signOutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  signOutText: {
    ...typography.body,
    fontWeight: '600',
  },
});

