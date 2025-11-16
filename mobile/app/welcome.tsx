// app/welcome.tsx
import { useEffect, useState } from 'react';
import { firestore } from '../src/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors, typography, spacing } from '../src/lib/theme';
import { fetchMe } from '../src/lib/rbacClient';

export default function WelcomeScreen() {
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [shouldRedirect, setShouldRedirect] = useState<{
    path: string;
    ready: boolean;
  }>({ path: '', ready: false });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!authLoaded || !userLoaded) return;

      // Not signed in: stay on welcome screen
      if (!isSignedIn || !user) {
        setShouldRedirect({ path: '', ready: false });
        return;
      }

      try {
        // 1) Ensure Firestore user doc exists
        const userRef = doc(firestore, 'Users', user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || '',
            role: user.publicMetadata?.role || 'User',
            agreedToTerms: false,
            events: [],
            reviews: [],
            locPref: [],
            timePref: [],
            foodPref: [],
          });
          console.log('✅ New user document created');
          setShouldRedirect({ path: '/(onboarding)/onboarding', ready: true });
          return;
        }

        const userData = userSnap.data();
        console.log(userData.agreedToTerms);
        if (userData.agreedToTerms !== true) {
          console.log('📋 User needs to complete onboarding');
          setShouldRedirect({ path: '/(onboarding)/onboarding', ready: true });
          return;
        }

        // 2) User is onboarding, use RBAC backend to decide where to go
        try {
          const me = await fetchMe(getToken);
          const rbac = me.rbac;

          if (!rbac) {
            console.log('RBAC missing, falling back to student route');
            setShouldRedirect({ path: '/(student)', ready: true });
            return;
          }

          const { role, status } = rbac;

          console.log('RBAC from /api/me:', role, status);

          if (status === 'pending') {
            // Staff request pending, move to pending screen
            setShouldRedirect({ path: '/(onboarding)/pending', ready: true });
            return;
          }

          if (role === 'admin' || role === 'staff') {
            // Staff + admin share the (admin) stack; staff UI will hide admin-only bits
            setShouldRedirect({ path: '/(admin)', ready: true });
            return;
          }

          // Default: student experience
          setShouldRedirect({ path: '/(student)', ready: true });
        } catch (err) {
          console.error(
            'Failed to load RBAC info, falling back to student route:',
            err,
          );
          setShouldRedirect({ path: '/(student)', ready: true });
        }
      } catch (error) {
        console.error('🔥 Failed to check onboarding status:', error);
        setShouldRedirect({ path: '/(student)', ready: true });
      }
    };

    checkOnboardingStatus();
  }, [authLoaded, isSignedIn, userLoaded, user, getToken]);

  if (!authLoaded || !userLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (shouldRedirect.ready && shouldRedirect.path) {
    return <Redirect href={shouldRedirect.path as any} />;
  }

  if (isSignedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/boston-university-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome to FreeBites</Text>
        <Text style={styles.subtitle}>
          Connect with your community through food
        </Text>

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
            <Text style={[styles.buttonText, styles.signupButtonText]}>
              Sign Up
            </Text>
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
