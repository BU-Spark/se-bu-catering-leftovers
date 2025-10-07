import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import mockUsers from '../mock_data/users.json';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleLogin = () => {
    const norm = (s?: string) => (s ?? '').trim().toLowerCase();
    const user = (mockUsers as any[]).find(
      (u) => norm(u.email) === norm(email) && norm(u.role) === norm(role),
    );
    if (!user)
      return Alert.alert(
        'Invalid Credentials',
        'Check your email or role again.',
      );
    Alert.alert('Login Successful', `Welcome ${user.name}!`);
    if (norm(user.role) === 'admin') router.push('/admin');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image
          source={require('../assets/landing-page.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>BU Catering Leftovers</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your BU email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.inputRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="admin / volunteer / manager"
              autoCapitalize="none"
              placeholderTextColor="#999"
              value={role}
              onChangeText={setRole}
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleLogin} activeOpacity={0.9}>
          <LinearGradient
            colors={['#FF7E5F', '#FD3A69']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Log In</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 BU Catering Leftovers Project</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 128, height: 128, marginBottom: 12 },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  field: { marginBottom: 14 },
  label: { color: '#374151', fontSize: 14, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  icon: { marginLeft: 10 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, fontSize: 16 },

  cta: {
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    shadowOpacity: 0.1,
  },
  ctaText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
