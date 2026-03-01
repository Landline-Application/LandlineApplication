import React, { useState } from 'react';

import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { ContinueWithSocials } from '@/components/ui/form/continue-socials-buttons';
import { EmailPasswordInput } from '@/components/ui/form/email-password-input';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';

export default function LoginEmailPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [wrongPasswordSection, setWrongPasswordSection] = useState(false);
  const [genericLoginError, setGenericLoginError] = useState('');
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setEmailError('');
    setPasswordError('');
    setWrongPasswordSection(false);
    setGenericLoginError('');

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
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/user-not-found') {
        setEmailError('No account found with this email');
      } else if (code === 'auth/wrong-password') {
        setPasswordError('Incorrect password');
        setWrongPasswordSection(true);
        setGenericLoginError('');
      } else if (code === 'auth/invalid-credential') {
        setPasswordError('Invalid email or password');
        setGenericLoginError('Invalid email or password. Please check your email and password and try again.');
        setWrongPasswordSection(false);
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Please try again later.');
      } else {
        Alert.alert('Login Failed', error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError('Enter your email above, then tap Forgot Password again.');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setPasswordError('');
    setGenericLoginError('');
    setWrongPasswordSection(false);
    setIsResettingPassword(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Check your email',
        'If an account exists for this email, we\'ve sent a password reset link. Please check your inbox and spam folder.',
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/user-not-found') {
        setEmailError('No account found with this email.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too many attempts', 'Please try again later.');
      } else {
        Alert.alert('Could not send reset email', error?.message || 'Please try again later.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

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
          onEmailChange={(text) => {
            setEmail(text);
            setWrongPasswordSection(false);
            setGenericLoginError('');
          }}
          onPasswordChange={(text) => {
            setPassword(text);
            setWrongPasswordSection(false);
            setGenericLoginError('');
          }}
          emailError={emailError}
          passwordError={passwordError}
        />

        <View style={styles.forgotPasswordRow}>
          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isResettingPassword}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={[styles.forgotPasswordText, isResettingPassword && styles.forgotPasswordDisabled]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {wrongPasswordSection ? (
          <View style={styles.wrongPasswordSection}>
            <Text style={styles.wrongPasswordSectionText}>
              This email is registered. The password you entered is incorrect. Please try again.
            </Text>
          </View>
        ) : genericLoginError ? (
          <View style={styles.wrongPasswordSection}>
            <Text style={styles.wrongPasswordSectionText}>{genericLoginError}</Text>
          </View>
        ) : null}

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
          onGooglePress={handleGoogleSignIn}
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

  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotPasswordDisabled: {
    opacity: 0.6,
  },

  wrongPasswordSection: {
    backgroundColor: 'rgba(196, 69, 54, 0.12)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#c44536',
  },
  wrongPasswordSectionText: {
    fontSize: 13,
    color: '#c44536',
    lineHeight: 18,
  },
});
