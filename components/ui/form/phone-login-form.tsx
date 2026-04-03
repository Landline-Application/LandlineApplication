import React from 'react';

import { Alert, StyleSheet, Text, View } from 'react-native';

import { Href, router } from 'expo-router';

import { Button } from '@/components/ui/form/button';
import { ContinueWithSocials } from '@/components/ui/form/continue-socials-buttons';
import { PhoneInput } from '@/components/ui/form/phone-number';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePhoneAuth } from '@/hooks/use-phone-auth';

interface PhoneLoginFormProps {
  /** Route to navigate to on successful phone auth */
  onSuccess?: () => void;
  /** Route pushed when user taps "Continue with Email" */
  emailRoute?: Href;
  /** Text shown below the sign-in/sign-up link area */
  footerLinkLabel: string;
  /** Route for the footer link (e.g. to switch between login/signup) */
  footerLinkRoute: Href;
}

/**
 * Reusable phone-number authentication form.
 * Kept for future use — the primary login/signup flows use email instead.
 */
export function PhoneLoginForm({
  onSuccess,
  emailRoute,
  footerLinkLabel,
  footerLinkRoute,
}: PhoneLoginFormProps) {
  const { signInWithGoogle } = useAuth();
  const {
    detectedCountry,
    phoneInput,
    isLoading,
    isFormValid,
    handlePhoneNumberChange,
    submitPhone,
  } = usePhoneAuth({ onSuccess });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      else router.replace('/(tabs)');
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(
          'Google Sign-In Failed',
          (error as Error)?.message || 'An unexpected error occurred.',
        );
      }
    }
  };

  return (
    <>
      <PhoneInput
        value={phoneInput}
        onChangeText={handlePhoneNumberChange}
        detectedCountry={detectedCountry}
        isValid={isFormValid}
      />

      <Button
        onPress={submitPhone}
        disabled={!isFormValid || isLoading}
        loading={isLoading}
        variant="primary"
      >
        CONTINUE
      </Button>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <ContinueWithSocials
        buttons={['google', 'email']}
        onGooglePress={handleGoogleSignIn}
        onEmailPress={() => emailRoute && router.push(emailRoute)}
      />

      <View style={styles.footerContainer}>
        <Button onPress={() => router.push(footerLinkRoute)} variant="text">
          {footerLinkLabel}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surface.border,
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerContainer: {
    alignItems: 'center',
  },
});
