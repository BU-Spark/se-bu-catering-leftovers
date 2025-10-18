// app/index.tsx
import * as React from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { spacing } from '../src/lib/theme';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const theme = useTheme();

  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  // Redirect if already logged in
  React.useEffect(() => {
    if (!isSignedIn || !user) return;

    const role =
      (user.publicMetadata as any)?.role ||
      'Student';

    if (String(role).toLowerCase() === 'admin') {
      router.replace('/(admin)');
    } else {
      router.replace('/(student)');
    }
  }, [isSignedIn, user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    if (!email.toLowerCase().endsWith('@bu.edu')) {
      Alert.alert('Error', 'Please use your @bu.edu email');
      return;
    }
    if (!isLoaded) return;

    try {
      const res = await signIn.create({ identifier: email, password });
      await setActive({ session: res.createdSessionId });
      // redirect effect above will run
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ||
        e?.errors?.[0]?.message ||
        'Login failed. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Surface
        elevation={0}
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl * 2 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Text variant="displaySmall" style={{ color: '#ffffff' }}>
              🍽️
            </Text>
          </View>
          <Text
            variant="headlineMedium"
            style={{
              textAlign: 'center',
              marginBottom: spacing.xs,
              fontWeight: '700',
            }}
          >
            BU Catering Leftovers
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
            Reduce waste, feed community
          </Text>
        </View>

        {!isSignedIn ? (
          <View>
            <TextInput
              mode="outlined"
              label="BU Email"
              placeholder="you@bu.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email-outline" />}
              style={{ marginBottom: spacing.md }}
            />

            <TextInput
              mode="outlined"
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" />}
              style={{ marginBottom: spacing.lg }}
            />

            <Button mode="contained" onPress={handleLogin}>
              Log In
            </Button>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <Text>Signed in as {user?.primaryEmailAddress?.emailAddress}</Text>
            <Button
              mode="outlined"
              onPress={() => signOut().then(() => router.replace('/'))}
            >
              Sign out
            </Button>
          </View>
        )}

        <Text
          variant="bodySmall"
          style={{
            textAlign: 'center',
            marginTop: spacing.xxl * 2,
            opacity: 0.6,
          }}
        >
          © 2025 BU Catering Leftovers Project
        </Text>
      </Surface>
    </SafeAreaView>
  );
}
