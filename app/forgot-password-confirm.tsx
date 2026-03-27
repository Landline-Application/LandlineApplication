import React from 'react';

import { Platform, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';

export default function ForgotPasswordConfirmPage() {
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <FormLayout>
      <RolodexCard title="LANDLINE">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>Check your email</Text>
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <Text style={styles.body}>
          If an account exists for <Text style={styles.emailHighlight}>{email}</Text>
          {', '}we&apos;ve sent a password reset link. Please check your inbox and spam folder.
        </Text>

        <Text style={styles.hint}>
          The link will expire after a short time. If you don&apos;t receive it, you can request
          another one.
        </Text>

        <Button onPress={() => router.replace('/login')} variant="primary">
          BACK TO SIGN IN
        </Button>

        <View style={styles.resendContainer}>
          <Button onPress={() => router.replace('/forgot-password')} variant="text">
            Didn&apos;t receive it? Try again.
          </Button>
        </View>
      </RolodexCard>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailHighlight: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
});
