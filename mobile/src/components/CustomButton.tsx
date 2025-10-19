import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../lib/theme';

type CustomButtonProps = {
  text: string;
} & PressableProps;

export default function CustomButton({ text, ...props }: CustomButtonProps) {
  return (
    <Pressable {...props} style={[styles.button]}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.onPrimary,
    ...typography.body,
    fontWeight: '600',
  },
});