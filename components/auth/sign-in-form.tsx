import React, { useState } from 'react';

import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { OutlinedField } from '@/components/auth/outlined-field';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { Ionicons } from '@expo/vector-icons';

export interface SignInFormProps {
  /** Called after a successful sign-in (email or Google). */
  onSuccess: () => void;
  /** Called when the user taps "Forgot Password?". */
  onForgotPassword: () => void;
  /** Called when the user taps "Don't have an account?". */
  onCreateAccount: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword, onCreateAccount }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isFormValid = validateEmail(email) && password.length >= 6;

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setFormError('');
  };

  const handleSubmit = async () => {
    clearErrors();
    let valid = true;
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setEmailError('No account found with this email');
      } else if (code === 'auth/wrong-password') {
        setPasswordError('Incorrect password');
        setFormError('The password you entered is incorrect. Please try again.');
      } else if (code === 'auth/invalid-credential') {
        setFormError('Invalid email or password. Please check your credentials and try again.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Please try again later.');
      } else {
        Alert.alert('Sign In Failed', (error as Error)?.message || 'An unexpected error occurred.');
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
          clearErrors();
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
          clearErrors();
        }}
        error={passwordError}
        secureTextEntry={!showPassword}
        editable={!isLoading}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
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

      {/* Forgot password — right-aligned, M3 text button pattern */}
      <View style={styles.forgotRow}>
        <Pressable
          onPress={onForgotPassword}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          hitSlop={8}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </View>

      {/* Form-level error (wrong password / invalid credential) */}
      {!!formError && (
        <View style={styles.formErrorBox} accessibilityLiveRegion="polite">
          <MaterialIcons name="error-outline" size={16} color={COLORS.destructive} />
          <Text style={styles.formErrorText}>{formError}</Text>
        </View>
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
        accessibilityLabel="Sign in"
        accessibilityState={{ disabled: !isFormValid || isLoading }}
      >
        <Text style={styles.primaryButtonText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
      </Pressable>

      {/* OR divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google sign-in — outlined button, M3 pattern */}
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

      {/* Switch to create account */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Don&apos;t have an account?</Text>
        <Pressable onPress={onCreateAccount} hitSlop={8} accessibilityRole="button">
          <Text style={styles.switchAction}>Create one</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  forgotText: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 13,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(168, 84, 72, 0.08)',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.destructive,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  formErrorText: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.destructive,
    lineHeight: 18,
  },
  primaryButton: {
    height: 48,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
});
