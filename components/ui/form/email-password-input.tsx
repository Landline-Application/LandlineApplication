import React from 'react';

import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface EmailPasswordInputProps {
  email: string;
  password: string;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onEmailBlur?: () => void;
  onPasswordBlur?: () => void;
  emailError?: string;
  passwordError?: string;
  isLoading?: boolean;
}

export function EmailPasswordInput({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onPasswordBlur,
  emailError,
  passwordError,
  isLoading = false,
}: EmailPasswordInputProps) {
  return (
    <>
      <View style={styles.group}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          value={email}
          onChangeText={onEmailChange}
          onBlur={onEmailBlur}
          placeholder="your@email.com"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          accessibilityLabel="Email Input"
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          value={password}
          onChangeText={onPasswordChange}
          onBlur={onPasswordBlur}
          placeholder="Enter your password"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          accessibilityLabel="Password Input"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputError: {
    borderColor: '#c44536',
  },
});
