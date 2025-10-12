import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  disabled,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const mode =
    variant === 'ghost' ? 'outlined'
    : variant === 'secondary' ? 'contained-tonal'
    : 'contained';

  const buttonColor = variant === 'danger' ? theme.colors.error : undefined;
  const textColor   = variant === 'danger'
    ? (theme.colors.onError ?? theme.colors.onPrimary)
    : undefined;

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      style={style}
      buttonColor={buttonColor}
      textColor={textColor}
    >
      {children}
    </PaperButton>
  );
}
