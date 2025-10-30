// mobile/app.config.ts
import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: config.name ?? 'mobile',
  slug: config.slug ?? 'mobile',
  scheme: 'leftovers',
  extra: {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    },
    clerk: {
      publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
    },
    // ✅ Add your EAS project ID here (set via .env as EXPO_PUBLIC_EAS_PROJECT_ID)
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
    },
    // Keep emulator toggle if you added it earlier; default false
    useEmulators: false,
  },
  plugins: ['expo-router', 'expo-notifications'],
  ios: { supportsTablet: true },
  android: { permissions: ['NOTIFICATIONS'] },
});
