// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  ensureUser,
  setPushToken,
  setNotificationsEnabled,
  getPushTokensByRole,
} from './firebase/users';

/** Foreground behavior */
Notifications.setNotificationHandler({
  handleNotification: async () => {
    if (Platform.OS === 'ios') {
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    } as any;
  },
});

/** Android channel */
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  }).catch(() => {});
}

/** Ask perms, get Expo token, save it */
export async function registerForPushNotificationsAsync(uid: string, email?: string) {
  if (!Device.isDevice) {
    console.log('🏗️ Push requires a physical device.');
    return null;
  }

  await ensureUser(uid, { email });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';
  await setNotificationsEnabled(uid, granted);
  if (!granted) return null;

  const projectId =
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    '';
  if (!projectId) throw new Error('Missing Expo projectId in extra.eas.projectId');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setPushToken(uid, token, Platform.OS);
  return token;
}

/** Low-level sender */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!tokens.length) return;
  const endpoint = 'https://exp.host/--/api/v2/push/send';
  const batchSize = 90;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const slice = tokens.slice(i, i + batchSize);
    const messages = slice.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      priority: 'high',
      channelId: 'default',
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      // Optional: inspect response
      await res.text();
    } catch (e) {
      console.warn('❌ Push send failed:', e);
    }
  }
}

/** Role helpers */
export async function notifyAdmins(title: string, body: string, data?: Record<string, any>) {
  const tokens = await getPushTokensByRole('Admin');
  await sendPush(tokens, title, body, data);
}
export async function notifyStudents(title: string, body: string, data?: Record<string, any>) {
  const tokens = await getPushTokensByRole('User');
  await sendPush(tokens, title, body, data);
}
