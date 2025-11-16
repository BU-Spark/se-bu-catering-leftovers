// src/components/SettingsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase/config';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import NotificationsToggle from './NotificationsToggle';
import {
  fetchPendingStaff,
  fetchActiveStaff,
  approveStaff,
  revokeStaff,
  RbacUser,
} from '../lib/rbacClient';

type SettingsScreenProps = {
  role: 'admin' | 'student' | 'staff';
};

export default function SettingsScreen({ role }: SettingsScreenProps) {
  const { signOut, getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { colors, themeMode, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin-only RBAC state
  const [pendingStaff, setPendingStaff] = useState<RbacUser[]>([]);
  const [activeStaff, setActiveStaff] = useState<RbacUser[]>([]);
  const [loadingAdminLists, setLoadingAdminLists] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const hasLoadedAdminLists = useRef(false);

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

  const loadAdminLists = useCallback(async () => {
    if (role !== 'admin') return;

    setLoadingAdminLists(true);
    setPendingError(null);
    setStaffError(null);

    try {
      const [pendingRes, staffRes] = await Promise.all([
        fetchPendingStaff(getToken).catch((err: any) => {
          console.error('Failed to load pending staff:', err);
          setPendingError(err?.message ?? 'Failed to load staff requests');
          return { pending: [] as RbacUser[] };
        }),
        fetchActiveStaff(getToken).catch((err: any) => {
          console.error('Failed to load active staff:', err);
          setStaffError(err?.message ?? 'Failed to load active staff');
          return { staff: [] as RbacUser[] };
        }),
      ]);

      setPendingStaff(pendingRes.pending);
      setActiveStaff(staffRes.staff);
    } finally {
      setLoadingAdminLists(false);
    }
  }, [role, getToken]);

  useEffect(() => {
    // Fire-and-forget: admin lists load in the background once per mount
    if (role === 'admin' && isSignedIn && !hasLoadedAdminLists.current) {
      hasLoadedAdminLists.current = true;
      loadAdminLists();
    }
  }, [role, isSignedIn, loadAdminLists]);

  const handleApprove = async (uid: string) => {
    try {
      await approveStaff(uid, getToken);
      Alert.alert('Approved', 'Staff access has been approved.');
      await loadAdminLists();
    } catch (err: any) {
      console.error('Failed to approve staff:', err);
      Alert.alert('Error', err?.message ?? 'Failed to approve staff');
    }
  };

  const handleRevoke = async (uid: string) => {
    try {
      await revokeStaff(uid, getToken);
      Alert.alert(
        'Updated',
        'Staff access has been revoked / request rejected.',
      );
      await loadAdminLists();
    } catch (err: any) {
      console.error('Failed to revoke staff:', err);
      Alert.alert('Error', err?.message ?? 'Failed to revoke staff');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const editNameRoute = '/settings/edit-name';
  const editLocationsRoute = '/settings/edit-location';
  const faqRoute = '/settings/faq'; // student FAQs (hidden from tab bar)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Settings
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        {role === 'admin'
          ? 'Manage admin settings and staff access'
          : role === 'staff'
            ? 'Manage your staff settings and preferences'
            : 'Manage your settings and preferences'}
      </Text>

      {/* Profile */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Profile
      </Text>

      <Pressable
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface, borderColor: colors.border.light },
        ]}
        onPress={() => router.push(editNameRoute as any)}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Display Name
          </Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
            {name || 'Not set'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.secondary}
        />
      </Pressable>

      <Pressable
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface, borderColor: colors.border.light },
        ]}
        onPress={() => router.push(editLocationsRoute as any)}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Campus Preferences
          </Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
            {selectedLocations.length > 0
              ? selectedLocations.join(', ')
              : 'None selected'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.secondary}
        />
      </Pressable>

      {/* Admin-only staff management */}
      {role === 'admin' && (
        <>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, marginTop: spacing.xl },
            ]}
          >
            Staff access requests
          </Text>

          <View
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border.light,
                flexDirection: 'column',
                alignItems: 'stretch',
              },
            ]}
          >
            {loadingAdminLists && pendingStaff.length === 0 ? (
              <View style={styles.centerRow}>
                <ActivityIndicator color={colors.primary} />
                <Text
                  style={[
                    styles.smallText,
                    { color: colors.text.secondary, marginLeft: spacing.sm },
                  ]}
                >
                  Loading requests...
                </Text>
              </View>
            ) : pendingError ? (
              <View>
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  {pendingError}
                </Text>
                <Pressable
                  onPress={loadAdminLists}
                  style={[styles.pillButton, { marginTop: spacing.sm }]}
                >
                  <Text
                    style={[styles.pillButtonText, { color: colors.primary }]}
                  >
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : pendingStaff.length === 0 ? (
              <Text
                style={[styles.settingValue, { color: colors.text.secondary }]}
              >
                No pending staff requests.
              </Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {pendingStaff.map((u) => (
                  <View key={u.userId} style={styles.pendingRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.text.primary },
                        ]}
                      >
                        {u.email || u.userId}
                      </Text>
                      <Text
                        style={[
                          styles.settingValue,
                          { color: colors.text.secondary },
                        ]}
                      >
                        Role: {u.role} • Status: {u.status}
                      </Text>
                    </View>
                    <View style={styles.pendingActions}>
                      <Pressable
                        style={[
                          styles.pillButton,
                          { borderColor: colors.success },
                        ]}
                        onPress={() => handleApprove(u.userId)}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            { color: colors.success },
                          ]}
                        >
                          Approve
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.pillButton,
                          { borderColor: colors.error },
                        ]}
                        onPress={() => handleRevoke(u.userId)}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            { color: colors.error },
                          ]}
                        >
                          Revoke
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, marginTop: spacing.lg },
            ]}
          >
            Existing staff
          </Text>

          <View
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border.light,
                flexDirection: 'column',
                alignItems: 'stretch',
              },
            ]}
          >
            {loadingAdminLists && activeStaff.length === 0 ? (
              <View style={styles.centerRow}>
                <ActivityIndicator color={colors.primary} />
                <Text
                  style={[
                    styles.smallText,
                    { color: colors.text.secondary, marginLeft: spacing.sm },
                  ]}
                >
                  Loading staff...
                </Text>
              </View>
            ) : staffError ? (
              <View>
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  {staffError}
                </Text>
                <Pressable
                  onPress={loadAdminLists}
                  style={[styles.pillButton, { marginTop: spacing.sm }]}
                >
                  <Text
                    style={[styles.pillButtonText, { color: colors.primary }]}
                  >
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : activeStaff.length === 0 ? (
              <Text
                style={[styles.settingValue, { color: colors.text.secondary }]}
              >
                No active staff members yet.
              </Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {activeStaff.map((u) => (
                  <View key={u.userId} style={styles.pendingRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.text.primary },
                        ]}
                      >
                        {u.email || u.userId}
                      </Text>
                      <Text
                        style={[
                          styles.settingValue,
                          { color: colors.text.secondary },
                        ]}
                      >
                        Role: {u.role} • Status: {u.status}
                      </Text>
                    </View>
                    <View style={styles.pendingActions}>
                      <Pressable
                        style={[
                          styles.pillButton,
                          { borderColor: colors.error },
                        ]}
                        onPress={() => handleRevoke(u.userId)}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            { color: colors.error },
                          ]}
                        >
                          Revoke
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* App Settings */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text.primary, marginTop: spacing.xl },
        ]}
      >
        App Settings
      </Text>

      <View
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface, borderColor: colors.border.light },
        ]}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Theme
          </Text>
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

      <View
        style={[
          styles.settingItem,
          { backgroundColor: colors.surface, borderColor: colors.border.light },
        ]}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
            Notifications
          </Text>
          <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
            Receive event updates
          </Text>
        </View>
        <NotificationsToggle showLabel={false} />
      </View>

      {/* Student-only FAQ redirect */}
      {role === 'student' && (
        <Pressable
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border.light,
            },
          ]}
          onPress={() => router.push(faqRoute as any)}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
              Student FAQs
            </Text>
            <Text
              style={[styles.settingValue, { color: colors.text.secondary }]}
            >
              Common questions about using the app
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.secondary}
          />
        </Pressable>
      )}

      <Pressable
        style={[styles.signOutButton, { backgroundColor: colors.error }]}
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: colors.text.onPrimary }]}>
          Sign Out
        </Text>
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
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallText: {
    ...typography.bodySmall,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  pillButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
