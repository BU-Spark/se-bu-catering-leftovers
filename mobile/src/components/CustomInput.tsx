import {
  TextInput,
  StyleSheet,
  TextInputProps,
  Text,
  View,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { colors, typography, spacing, borderRadius } from '../lib/theme';

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
} & TextInputProps;

export default function CustomInput<T extends FieldValues>({
  control,
  name,
  ...props
}: CustomInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          <TextInput
            {...props}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            style={[
              styles.input,
              props.style,
              { borderColor: error ? colors.error : colors.border.default },
            ]}
            placeholderTextColor={colors.text.secondary}
          />
          {error ? (
            <Text style={styles.error}>{error.message}</Text>
          ) : (
            <View style={{ height: 18 }} />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.text.primary,
  },
  error: {
    color: colors.error,
    ...typography.bodySmall,
    minHeight: 18,
  },
});
