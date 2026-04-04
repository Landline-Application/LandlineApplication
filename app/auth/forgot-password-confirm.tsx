import React from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordConfirmPage() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const insets = useSafeAreaInsets();

  return (
    <Page style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Blob color={COLORS.primary} size={200} top={-60} left={-60} opacity={0.07} shapeIndex={0} />
      <Blob
        color={COLORS.secondary}
        size={140}
        bottom={160}
        right={-40}
        opacity={0.06}
        shapeIndex={3}
      />

      {/* Top bar with back button */}
      <View style={[styles.topBar, { paddingTop: 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            If an account exists for <Text style={styles.emailHighlight}>{email}</Text>
            {', '}we&apos;ve sent a password reset link.
          </Text>
          <Text style={styles.hint}>
            Check your inbox and spam folder. The link expires after a short time.
          </Text>
        </View>

        {/* Pops both confirm + forgot-password to land back on sign-in */}
        <Button
          label="Back to Sign In"
          onPress={() => {
            router.dismiss(2);
          }}
          variant="primary"
          style={styles.primaryButton}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn&apos;t receive it?</Text>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.resendAction}>Try again</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 56,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.mutedForeground,
    lineHeight: 22,
    marginBottom: 8,
  },
  emailHighlight: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    color: COLORS.foreground,
  },
  hint: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.mutedForeground,
    lineHeight: 19,
    opacity: 0.8,
  },
  primaryButton: {
    width: '100%',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  resendLabel: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.mutedForeground,
  },
  resendAction: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
