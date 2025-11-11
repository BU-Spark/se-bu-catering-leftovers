// app/(student)/_layout.tsx
import { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../src/lib/firebase/config';
import { useTheme } from '../../src/lib/ThemeProvider';

export default function StudentLayout() {
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
          console.log('Student: No user doc, needs onboarding');
          setNeedsOnboarding(true);
          return;
        }

        const userData = userSnap.data();
        console.log('Student: agreedToTerms =', userData.agreedToTerms);
        
        if (userData.agreedToTerms !== true) {
          console.log('Student: Needs to complete onboarding');
          setNeedsOnboarding(true);
        } else {
          console.log('Student: Onboarding complete');
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error('Student: Failed to check onboarding:', error);
        setNeedsOnboarding(false);
      }
    };

    checkOnboarding();
  }, [authLoaded, userLoaded, isSignedIn, user]);

  if (!authLoaded || !userLoaded || needsOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href='/sign-in' />;
  }

  if (needsOnboarding) {
    return <Redirect href='/(onboarding)/onboarding' />;
  }

  const userRole = user?.publicMetadata?.role as string | undefined;

  if (userRole === 'admin') {
    console.log('Student layout - Redirecting to admin route');
    return <Redirect href='/(admin)' />;
  }

  return (
    <Tabs
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
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map/page"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
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