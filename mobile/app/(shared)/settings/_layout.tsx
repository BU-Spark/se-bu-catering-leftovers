// app/(shared)/settings/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/lib/ThemeProvider';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text.primary,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    />
  );
}
