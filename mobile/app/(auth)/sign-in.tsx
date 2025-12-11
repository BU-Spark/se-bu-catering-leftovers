// app/(auth)/sign-in.tsx
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import { Link, router } from 'expo-router';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { isClerkAPIResponseError, useSignIn, useAuth } from '@clerk/clerk-expo';
import SignInWith from '../../src/components/SignInWith';
import { colors, typography, spacing } from '../../src/lib/theme';

// Adjust this value to control how much the screen moves up when keyboard appears
// Negative values reduce upward movement (more negative = less movement)
const KEYBOARD_OFFSET = -100;

const signInSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email')
    .refine((email) => email.endsWith('@bu.edu'), {
      message: 'Only @bu.edu emails are allowed',
    }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
});

type SignInFields = z.infer<typeof signInSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'identifier':
      return 'email';
    case 'password':
      return 'password';
    default:
      return 'root';
  }
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  });

  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded || !authLoaded) return;

    // Check if already signed in
    if (isSignedIn) {
      router.replace('/welcome');
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === 'complete') {
        setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.log('Sign in failed');
        setError('root', { message: 'Sign in could not be completed' });
      }
    } catch (err) {
      console.log('Sign in error: ', JSON.stringify(err, null, 2));

      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error);
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError('root', { message: 'Unknown error' });
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET - insets.top : KEYBOARD_OFFSET}
        style={styles.container}
      >
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.push('/welcome')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Sign in with your @bu.edu email</Text>

        <View style={styles.form}>
          <CustomInput
            control={control}
            name="email"
            placeholder="Email"
            autoFocus
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <CustomInput
            control={control}
            name="password"
            placeholder="Password"
            secureTextEntry
          />

          {errors.root && (
            <Text style={styles.errorText}>{errors.root.message}</Text>
          )}
        </View>

        <CustomButton text="Sign in" onPress={handleSubmit(onSignIn)} />

        <Link href="/sign-up" style={styles.link}>
          {"Don't have an account? Sign up"}
        </Link>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <SignInWith strategy="oauth_google" />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  form: {
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    zIndex: 10,
  },
  backButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});
