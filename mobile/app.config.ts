// mobile/app.config.ts
import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as dotenv from 'dotenv';

// Local-only fallback. On EAS, set Secrets instead of committing .env.local.
dotenv.config({ path: '.env.local' });

const required = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing environment variable: ${key}`);
  return v;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: config.name ?? 'mobile',
    slug: config.slug ?? 'mobile',
    scheme: 'leftovers',
    extra: {
      firebase: {
        apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY'),
        authDomain: required('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        projectId: required('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
        storageBucket: required('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
        ...(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
          ? { databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL }
          : {}),
      },
      clerk: {
        publishableKey: required('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
      },
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
      },
      useEmulators: true,
      emulatorHost: '127.0.0.1'
    },
    plugins: [
      'expo-router',
      'expo-notifications', // add plugin options here if needed
    ],
    ios: {
      supportsTablet: true,
    },
    android: {
      // Correct permission for Android 13+ notifications
      permissions: ['android.permission.POST_NOTIFICATIONS'],
    },
  };
};
