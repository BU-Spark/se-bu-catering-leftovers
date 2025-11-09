// app/(shared)/settings/edit-location.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../src/lib/firebase/config';
import { useTheme } from '../../../src/lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

const CAMPUS_SECTIONS = ['East', 'Central', 'West', 'South'];

export default function EditLocationScreen() {
  const { user } = useUser();
  const { colors } = useTheme();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentLocations();
  }, [user]);

  const loadCurrentLocations = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(firestore, 'Users', user.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setSelectedLocations(userData.locPref || []);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'Users', user.id);
      await updateDoc(userRef, {
        locPref: selectedLocations,
      });
      
      // Navigate back to settings page based on user role
      const role = user.publicMetadata?.role as string;
      if (role === 'admin') {
        router.replace('/(admin)/settings/page');
      } else {
        router.replace('/(student)/settings/page');
      }
    } catch (error) {
      console.error('Failed to save locations:', error);
      Alert.alert('Error', 'Failed to update campus preferences');
      setIsSaving(false);
    }
  };

  const handleBack = useCallback(() => {
    const role = user?.publicMetadata?.role as string;
    if (role === 'admin') {
      router.replace('/(admin)/settings/page');
    } else {
      router.replace('/(student)/settings/page');
    }
  }, [user]);

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Campus Preferences',
          headerBackVisible: true,
          headerLeft: () => (
            <Pressable
              onPress={handleBack}
              style={{ marginLeft: -4 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          Select your preferred campus sections to get relevant event notifications
        </Text>
        
        <View style={styles.chipsContainer}>
          {CAMPUS_SECTIONS.map((section) => (
            <Pressable
              key={section}
              style={[
                styles.chip,
                { borderColor: colors.border.default, backgroundColor: colors.surface },
                selectedLocations.includes(section) && { 
                  backgroundColor: colors.primary, 
                  borderColor: colors.primary 
                }
              ]}
              onPress={() => toggleLocation(section)}
            >
              <Text style={[
                styles.chipText,
                { color: colors.text.primary },
                selectedLocations.includes(section) && { color: colors.text.onPrimary }
              ]}>
                {section}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, { color: colors.text.onPrimary }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  chip: {
    borderWidth: 2,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chipText: {
    ...typography.body,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});