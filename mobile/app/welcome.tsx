// app/welcome.tsx
import { useEffect } from 'react';
import { firestore } from '../src/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { Text, StyleSheet, View, ActivityIndicator, Pressable, Image } from 'react-native';
import { Redirect, router } from 'expo-router';
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
  useEffect(() => {
    const ensureUserDoc = async () => {
      if (!userLoaded || !isSignedIn || !user) return;

      try {
        const userRef = doc(firestore, 'Users', user.id);
        await setDoc(
          userRef,
          {
            uid: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || '',
            role: user.publicMetadata?.role || 'User', // keep consistent with Clerk role
            agreedToTerms: false,
          },
          { merge: true } // ✅ create if missing, update if exists
        );
        console.log('✅ Firestore user document ensured');
      } catch (error) {
        console.error('🔥 Failed to create Firestore user doc:', error);
      }
    };

    ensureUserDoc();
  }, [isSignedIn, userLoaded, user]);

  // If already signed in, redirect based on role
  if (isSignedIn) {
    const userRole = user?.publicMetadata?.role as string | undefined;
    console.log('Welcome screen - User role:', userRole);
    console.log('Welcome screen - User metadata:', user?.publicMetadata);

    if (userRole === 'admin') {
      console.log('Welcome screen - Redirecting to admin route');
      return <Redirect href='/(admin)' />;
    }

    console.log('Welcome screen - Redirecting to student route, role was:', userRole);
    // Default to student route
    return <Redirect href='/(student)' />;
  }

  // Show welcome screen with login/signup options
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* BU Logo */}
        <Image
          source={require('../assets/boston-university-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome to BU Catering</Text>
        <Text style={styles.subtitle}>Connect with your community through food</Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </Pressable>

          <Pressable
            style={[styles.loginButton, styles.signupButton]}
            onPress={() => router.push('/sign-up')}
          >
            <Text style={[styles.buttonText, styles.signupButtonText]}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 0,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    ...typography.h5,
    color: colors.text.onPrimary,
    fontWeight: '600',
  },
  signupButtonText: {
    color: colors.primary,
  },
});