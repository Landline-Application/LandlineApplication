import React, { useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { OutlinedField } from '@/components/auth/outlined-field';
import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const insets = useSafeAreaInsets();

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
      router.replace({
        pathname: '/auth/forgot-password-confirm',
        params: { email: email.trim() },
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        // Don't reveal whether an account exists — show the confirmation screen anyway
        router.replace({
          pathname: '/auth/forgot-password-confirm',
          params: { email: email.trim() },
        });
      } else if (code === 'auth/too-many-requests') {
        setEmailError('Too many attempts. Please try again later.');
      } else {
        setEmailError((error as Error)?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validateEmail(email);

  return (
    <Page style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Blob
        color={COLORS.secondary}
        size={180}
        top={-40}
        right={-50}
        opacity={0.07}
        shapeIndex={1}
      />
      <Blob
        color={COLORS.primary}
        size={130}
        bottom={200}
        left={-40}
        opacity={0.06}
        shapeIndex={2}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you a reset link.
          </Text>
        </View>

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
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
        />

        <Button
          label={isLoading ? 'Sending…' : 'Send Reset Link'}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
          loading={isLoading}
          variant="primary"
          style={styles.submitButton}
        />
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
    paddingTop: 8,
    paddingBottom: 32,
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
  submitButton: {
    marginTop: 24,
    width: '100%',
  },
});
