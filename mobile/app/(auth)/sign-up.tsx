// app/(auth)/sign-up.tsx
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Animated,
  Pressable,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';

import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import SignInWith from '../../src/components/SignInWith';
import { colors, typography, spacing } from '../../src/lib/theme';

const signUpSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email')
    .refine((email) => email.endsWith('@bu.edu'), {
      message: 'Only @bu.edu emails are allowed',
    }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
  code: z.string().optional(),
});

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'email_address':
      return 'email';
    case 'password':
      return 'password';
    case 'code':
      return 'code';
    default:
      return 'root';
  }
};

export default function SignUpScreen() {
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp();

  // Animate verification code input when it appears
  useEffect(() => {
    if (pendingVerification) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [pendingVerification]);

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      if (!pendingVerification) {
        // Step 1: Create the sign up
        await signUp.create({
          emailAddress: data.email,
          password: data.password,
        });

        // Step 2: Send verification code
        await signUp.prepareVerification({ strategy: 'email_code' });

        // Step 3: Show verification input
        setVerificationEmail(data.email);
        setPendingVerification(true);
        clearErrors();
      } else {
        // Step 4: Verify the code
        if (!data.code) {
          setError('code', { message: 'Verification code is required' });
          return;
        }

        const signUpAttempt = await signUp.attemptEmailAddressVerification({
          code: data.code,
        });

        if (signUpAttempt.status === 'complete') {
          await setActive({ session: signUpAttempt.createdSessionId });
          // Navigation will happen automatically via auth state
        } else {
          console.log('Verification failed');
          console.log(signUpAttempt);
          setError('root', { message: 'Could not complete the sign up' });
        }
      }
    } catch (err) {
      console.log('Sign up error: ', err);
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          console.log('Error: ', JSON.stringify(error, null, 2));
          const fieldName = mapClerkErrorToFormField(error);
          console.log('Field name: ', fieldName);
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError('root', { message: 'Unknown error' });
      }
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareVerification({ strategy: 'email_code' });
      clearErrors('code');
      // Show success feedback
      setError('code', {
        message: '✓ New code sent! Check your email.',
        type: 'success' as any,
      });

      // Clear the success message after 3 seconds
      setTimeout(() => {
        clearErrors('code');
      }, 3000);
    } catch (err) {
      console.log('Resend error: ', err);
      setError('code', { message: 'Failed to resend code. Try again.' });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.push('/welcome')}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>
        {pendingVerification ? 'Verify your email' : 'Create an account'}
      </Text>
      <Text style={styles.subtitle}>
        {pendingVerification
          ? `Enter the 6-digit code sent to ${verificationEmail}`
          : 'Sign up with your @bu.edu email'}
      </Text>

      <View style={styles.form}>
        {!pendingVerification && (
          <>
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
          </>
        )}

        {pendingVerification && (
          <Animated.View
            style={{
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }}
          >
            <CustomInput
              control={control}
              name="code"
              placeholder="123456"
              autoFocus
              autoCapitalize="none"
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            {/* Resend Code Link */}
            <Text style={styles.resendContainer}>
              Didn't receive a code?{' '}
              <Text style={styles.resendLink} onPress={handleResendCode}>
                Resend
              </Text>
            </Text>
          </Animated.View>
        )}

        {errors.root && (
          <Text style={styles.errorText}>{errors.root.message}</Text>
        )}
      </View>

      <CustomButton
        text={pendingVerification ? 'Verify & Sign Up' : 'Continue'}
        onPress={handleSubmit(onSignUp)}
      />

      {!pendingVerification && (
        <>
          <Link href="/sign-in" style={styles.link}>
            Already have an account? Sign in
          </Link>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <SignInWith strategy="oauth_google" />
          </View>
        </>
      )}

      {pendingVerification && (
        <Link href="/sign-in" style={[styles.link, { marginTop: spacing.md }]}>
          Back to sign in
        </Link>
      )}
    </KeyboardAvoidingView>
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
  resendContainer: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
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
