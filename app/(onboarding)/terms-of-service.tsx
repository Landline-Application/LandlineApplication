import React, { useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Blob, Button, Card, Page } from '@/components/onboarding/onboarding-primitives';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { TERMS_OF_USE } from '@/constants/legal-content';
import { COLORS, Fonts } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <Page
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Blob
        color={COLORS.primary}
        size={240}
        top={-60}
        right={-80}
        opacity={0.06}
        shapeIndex={3}
      />
      <Blob
        color={COLORS.accent}
        size={180}
        bottom={140}
        left={-60}
        opacity={0.1}
        shapeIndex={1}
      />

      <View style={styles.container}>
        <OnboardingProgress
          total={4}
          current={2}
          labels={['Permissions', 'Account', 'Terms', 'Privacy']}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Please review the terms before continuing.</Text>

          <Card shapeVariant={0} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Important</Text>
            <Text style={styles.summaryBody}>
              Landline needs notification access and background services to work correctly. These
              terms describe app usage, permissions, and your responsibilities.
            </Text>
          </Card>

          <Text style={styles.legalBody} selectable>
            {TERMS_OF_USE}
          </Text>

          <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkboxRow}>
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <MaterialIcons name="check" size={20} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>I have read and accept the Terms of Service.</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            label="Continue to Privacy Policy"
            onPress={() => router.push('/privacy-policy')}
            variant="primary"
            disabled={!agreedToTerms}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    marginBottom: 20,
    lineHeight: 24,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: Fonts?.serif ?? 'Fraunces_600SemiBold',
    fontSize: 20,
    color: COLORS.foreground,
    marginBottom: 8,
  },
  summaryBody: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.accentForeground,
    lineHeight: 22,
  },
  legalBody: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.accentForeground,
    lineHeight: 22,
    marginBottom: 28,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.foreground,
    lineHeight: 22,
  },
  bottomBar: {
    paddingVertical: 16,
  },
  actionButton: {
    width: '100%',
  },
});
