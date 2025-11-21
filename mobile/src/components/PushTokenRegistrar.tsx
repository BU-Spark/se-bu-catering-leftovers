// src/components/PushTokenRegistrar.tsx
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { registerForPushNotificationsAsync } from '../lib/notifications';

export default function PushTokenRegistrar() {
  const { isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? undefined;

  useEffect(() => {
    if (!isSignedIn || !isLoaded || !user?.id) return;
    registerForPushNotificationsAsync(user.id, primaryEmail).catch(() => {});
  }, [isSignedIn, isLoaded, user?.id, primaryEmail]);

  return null;
}
