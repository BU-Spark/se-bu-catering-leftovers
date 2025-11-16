// src/components/NotificationsToggle.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { getUser, setNotificationsEnabled } from '../lib/firebase/users';
import { useTheme } from '../lib/ThemeProvider';
import { spacing, typography } from '../lib/theme';

interface NotificationsToggleProps {
  showLabel?: boolean;
}

export default function NotificationsToggle({
  showLabel = true,
}: NotificationsToggleProps) {
  const { user, isLoaded } = useUser();
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const uid = user?.id;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const doc = await getUser(uid);
    setEnabled(doc?.notificationsEnabled !== false);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (isLoaded && uid) load();
  }, [isLoaded, uid, load]);

  const onToggle = async (value: boolean) => {
    if (!uid) return;
    setEnabled(value);
    await setNotificationsEnabled(uid, value);
    if (value) {
      await registerForPushNotificationsAsync(
        uid,
        user?.primaryEmailAddress?.emailAddress ?? undefined,
      );
    }
  };

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
    >
      {showLabel && (
        <Text style={[typography.body, { color: colors.text.primary }]}>
          Notifications
        </Text>
      )}
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border.default, true: colors.primary }}
          thumbColor={colors.surface}
        />
      )}
    </View>
  );
}
