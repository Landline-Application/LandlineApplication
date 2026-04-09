import React from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CreateAccountForm } from '@/components/auth/create-account-form';
import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { COLORS, Fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingCreateAccountScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Page style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Blob
        color={COLORS.secondary}
        size={220}
        top={-50}
        left={-70}
        opacity={0.07}
        shapeIndex={2}
      />
      <Blob
        color={COLORS.primary}
        size={160}
        bottom={200}
        right={-50}
        opacity={0.06}
        shapeIndex={0}
      />

      <View style={[styles.container, { zIndex: 2 }]}>
        <OnboardingProgress total={3} current={1} labels={['Permissions', 'Account', 'Privacy']} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Optional but recommended for backup and sync.</Text>

          <CreateAccountForm
            onSuccess={() => router.push('/terms-of-service')}
            onSignIn={() => router.replace('/sign-in')}
          />
        </ScrollView>

        {/* Skip — onboarding specific */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label="Skip for now"
            onPress={() => router.push('/terms-of-service')}
            variant="ghost"
            style={styles.skipButton}
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
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginTop: 8,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.mutedForeground,
    marginBottom: 24,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 8,
  },
  skipButton: {
    width: '100%',
  },
});
