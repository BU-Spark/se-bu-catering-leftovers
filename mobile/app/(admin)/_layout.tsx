import { Slot, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';
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
  if (userRole !== 'admin') {
    // Redirect non-admin users to student route
    return <Redirect href='/(student)' />;
  }

  return <Slot />;
}