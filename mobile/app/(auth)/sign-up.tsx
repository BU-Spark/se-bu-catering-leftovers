import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
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
});

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'email_address':
      return 'email';
    case 'password':
      return 'password';
    default:
      return 'root';
  }
};

export default function SignUpScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const { signUp, isLoaded } = useSignUp();

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareVerification({ strategy: 'email_code' });

      router.push('/verify');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Sign up with your @bu.edu email</Text>

      <View style={styles.form}>
        <CustomInput
          control={control}
          name='email'
          placeholder='Email'
          autoFocus
          autoCapitalize='none'
          keyboardType='email-address'
          autoComplete='email'
        />

        <CustomInput
          control={control}
          name='password'
          placeholder='Password'
          secureTextEntry
        />
        {errors.root && (
          <Text style={styles.errorText}>{errors.root.message}</Text>
        )}
      </View>

      <CustomButton text='Sign up' onPress={handleSubmit(onSignUp)} />
      <Link href='/sign-in' style={styles.link}>
        Already have an account? Sign in
      </Link>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialContainer}>
        <SignInWith strategy='oauth_google' />
      </View>
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
});