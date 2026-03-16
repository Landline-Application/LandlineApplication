import React from 'react';

import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { ContinueWithSocials } from '@/components/ui/form/continue-socials-buttons';
import { PhoneInput } from '@/components/ui/form/phone-number';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { usePhoneAuth } from '@/hooks/use-phone-auth';

export default function CreateAccountPage() {
  const { signInWithGoogle } = useAuth();
  const {
    detectedCountry,
    phoneInput,
    isLoading,
    isFormValid,
    handlePhoneNumberChange,
    submitPhone,
  } = usePhoneAuth({
    onSuccess: () => router.replace('/(tabs)'),
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-In Failed', error?.message || 'An unexpected error occurred.');
      }
    }
  };

  return (
    <FormLayout>
      <RolodexCard title="LANDLINE">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>Stay connected, stay present</Text>
        </View>

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

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <ContinueWithSocials
          buttons={['google', 'email']}
          onGooglePress={handleGoogleSignIn}
          onEmailPress={() => router.push('/create-account-email')}
        />

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Button onPress={() => router.push('/login')} variant="text">
            Already have an account?
          </Button>
        </View>
      </RolodexCard>

      <Button onPress={() => router.replace('/(tabs)')} variant="text">
        Skip
      </Button>
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

  // Divider Section
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  loginLinkContainer: {
    alignItems: 'center',
  },
});
