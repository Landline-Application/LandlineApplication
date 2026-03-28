import React, { useState } from 'react';

import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { router } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const validateEmail = (value: string) => EMAIL_REGEX.test(value);

  const handleSubmit = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      router.replace({ pathname: '/forgot-password-confirm', params: { email: email.trim() } });
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/user-not-found') {
        // Don't reveal whether an account exists — show the confirmation screen anyway
        router.replace({ pathname: '/forgot-password-confirm', params: { email: email.trim() } });
      } else if (code === 'auth/too-many-requests') {
        setEmailError('Too many attempts. Please try again later.');
      } else {
        setEmailError(error?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validateEmail(email);

  return (
    <FormLayout>
      <RolodexCard title="LANDLINE">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>Reset your password</Text>
        </View>

        <Text style={styles.instructions}>
          Enter the email address associated with your account and we&apos;ll send you a password
          reset link.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Email address"
            accessibilityErrorMessage={emailError}
          />
          {emailError ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {emailError}
            </Text>
          ) : null}
        </View>

        <Button
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
          loading={isLoading}
          variant="primary"
        >
          SEND RESET LINK
        </Button>

        <View style={styles.backContainer}>
          <Button onPress={() => router.back()} variant="text">
            Back to sign in
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
  instructions: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputError: {
    borderColor: '#c44536',
  },
  errorText: {
    fontSize: 12,
    color: '#c44536',
    marginTop: 4,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
});
