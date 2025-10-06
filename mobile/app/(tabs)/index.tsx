import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

export default function HomeScreen() {
  const extra = Constants.expoConfig?.extra as any;
  const projectId = extra?.firebase?.projectId ?? 'NO_PROJECT_ID';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BU CATERING</Text>
      <Text style={styles.subtitle}>Leftovers made easy.</Text>

      <View style={{ marginTop: 24 }}>
        <Text>Firebase Project: {projectId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
