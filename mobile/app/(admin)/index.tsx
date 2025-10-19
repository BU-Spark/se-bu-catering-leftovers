import { View, Text, Image, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import CustomButton from '../../src/components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../../src/lib/theme';

export default function AdminHomeScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ADMIN</Text>
      </View>

      {user?.imageUrl && (
        <Image
          source={{ uri: user.imageUrl }}
          style={styles.avatar}
        />
      )}
      
      <Text style={styles.welcomeText}>
        Welcome, {user?.firstName || 'Admin'}
      </Text>

      <Text style={styles.subtitle}>
        You have full access to manage events
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ✓ Create events{'\n'}
          ✓ Edit events{'\n'}
          ✓ Delete events{'\n'}
          ✓ Manage student access
        </Text>
      </View>

      <CustomButton 
        text='Sign out' 
        onPress={() => signOut()} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.text.onPrimary,
    ...typography.h6,
    fontWeight: '700',
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  welcomeText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    width: '100%',
  },
  infoText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
});