import { Slot } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import PushTokenRegistrar from '../src/components/PushTokenRegistrar';
import NotificationsListener from '../src/components/NotificationsListener';
import { ThemeProvider } from '../src/lib/ThemeProvider';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <ThemeProvider>
        <PushTokenRegistrar />
        <NotificationsListener />
        <Slot />
      </ThemeProvider>
    </ClerkProvider>
  );
}
