// src/lib/firebase/config.ts
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from 'firebase/storage';
import Constants from 'expo-constants';

type Extra = {
  firebase?: FirebaseOptions;
  useEmulators?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
if (!extra.firebase)
  throw new Error('Missing firebase config in app.config.ts extra');

console.log(
  '🔥 Firebase init',
  JSON.stringify({
    projectId: extra.firebase.projectId,
    isDevice: Device.isDevice,
    __DEV__,
    useEmulatorsFlag: extra.useEmulators === true,
  }),
);

const app: FirebaseApp = getApps()[0] ?? initializeApp(extra.firebase);

// Long-polling helps on some networks
export const firestore: Firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const auth: Auth = getAuth(app);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

const USE_EMULATORS =
  __DEV__ && !Device.isDevice && extra.useEmulators === true;

console.log('🔌 Emulator decision ->', { USE_EMULATORS });

if (USE_EMULATORS) {
  const HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  try {
    connectFirestoreEmulator(firestore, HOST, 8080);
    connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true });
    connectStorageEmulator(storage, HOST, 9199);
    console.log(
      `🧪 Emulators: Firestore http://${HOST}:8080, Auth http://${HOST}:9099, Storage http://${HOST}:9199`,
    );
  } catch (e) {
    console.warn('Emulator connection failed:', e);
  }
}

export const isUsingEmulator = () => USE_EMULATORS;
export default app;
