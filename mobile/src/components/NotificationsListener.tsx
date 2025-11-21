import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export default function NotificationsListener() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const eventId = response?.notification?.request?.content?.data
          ?.eventId as string | undefined;
        if (eventId) {
          router.push({
            pathname: '/(student)',
            params: { focusEventId: eventId },
          });
        }
      },
    );
    return () => sub.remove();
  }, []);
  return null;
}
