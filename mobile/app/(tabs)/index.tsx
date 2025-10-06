import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { firestore } from '../../firebase/config';

export default function HomeScreen() {
  const extra = Constants.expoConfig?.extra as any;
  const projectId = extra?.firebase?.projectId ?? 'NO_PROJECT_ID';
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // If the import didn't throw, SDK is initialized.
    setSdkReady(!!firestore);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BU CATERING</Text>
      <Text style={styles.subtitle}>Leftovers made easy.</Text>

      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Text>Firebase Project: {projectId}</Text>
        <Text style={{ marginTop: 6 }}>SDK: {sdkReady ? 'initialized ✓' : 'not ready'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: 2 },
  subtitle: { marginTop: 12, fontSize: 16, textAlign: 'center', color: '#666' },
});
