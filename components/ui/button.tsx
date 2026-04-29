import React, { useCallback } from 'react';

import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { COLORS, Motion, Radius, Spacing, TouchTargets, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { haptics } from '@/services/haptics';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

// ── Variant & size lookup tables ──────────────────────────────────────────────

const containerSizes: Record<ButtonSize, ViewStyle> = {
  sm: { height: TouchTargets.sm, paddingHorizontal: Spacing.md },
  md: { height: TouchTargets.md, paddingHorizontal: Spacing.lg },
  lg: { height: TouchTargets.lg, paddingHorizontal: Spacing.xl },
  xl: { height: TouchTargets.xl, paddingHorizontal: Spacing.xxl },
};

const textSizes: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: Typography.labelSm.fontSize },
  md: { fontSize: Typography.label.fontSize },
  lg: { fontSize: Typography.labelLg.fontSize },
  xl: { fontSize: Typography.labelLg.fontSize },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  haptic: hapticEnabled = true,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { isDark } = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;
  const containerVariants: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: COLORS.primary },
    secondary: { backgroundColor: COLORS.secondary },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? '#DDDDDD' : COLORS.primary,
    },
    danger: { backgroundColor: COLORS.destructive },
    text: { backgroundColor: 'transparent' },
  };
  const textVariants: Record<ButtonVariant, TextStyle> = {
    primary: { color: COLORS.text.onPrimary },
    secondary: { color: COLORS.text.onSecondary },
    ghost: { color: isDark ? '#FFFFFF' : COLORS.primary },
    danger: { color: COLORS.text.onPrimary },
    text: {
      color: isDark ? '#F3F3F3' : COLORS.text.secondary,
      fontFamily: 'Nunito_400Regular',
      opacity: 0.8,
    },
  };

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: isDisabled ? 1 : Motion.scalePress,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [isDisabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async () => {
    if (isDisabled) return;
    if (hapticEnabled) haptics.light();
    handlePressOut();
    await onPress?.();
  }, [isDisabled, hapticEnabled, handlePressOut, onPress]);

  const loaderColor =
    variant === 'ghost' || variant === 'text' ? COLORS.primary : COLORS.text.onPrimary;

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        style={[
          styles.base,
          containerVariants[variant],
          containerSizes[size],
          { width: fullWidth ? '100%' : 'auto' },
          isDisabled && { opacity: 0.4 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} />
        ) : (
          <Text style={[styles.label, textVariants[variant], textSizes[size], textStyle]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.3,
  },
});
