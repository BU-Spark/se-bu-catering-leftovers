// src/components/ui/Input.tsx
import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  TextInput as PaperTextInput,
  HelperText,
  TextInputProps as PaperTextInputProps,
} from 'react-native-paper';

type InputProps = Omit<PaperTextInputProps, 'error' | 'label'> & {
  /** Floating label text */
  label?: string;
  /** Error message to display under field */
  errorText?: string;
  style?: StyleProp<ViewStyle>;
};

export const Input = React.forwardRef<typeof PaperTextInput, InputProps>(
  ({ label, errorText, style, multiline, ...props }, ref) => {
    const hasError = !!errorText;
    return (
      <>
        <PaperTextInput
          ref={ref as any}
          mode="outlined"
          label={label}
          error={hasError}
          multiline={multiline}
          style={style}
          autoCapitalize={props.autoCapitalize ?? 'none'}
          {...props}
        />
        {hasError && (
          <HelperText type="error" visible>
            {errorText}
          </HelperText>
        )}
      </>
    );
  },
);

Input.displayName = 'Input';
