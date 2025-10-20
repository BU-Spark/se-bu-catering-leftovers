// app/(admin)/_layout.tsx
import { Tabs, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';

export default function AdminLayout() {
  console.log('Admin layout');

  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  if (!authLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href='/sign-in' />;
  }

  // Check if user has admin role
  const userRole = user?.publicMetadata?.role as string | undefined;
  console.log('Admin layout - User role:', userRole);
  console.log('Admin layout - User metadata:', user?.publicMetadata);
  
  if (userRole !== 'admin') {
    console.log('Admin layout - Redirecting to student route, role was:', userRole);
    // Redirect non-admin users to student route
    return <Redirect href='/(student)' />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.secondaryLight,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
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