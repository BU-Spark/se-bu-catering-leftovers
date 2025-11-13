// src/components/LocationFilterDropdown.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../lib/theme';
import { PRESET_LOCATIONS } from '../lib/constants';

export type LocationFilterOption = string; // Location name or 'other'

type LocationFilterDropdownProps = {
  selectedLocations: Set<LocationFilterOption>;
  onLocationChange: (locations: Set<LocationFilterOption>) => void;
  buttonSize?: number;
};

const OTHER_OPTION = 'other';

export default function LocationFilterDropdown({
  selectedLocations,
  onLocationChange,
  buttonSize = 32,
}: LocationFilterDropdownProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const allOptions = [
    ...PRESET_LOCATIONS.map((preset) => ({
      value: preset.name,
      label: preset.label,
    })),
    { value: OTHER_OPTION, label: 'Other' },
  ];

  const toggleLocation = (locationValue: LocationFilterOption) => {
    const newSelection = new Set(selectedLocations);
    if (newSelection.has(locationValue)) {
      newSelection.delete(locationValue);
    } else {
      newSelection.add(locationValue);
    }
    onLocationChange(newSelection);
  };

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
          minWidth: 220,
          maxHeight: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
          zIndex: 1000,
          marginTop: spacing.xs,
        },
        scrollView: {
          maxHeight: 350,
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
          flex: 1,
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
    [colors]
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
          <Ionicons name="filter" size={16} color={colors.text.primary} />
        </Pressable>

        {isOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.scrollView}>
              {allOptions.map((opt) => {
                const selected = selectedLocations.has(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleLocation(opt.value)}
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
            </ScrollView>
          </View>
        )}
      </View>

      {isOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

