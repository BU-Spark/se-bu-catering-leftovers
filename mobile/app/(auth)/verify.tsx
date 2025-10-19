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

import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import { colors, typography, spacing } from '../../src/lib/theme';

const verifySchema = z.object({
  code: z.string({ message: 'Code is required' }).length(6, 'Invalid code'),
});

type VerifyFields = z.infer<typeof verifySchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'code':
      return 'code';
    default:
      return 'root';
  }
};

export default function VerifyScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp();

  const onVerify = async ({ code }: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        setActive({ session: signUpAttempt.createdSessionId });
      } else {
        console.log('Verification failed');
        console.log(signUpAttempt);
        setError('root', { message: 'Could not complete the sign up' });
      }
    } catch (err) {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email
      </Text>

      <View style={styles.form}>
        <CustomInput
          control={control}
          name='code'
          placeholder='123456'
          autoFocus
          autoCapitalize='none'
          keyboardType='number-pad'
          autoComplete='one-time-code'
        />
        {errors.root && (
          <Text style={styles.errorText}>{errors.root.message}</Text>
        )}
      </View>

      <CustomButton text='Verify' onPress={handleSubmit(onVerify)} />
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
  errorText: {
    color: colors.error,
  },
});