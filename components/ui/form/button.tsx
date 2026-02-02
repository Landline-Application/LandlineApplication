import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { COLORS } from '@/constants/colors';

interface ButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'text';
  children: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  children,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'outline' && styles.outlineButton,
    variant === 'text' && styles.textButton,
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryButtonText,
    variant === 'outline' && styles.outlineButtonText,
    variant === 'text' && styles.textButtonText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.cardBg : COLORS.textPrimary} />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
  },
  textButton: {
    backgroundColor: 'transparent',
    height: 'auto',
    padding: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  primaryButtonText: {
    color: COLORS.cardBg,
  },
  outlineButtonText: {
    color: COLORS.textPrimary,
  },
  textButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
    letterSpacing: 0,
  },
});
