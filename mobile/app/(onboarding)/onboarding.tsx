// app/(onboarding)/onboarding.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../../src/lib/firebase/config';
import { useTheme } from '../../src/lib/ThemeProvider';
import { spacing, typography, borderRadius } from '../../src/lib/theme';
import { TERMS_AND_CONDITIONS } from '../../src/content/terms';
import { requestStaffRole } from '../../src/lib/rbacClient';

const CAMPUS_SECTIONS = ['East', 'Central', 'West', 'South'];

export default function OnboardingScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const pagerRef = useRef<PagerView>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [name, setName] = useState(user?.fullName || '');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff'>(
    'student',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createStyles(colors);

  const goToPage = (page: number) => {
    pagerRef.current?.setPage(page);
  };

  const handleNext = () => {
    if (currentPage < 3) {
      goToPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    if (currentPage < 3) {
      goToPage(3);
    }
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location],
    );
  };

  const handleGetStarted = async () => {
    if (!user || !agreedToTerms) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, 'Users', user.id);

      await setDoc(
        userRef,
        {
          name: name.trim() || user.fullName || '',
          locPref: selectedLocations,
          agreedToTerms: true,
        },
        { merge: true },
      );

      const userRole = user.publicMetadata?.role as string | undefined;

      // Admins skip staff flow and go straight to (admin)
      if (userRole === 'admin') {
        router.replace('/(admin)');
        return;
      }

      // Staff request flow
      if (selectedRole === 'staff') {
        try {
          await requestStaffRole(getToken);
          // Lock them into pending until an admin approves/changes status
          router.replace('/(onboarding)/pending');
        } catch (err) {
          console.error('Failed to request staff role:', err);
          setIsSubmitting(false);
        }
        return;
      }

      // Default: student
      router.replace('/(student)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsSubmitting(false);
    }
  };

  const canProceedFromPage = (page: number) => {
    if (page === 0) return name.trim().length > 0; // Name
    if (page === 1) return true; // Role (default is student)
    if (page === 2) return true; // Campus prefs
    if (page === 3) return agreedToTerms; // Terms
    return false;
  };

  return (
    <View style={styles.container}>
      {currentPage < 3 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {/* Page 0: Name */}
        <View key="1" style={styles.page}>
          <View style={styles.content}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome to BU Catering</Text>
            <Text style={styles.subtitle}>Let's get to know you</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>What's your name?</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.text.secondary}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        {/* Page 1: Role selection */}
        <View key="2" style={styles.page}>
          <View style={styles.content}>
            <Text style={styles.emoji}>🎓</Text>
            <Text style={styles.title}>How are you using FreeBites?</Text>
            <Text style={styles.subtitle}>
              Choose whether you're signing up as a student or as staff.
            </Text>

            <View style={styles.roleContainer}>
              <Pressable
                style={[
                  styles.roleCard,
                  selectedRole === 'student' && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole('student')}
              >
                <Text
                  style={[
                    styles.roleTitle,
                    selectedRole === 'student' && styles.roleTitleSelected,
                  ]}
                >
                  Student
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    selectedRole === 'student' &&
                      styles.roleDescriptionSelected,
                  ]}
                >
                  Browse and claim leftover catering events on campus.
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.roleCard,
                  selectedRole === 'staff' && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole('staff')}
              >
                <Text
                  style={[
                    styles.roleTitle,
                    selectedRole === 'staff' && styles.roleTitleSelected,
                  ]}
                >
                  Staff
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    selectedRole === 'staff' && styles.roleDescriptionSelected,
                  ]}
                >
                  Post and manage leftover catering events for your department.
                </Text>
                <Text
                  style={[
                    styles.roleNote,
                    selectedRole === 'staff' && styles.roleNoteSelected,
                  ]}
                >
                  Your staff access request will be reviewed by an admin.
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Page 2: Campus preferences */}
        <View key="3" style={styles.page}>
          <View style={styles.content}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.title}>Campus Preferences</Text>
            <Text style={styles.subtitle}>
              Select your preferred campus sections to get relevant event
              notifications
            </Text>

            <View style={styles.chipsContainer}>
              {CAMPUS_SECTIONS.map((section) => (
                <Pressable
                  key={section}
                  style={[
                    styles.chip,
                    selectedLocations.includes(section) && styles.chipSelected,
                  ]}
                  onPress={() => toggleLocation(section)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedLocations.includes(section) &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {section}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>
              You can change this later in settings
            </Text>
          </View>
        </View>

        {/* Page 3: Terms & Conditions */}
        <View key="4" style={styles.page}>
          <View style={styles.content}>
            <Text style={styles.emoji}>📜</Text>
            <Text style={styles.title}>Terms & Conditions</Text>

            <ScrollView
              style={styles.termsScroll}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.termsText}>{TERMS_AND_CONDITIONS}</Text>
            </ScrollView>

            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the Terms & Conditions
              </Text>
            </Pressable>
          </View>
        </View>
      </PagerView>

      <View style={styles.footer}>
        <View style={styles.navigation}>
          {currentPage > 0 && (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={[styles.backText, { color: colors.text.secondary }]}>
                Back
              </Text>
            </Pressable>
          )}

          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[styles.dot, currentPage === index && styles.dotActive]}
              />
            ))}
          </View>

          <View style={{ width: 60 }} />
        </View>

        {currentPage < 3 ? (
          <Pressable
            style={[
              styles.nextButton,
              !canProceedFromPage(currentPage) && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceedFromPage(currentPage)}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.nextButton,
              (!agreedToTerms || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleGetStarted}
            disabled={!agreedToTerms || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Loading...' : 'Get Started'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: spacing.lg,
      zIndex: 10,
      padding: spacing.sm,
    },
    skipText: {
      ...typography.body,
      color: colors.text.secondary,
    },
    pager: {
      flex: 1,
    },
    page: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
      alignSelf: 'center',
    },
    emoji: {
      fontSize: 72,
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h2,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xxl,
    },
    inputContainer: {
      width: '100%',
      marginTop: spacing.lg,
    },
    label: {
      ...typography.bodySmall,
      color: colors.text.primary,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.text.primary,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border.default,
      borderRadius: borderRadius.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      ...typography.body,
      color: colors.text.primary,
      fontWeight: '600',
    },
    chipTextSelected: {
      color: colors.text.onPrimary,
    },
    hint: {
      ...typography.caption,
      color: colors.text.secondary,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    termsScroll: {
      maxHeight: Dimensions.get('window').height * 0.4,
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    termsText: {
      ...typography.bodySmall,
      color: colors.text.primary,
      lineHeight: 22,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      padding: spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: colors.border.default,
      borderRadius: 6,
      marginRight: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: colors.text.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      ...typography.bodySmall,
      color: colors.text.primary,
      flex: 1,
    },
    footer: {
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    navigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    backButton: {
      width: 60,
      alignItems: 'flex-start',
    },
    backText: {
      ...typography.body,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border.default,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    nextButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.border.default,
    },
    buttonText: {
      ...typography.h5,
      color: colors.text.onPrimary,
      fontWeight: '600',
    },
    roleContainer: {
      width: '100%',
      gap: spacing.lg,
    },
    roleCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    roleCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated ?? colors.surface,
    },
    roleTitle: {
      ...typography.h4,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    roleTitleSelected: {
      color: colors.primary,
    },
    roleDescription: {
      ...typography.bodySmall,
      color: colors.text.secondary,
    },
    roleDescriptionSelected: {
      color: colors.text.primary,
    },
    roleNote: {
      ...typography.caption,
      color: colors.text.secondary,
      marginTop: spacing.sm,
    },
    roleNoteSelected: {
      color: colors.primary,
    },
  });
