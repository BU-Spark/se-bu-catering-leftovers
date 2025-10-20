// app/welcome.tsx
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing } from '../src/lib/theme';

export default function WelcomeScreen() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Wait for both auth and user data to load
  if (!authLoaded || !userLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href='/sign-in' />;
  }

  // Check user role and redirect accordingly
  const userRole = user?.publicMetadata?.role as string | undefined;
  
  if (userRole === 'admin') {
    return <Redirect href='/(admin)' />;
  }

  // Default to student route
  return <Redirect href='/(student)' />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});