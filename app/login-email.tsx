import React, { useState } from 'react';

import { Platform, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { ContinueWithSocials } from '@/components/ui/form/continue-socials-buttons';
import { EmailPasswordInput } from '@/components/ui/form/email-password-input';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';

export default function LoginEmailPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = password.length >= 6;

    if (!isEmailValid) {
      setEmailError('Please enter a valid email');
    }
    if (!isPasswordValid) {
      setPasswordError('Password must be at least 6 characters');
    }

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const isFormValid = validateEmail(email) && password.length >= 6;

  return (
    <FormLayout>
      <RolodexCard title="LANDLINE">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>Welcome back</Text>
        </View>

        <EmailPasswordInput
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          emailError={emailError}
          passwordError={passwordError}
        />

        {/* Login Button */}
        <Button
          onPress={handleSubmit}
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

        {/* Social Login Buttons */}
        <ContinueWithSocials
          buttons={['google', 'phone']}
          onGooglePress={() => console.log('Google login')}
          onPhonePress={() => router.push('/login')}
        />

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Button onPress={() => router.push('/create-account-email')} variant="text">
            Don&apos;t have an account?
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

  signUpContainer: {
    alignItems: 'center',
  },
});
