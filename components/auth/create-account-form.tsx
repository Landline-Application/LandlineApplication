import React, { useState } from 'react';

import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthCheckbox } from '@/components/auth/auth-checkbox';
import { OutlinedField } from '@/components/auth/outlined-field';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  getPasswordRequirements,
  isSignupPasswordValid,
  PASSWORD_MIN_LENGTH,
} from '@/utils/password-requirements';
import { Ionicons } from '@expo/vector-icons';

export interface CreateAccountFormProps {
  /**
   * Called after a successful account creation or Google sign-in.
   * The page decides where to navigate next.
   */
  onSuccess: () => void;
  /** Called when the user taps "Already have an account? Sign in". */
  onSignIn: () => void;
}

export function CreateAccountForm({ onSuccess, onSignIn }: CreateAccountFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [ageError, setAgeError] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const passwordRequirements = getPasswordRequirements(password);

  const isFormValid =
    validateEmail(email) &&
    isSignupPasswordValid(password) &&
    confirmPassword === password &&
    ageVerified;

  const clearFieldErrors = () => {
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setAgeError(false);
  };

  const handleSubmit = async () => {
    clearFieldErrors();
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }
    if (!isSignupPasswordValid(password)) {
      const reqs = getPasswordRequirements(password);
      const missing = reqs.filter((r) => !r.met);
      setPasswordError(
        missing.length === 2
          ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include 1 special character`
          : missing[0]?.id === 'length'
            ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
            : 'Password must include at least 1 special character (such as ! @ # $ %)',
      );
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }
    if (!ageVerified) {
      setAgeError(true);
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      await signUp(email, password);
      Alert.alert(
        'Verify Your Email',
        'A verification link has been sent to your email address. Please check your inbox.',
        [{ text: 'OK', onPress: onSuccess }],
      );
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setEmailError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setPasswordError(
          `Use at least ${PASSWORD_MIN_LENGTH} characters and include 1 special character`,
        );
      } else if (code === 'auth/invalid-email') {
        setEmailError('Please enter a valid email address');
      } else if (code === 'verification-email-failed' || code === 'auth/too-many-requests') {
        Alert.alert(
          'Account Created',
          'Your account was created, but the verification email could not be sent. Check your spam folder or request a new link from Settings.',
          [{ text: 'OK', onPress: onSuccess }],
        );
      } else {
        Alert.alert('Sign Up Failed', (error as Error)?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(
          'Google Sign-In Failed',
          (error as Error)?.message || 'An unexpected error occurred.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <OutlinedField
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError('');
        }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        returnKeyType="next"
      />

      <OutlinedField
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError('');
          setConfirmError('');
        }}
        error={passwordError}
        secureTextEntry={!showPassword}
        editable={!isLoading}
        returnKeyType="next"
        trailingIcon={
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={COLORS.mutedForeground}
            />
          </Pressable>
        }
      />

      <View style={styles.requirementsBlock} accessibilityRole="text">
        <Text style={styles.requirementsTitle}>Password requirements</Text>
        {passwordRequirements.map((req) => (
          <View key={req.id} style={styles.requirementRow}>
            <MaterialIcons
              name={req.met ? 'check-circle' : 'radio-button-unchecked'}
              size={18}
              color={req.met ? COLORS.success : COLORS.mutedForeground}
              style={styles.requirementIcon}
            />
            <Text
              style={[styles.requirementLabel, req.met && styles.requirementLabelMet]}
              accessibilityLabel={`${req.label}${req.met ? ', satisfied' : ', not yet satisfied'}`}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>

      <OutlinedField
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setConfirmError('');
        }}
        error={confirmError}
        secureTextEntry={!showConfirm}
        editable={!isLoading}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        trailingIcon={
          <Pressable
            onPress={() => setShowConfirm((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            hitSlop={8}
          >
            <MaterialIcons
              name={showConfirm ? 'visibility-off' : 'visibility'}
              size={20}
              color={COLORS.mutedForeground}
            />
          </Pressable>
        }
      />

      {/* Age verification — M3 checkbox */}
      <AuthCheckbox
        checked={ageVerified}
        onToggle={() => {
          setAgeVerified((v) => !v);
          setAgeError(false);
        }}
        error={ageError}
        disabled={isLoading}
        label={
          <Text style={styles.checkboxLabel}>
            I confirm I am <Text style={styles.checkboxLabelBold}>13 years or older</Text>
          </Text>
        }
      />
      {ageError && (
        <Text style={styles.ageErrorText} accessibilityLiveRegion="polite">
          You must confirm your age to create an account
        </Text>
      )}

      {/* Primary CTA */}
      <Pressable
        onPress={handleSubmit}
        disabled={!isFormValid || isLoading}
        style={({ pressed }) => [
          styles.primaryButton,
          (!isFormValid || isLoading) && styles.primaryButtonDisabled,
          pressed && isFormValid && !isLoading && styles.primaryButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityState={{ disabled: !isFormValid || isLoading }}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Creating account…' : 'Create Account'}
        </Text>
      </Pressable>

      {/* OR divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google sign-up — outlined button */}
      <Pressable
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        style={({ pressed }) => [styles.outlinedButton, pressed && styles.outlinedButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        <Ionicons name="logo-google" size={18} color={COLORS.foreground} />
        <Text style={styles.outlinedButtonText}>Continue with Google</Text>
      </Pressable>

      {/* Switch to sign in */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Already have an account?</Text>
        <Pressable onPress={onSignIn} hitSlop={8} accessibilityRole="button">
          <Text style={styles.switchAction}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxLabel: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.foreground,
    lineHeight: 20,
  },
  checkboxLabelBold: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    color: COLORS.foreground,
  },
  ageErrorText: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.destructive,
    marginTop: -4,
    marginBottom: 12,
    marginLeft: 30, // align with checkbox label
    lineHeight: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.primaryForeground,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.mutedForeground,
    letterSpacing: 0.5,
  },
  outlinedButton: {
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  outlinedButtonPressed: {
    backgroundColor: COLORS.surface.overlay,
  },
  outlinedButtonText: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.foreground,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.mutedForeground,
  },
  switchAction: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  requirementsBlock: {
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  requirementsTitle: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 13,
    color: COLORS.foreground,
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  requirementIcon: {
    marginTop: 1,
  },
  requirementLabel: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.mutedForeground,
    lineHeight: 18,
  },
  requirementLabelMet: {
    color: COLORS.foreground,
  },
});
