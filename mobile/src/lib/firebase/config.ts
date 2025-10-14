import { Platform } from 'react-native';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import Constants from 'expo-constants';

// Extract Firebase config from Expo constants
const extra = (Constants.expoConfig?.extra ?? {}) as {
  firebase?: FirebaseOptions;
};

if (!extra.firebase) {
  throw new Error('Missing firebase config in app.config.ts extra');
}

// Initialize Firebase app (singleton pattern)
const app: FirebaseApp = getApps()[0] ?? initializeApp(extra.firebase);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore with RN-friendly transport
// Use ONLY experimentalForceLongPolling for React Native (do not combine with auto-detect)
export const firestore: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Connect to emulator in development
if (__DEV__) {
  const HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  const PORT = 8080;

  try {
    connectFirestoreEmulator(firestore, HOST, PORT);
    connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true });
    console.log(`🔧 Connected to Firestore Emulator at ${HOST}:${PORT}`);
    console.log(`🔧 Connected to Auth Emulator at ${HOST}:9099`);
  } catch (error) {
    console.warn(
      'Emulator connection failed (may already be connected):',
      error,
    );
  }
}

// Helper to check if we're using emulator
export const isUsingEmulator = () => __DEV__;

export default app;
