// src/components/NotificationsToggle.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { getUser, setNotificationsEnabled } from '../lib/firebase/users';
import { colors, spacing, typography } from '../lib/theme';

export default function NotificationsToggle() {
  const { user, isLoaded } = useUser();
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
        user?.primaryEmailAddress?.emailAddress ?? undefined
      );
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Text style={[typography.body, { color: colors.text.primary }]}>Notifications</Text>
      {loading ? <ActivityIndicator /> : <Switch value={enabled} onValueChange={onToggle} />}
    </View>
  );
}
