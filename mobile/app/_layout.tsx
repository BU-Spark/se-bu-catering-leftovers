// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/contexts/AuthContext';
import { colors } from '../src/lib/theme';

// Clerk
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    outline: colors.border.default,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
  },
};

const publishableKey = (Constants.expoConfig?.extra as any)?.clerk?.publishableKey;

if (!publishableKey) {
  throw new Error('Missing Clerk publishableKey in app.config.ts extra');
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            />
            <StatusBar style="dark" />
          </AuthProvider>
        </PaperProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
