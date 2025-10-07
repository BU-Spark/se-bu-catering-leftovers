import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const extra = (Constants.expoConfig?.extra ?? {}) as { firebase?: FirebaseOptions };
if (!extra.firebase) throw new Error('Missing firebase config in Expo extra');

const app: FirebaseApp = getApps()[0] ?? initializeApp(extra.firebase);

export const firestore = initializeFirestore(app, { experimentalForceLongPolling: true });

if (__DEV__) {
  const HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  try { connectFirestoreEmulator(firestore, HOST, 8080); } catch {}
}
