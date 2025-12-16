// app/(admin)/_layout.tsx
import { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../src/lib/firebase/config';
import { useTheme } from '../../src/lib/ThemeProvider';

export default function AdminLayout() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { colors } = useTheme();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!authLoaded || !userLoaded || !isSignedIn || !user) return;

      try {
        const userRef = doc(firestore, 'Users', user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log('Admin: No user doc, needs onboarding');
          setNeedsOnboarding(true);
          return;
        }

        const userData = userSnap.data();
        console.log('Admin: agreedToTerms =', userData.agreedToTerms);

        if (userData.agreedToTerms !== true) {
          console.log('Admin: Needs to complete onboarding');
          setNeedsOnboarding(true);
        } else {
          console.log('Admin: Onboarding complete');
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error('Admin: Failed to check onboarding:', error);
        setNeedsOnboarding(false);
      }
    };

    checkOnboarding();
  }, [authLoaded, userLoaded, isSignedIn, user]);

  if (!authLoaded || !userLoaded || needsOnboarding === null) {
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

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/onboarding" />;
  }

  const userRole = user?.publicMetadata?.role as string | undefined;
  const userStatus = (user?.publicMetadata as any)?.status as
    | string
    | undefined;

  const isAdmin =
    userRole === 'admin' && (userStatus === 'active' || userStatus == null);
  const isActiveStaff = userRole === 'staff' && userStatus === 'active';

  // Only admins and *active* staff can stay in the (admin) stack
  if (!isAdmin && !isActiveStaff) {
    console.log(
      'Admin layout - Redirecting to student route, role/status was:',
      userRole,
      userStatus,
    );
    return <Redirect href="/(student)" />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border.default,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create/page"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics/page"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/page"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
