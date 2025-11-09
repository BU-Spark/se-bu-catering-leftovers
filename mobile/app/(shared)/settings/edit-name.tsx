// app/(shared)/settings/edit-name.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../src/lib/firebase/config';
import { useTheme } from '../../../src/lib/ThemeProvider';
import { typography, spacing, borderRadius } from '../../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function EditNameScreen() {
  const { user } = useUser();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentName();
  }, [user]);

  const loadCurrentName = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(firestore, 'Users', user.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setName(userData.name || '');
      }
    } catch (error) {
      console.error('Failed to load name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'Users', user.id);
      await updateDoc(userRef, {
        name: name.trim(),
      });
      
      // Navigate back to settings page based on user role
      const role = user.publicMetadata?.role as string;
      if (role === 'admin') {
        router.replace('/(admin)/settings/page');
      } else {
        router.replace('/(student)/settings/page');
      }
    } catch (error) {
      console.error('Failed to save name:', error);
      Alert.alert('Error', 'Failed to update name');
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
          title: 'Display Name',
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
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            This is the name others will see when referring to you
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Name</Text>
            <TextInput
              style={[styles.input, { 
                color: colors.text.primary, 
                backgroundColor: colors.surface,
                borderColor: colors.border.default 
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.text.secondary}
              autoFocus
            />
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving || !name.trim()}
          >
            <Text style={[styles.saveButtonText, { color: colors.text.onPrimary }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
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