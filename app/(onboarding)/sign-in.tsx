import React from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { SignInForm } from '@/components/auth/sign-in-form';
import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { markOnboardingComplete } from '@/utils/onboarding-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingSignInPage() {
  const insets = useSafeAreaInsets();

  return (
    <Page style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Blob
        color={COLORS.secondary}
        size={200}
        top={-40}
        right={-60}
        opacity={0.07}
        shapeIndex={1}
      />
      <Blob
        color={COLORS.primary}
        size={140}
        bottom={180}
        left={-40}
        opacity={0.06}
        shapeIndex={2}
      />

      {/* Top bar: back button to return to create-account */}
      <View style={[styles.topBar, { paddingTop: 8 }]}>
        <Pressable
          onPress={() => router.replace('/create-account')}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back to create account"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to sync your Landline settings.</Text>
        </View>

        <SignInForm
          onSuccess={async () => {
            try {
              await markOnboardingComplete();
            } catch (e) {
              console.warn('markOnboardingComplete', e);
            }
            router.replace('/(tabs)');
          }}
          onForgotPassword={() => router.push('/auth/forgot-password')}
          onCreateAccount={() => router.replace('/create-account')}
        />
      </ScrollView>

      {/* Skip — onboarding-only, never shown from settings */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Skip for now"
          onPress={async () => {
            try {
              await markOnboardingComplete();
            } catch (e) {
              console.warn('markOnboardingComplete', e);
            }
            router.replace('/(tabs)');
          }}
          variant="ghost"
          style={styles.skipButton}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    zIndex: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    backgroundColor: COLORS.surface.overlay,
  },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.mutedForeground,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    zIndex: 2,
  },
  skipButton: {
    width: '100%',
  },
});
