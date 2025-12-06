// mobile/app.config.ts
import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

// Local-only fallback. On EAS, set Secrets instead of committing .env.local.
const envFiles = [
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '../.env.local'),
];

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

const required = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing environment variable: ${key}`);
  return v;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: 'Free Bites',
    slug: 'free-bites',
    scheme: 'leftovers',
    owner: 'arnav2x',
    updates: {
      url: 'https://u.expo.dev/0f554bb2-0d16-4841-b48d-f931a8917edd',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
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
      emulatorHost: '127.0.0.1',
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
