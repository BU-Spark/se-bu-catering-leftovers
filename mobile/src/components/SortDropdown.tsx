import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';

export type SortOption = 'expiry-asc' | 'expiry-desc';

type SortDropdownProps = {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  buttonSize?: number;
};

export default function SortDropdown({
  currentSort,
  onSortChange,
  buttonSize = 32,
}: SortDropdownProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const options: { value: SortOption; label: string }[] = [
    { value: 'expiry-desc', label: 'Just Started' },
    { value: 'expiry-asc', label: 'Ending Soon' },
  ];

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
        },
        button: {
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border.light,
          borderRadius: borderRadius.sm,
        },
        dropdown: {
          position: 'absolute',
          top: '100%',
          right: 0,
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.xs,
          minWidth: 180,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
          zIndex: 1000,
          marginTop: spacing.xs,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        optionSelected: {
          backgroundColor: colors.primary + '11',
        },
        optionText: {
          ...typography.body,
          color: colors.text.primary,
        },
        optionTextSelected: {
          color: colors.primary,
          fontWeight: '600',
        },
        overlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        },
      }),
    [colors],
  );

  return (
    <>
      <View style={styles.container}>
        <Pressable
          onPress={() => setIsOpen(!isOpen)}
          accessibilityRole="button"
          style={[styles.button, { height: buttonSize, width: buttonSize }]}
          hitSlop={8}
        >
          <Ionicons
            name="swap-vertical"
            size={16}
            color={colors.text.primary}
          />
        </Pressable>

        {isOpen && (
          <View style={styles.dropdown}>
            {options.map((opt) => {
              const selected = currentSort === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSortChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {isOpen && (
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)} />
      )}
    </>
  );
}
