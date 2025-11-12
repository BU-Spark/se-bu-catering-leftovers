//src/components/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase/config';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import NotificationsToggle from './NotificationsToggle';

type SettingsScreenProps = {
  role: 'admin' | 'student';
};

export default function SettingsScreen({ role }: SettingsScreenProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { colors, themeMode, toggleTheme } = useTheme();
  
  const [name, setName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(firestore, 'Users', user.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setName(userData.name || '');
        setSelectedLocations(userData.locPref || []);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const editNameRoute = '/settings/edit-name';
  const editLocationsRoute = '/settings/edit-location';
  const faqRoute = '/settings/faq'; // student FAQs (hidden from tab bar)

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        {role === 'admin' ? 'Manage admin settings and preferences' : 'Manage your settings and preferences'}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Profile</Text>

      <Pressable 
        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}
        onPress={() => router.push(editNameRoute as any)}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Display Name</Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>{name || 'Not set'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </Pressable>

      <Pressable 
        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}
        onPress={() => router.push(editLocationsRoute as any)}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Campus Preferences</Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
            {selectedLocations.length > 0 ? selectedLocations.join(', ') : 'None selected'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.xl }]}>App Settings</Text>

      <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Theme</Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
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

      <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Notifications</Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
            Receive event updates
          </Text>
        </View>
        <NotificationsToggle showLabel={false} />
      </View>

      {/* Student-only FAQ redirect (route exists at app/(student)/settings/faq.tsx). Not in tab bar. */}
      {role === 'student' && (
        <Pressable
          style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border.light }]}
          onPress={() => router.push(faqRoute as any)}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Student FAQs</Text>
            <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
              Common questions about using the app
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </Pressable>
      )}

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
  loadingText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
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
  sectionTitle: {
    ...typography.h5,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
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
  settingValue: {
    ...typography.bodySmall,
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
