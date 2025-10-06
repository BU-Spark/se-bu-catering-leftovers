import Constants from 'expo-constants';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  firebase?: FirebaseOptions;
};
if (!extra.firebase) throw new Error('Missing firebase config in Expo extra');

const app: FirebaseApp = getApps()[0] ?? initializeApp(extra.firebase);

export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
