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
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { haptics } from '@/services/haptics';

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
  const { theme, density, isEasy } = useThemeTokens();
  const c = theme.colors;

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const containerVariants: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: isEasy ? c.primary : COLORS.primary },
    secondary: isEasy
      ? { backgroundColor: c.surface, borderWidth: 2, borderColor: c.primary }
      : { backgroundColor: COLORS.secondary },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: isEasy ? 2 : 1.5,
      borderColor: isDark ? '#DDDDDD' : isEasy ? c.primary : COLORS.primary,
    },
    danger: { backgroundColor: isEasy ? c.danger : COLORS.destructive },
    text: { backgroundColor: 'transparent' },
  };

  const textVariants: Record<ButtonVariant, TextStyle> = {
    primary: { color: isEasy ? c.primaryText : COLORS.text.onPrimary },
    secondary: { color: isEasy ? c.primary : COLORS.text.onSecondary },
    ghost: { color: isDark ? '#FFFFFF' : isEasy ? c.primary : COLORS.primary },
    danger: { color: isEasy ? c.primaryText : COLORS.text.onPrimary },
    text: {
      color: isDark ? '#F3F3F3' : isEasy ? c.muted : COLORS.text.secondary,
      fontFamily: 'Nunito_400Regular',
      opacity: isEasy ? 1 : 0.8,
    },
  };

  const easyContainer: ViewStyle | undefined = isEasy
    ? {
        height: Math.max(TouchTargets[size], density.minTouch),
        paddingHorizontal: density.padding * 1.5,
        borderRadius: density.borderRadius,
      }
    : undefined;

  const easyText: TextStyle | undefined = isEasy
    ? { fontSize: density.fontSize, fontFamily: theme.fonts.medium }
    : undefined;

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
    variant === 'ghost' || variant === 'text'
      ? isEasy
        ? c.primary
        : COLORS.primary
      : isEasy
        ? c.primaryText
        : COLORS.text.onPrimary;

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
          easyContainer,
          { width: fullWidth ? '100%' : 'auto' },
          isDisabled && { opacity: 0.4 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} />
        ) : (
          <Text style={[styles.label, textVariants[variant], textSizes[size], easyText, textStyle]}>
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