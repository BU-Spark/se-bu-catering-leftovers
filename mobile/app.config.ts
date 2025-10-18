import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as dotenv from 'dotenv';

export default ({ config }: ConfigContext): ExpoConfig => {
  dotenv.config({ path: '.env.local' });

  return {
    name: config.name ?? 'mobile',
    slug: config.slug ?? 'mobile',
    scheme: 'leftovers',
    extra: {
      firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        ...(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
          ? { databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL }
          : {}),
      },
      clerk: {
        publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      },
    },
    plugins: ['expo-router'],
  };
};
