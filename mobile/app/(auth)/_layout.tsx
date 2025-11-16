// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../../src/lib/theme';

export default function AuthLayout() {
  console.log('Auth layout');
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={'/'} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false, title: 'Sign in' }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ headerShown: false, title: 'Sign up' }}
      />
      {/* verify.tsx is no longer needed - merged into sign-up */}
    </Stack>
  );
}
