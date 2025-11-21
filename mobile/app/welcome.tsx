// app/welcome.tsx
import { useEffect, useState, useRef } from 'react';
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

const log = (msg: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] [welcome.tsx] ${msg}`, data);
  } else {
    console.log(`[${timestamp}] [welcome.tsx] ${msg}`);
  }
};

export default function WelcomeScreen() {
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [shouldRedirect, setShouldRedirect] = useState<{
    path: string;
    ready: boolean;
  }>({ path: '', ready: false });

  // Use a ref to track if we've already run the check
  const hasChecked = useRef(false);

  log('Render', { isSignedIn, authLoaded, userLoaded });

  useEffect(() => {
    // Only run once when auth is loaded
    if (!authLoaded || !userLoaded || hasChecked.current) {
      return;
    }

    hasChecked.current = true;

    const checkOnboardingStatus = async () => {
      log('checkOnboardingStatus START', {
        authLoaded,
        userLoaded,
        isSignedIn,
      });

      // Not signed in: stay on welcome screen
      if (!isSignedIn || !user) {
        log('User not signed in, staying on welcome');
        setShouldRedirect({ path: '', ready: false });
        return;
      }

      try {
        log('User signed in, checking onboarding status', { userId: user.id });

        // 1) Ensure Firestore user doc exists
        log('Fetching Firestore user doc...');
        const userRef = doc(firestore, 'Users', user.id);
        const userSnap = await getDoc(userRef);
        log('Firestore fetch complete', { exists: userSnap.exists() });

        if (!userSnap.exists()) {
          log('Creating new user document...');
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
          log('✅ New user document created');
          setShouldRedirect({ path: '/(onboarding)/onboarding', ready: true });
          return;
        }

        const userData = userSnap.data();
        log('User data loaded', { agreedToTerms: userData.agreedToTerms });

        if (userData.agreedToTerms !== true) {
          log('User needs to complete onboarding');
          setShouldRedirect({ path: '/(onboarding)/onboarding', ready: true });
          return;
        }

        // 2) User is onboarded, use RBAC backend to decide where to go
        log('User is onboarded, calling fetchMe...');
        try {
          log('Calling fetchMe with getToken');
          const me = await fetchMe(getToken);
          log('fetchMe succeeded', me);
          const rbac = me.rbac;

          if (!rbac) {
            log('RBAC missing, falling back to student route');
            setShouldRedirect({ path: '/(student)', ready: true });
            return;
          }

          const { role, status } = rbac;
          log('RBAC loaded', { role, status });

          if (status === 'pending') {
            log('Status is pending, redirecting to pending screen');
            setShouldRedirect({ path: '/(onboarding)/pending', ready: true });
            return;
          }

          if (role === 'admin' || role === 'staff') {
            log('Role is admin/staff, redirecting to admin');
            setShouldRedirect({ path: '/(admin)', ready: true });
            return;
          }

          // Default: student experience
          log('Role is student, redirecting to student');
          setShouldRedirect({ path: '/(student)', ready: true });
        } catch (err) {
          log('❌ fetchMe failed', err);
          console.error('Failed to load RBAC info:', err);
          log('Falling back to student route');
          setShouldRedirect({ path: '/(student)', ready: true });
        }
      } catch (error) {
        log('❌ checkOnboardingStatus error', error);
        console.error('Failed to check onboarding status:', error);
        setShouldRedirect({ path: '/(student)', ready: true });
      }
    };

    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, userLoaded]);

  if (!authLoaded || !userLoaded) {
    log('Still loading auth/user');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (shouldRedirect.ready && shouldRedirect.path) {
    log('Redirecting to', shouldRedirect.path);
    return <Redirect href={shouldRedirect.path as any} />;
  }

  if (isSignedIn) {
    log('Signed in but no redirect yet (still processing)');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  log('Showing welcome screen');
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
