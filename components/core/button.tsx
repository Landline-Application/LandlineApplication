import React, { useCallback } from 'react';

import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { COLORS, Motion, Radius, Spacing, TouchTargets, Typography } from '@/constants/theme';
import { haptics } from '@/services/haptics';

export interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<
  string,
  { backgroundColor: string; borderWidth?: number; borderColor?: string }
> = {
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.secondary }, // Changed from accent to secondary
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  danger: { backgroundColor: COLORS.destructive },
};

const sizeStyles: Record<string, { height: number; paddingHorizontal: number }> = {
  sm: { height: TouchTargets.min, paddingHorizontal: Spacing.md },
  md: { height: TouchTargets.md, paddingHorizontal: Spacing.lg },
  lg: { height: TouchTargets.lg, paddingHorizontal: Spacing.xl },
  xl: { height: TouchTargets.xl, paddingHorizontal: Spacing.xxl },
};

const textVariantStyles: Record<string, { color: string }> = {
  primary: { color: COLORS.text.onPrimary },
  secondary: { color: COLORS.text.onSecondary },
  ghost: { color: COLORS.primary },
  danger: { color: COLORS.text.onPrimary },
};

const textSizeStyles: Record<string, { fontSize: number }> = {
  sm: { fontSize: Typography.labelSm.fontSize },
  md: { fontSize: Typography.label.fontSize },
  lg: { fontSize: Typography.label.fontSize },
  xl: { fontSize: Typography.labelLg.fontSize },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  haptic = true,
  style,
  fullWidth = false,
  loading = false,
}: ButtonProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: disabled || loading ? 1 : Motion.scalePress,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [disabled, loading, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;

    if (haptic) {
      haptics.light();
    }

    handlePressOut();
    await onPress?.();
  }, [onPress, disabled, loading, haptic, handlePressOut]);

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textVariant = textVariantStyles[variant];
  const textSize = textSizeStyles[size];

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            height: sizeStyle.height,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            width: fullWidth ? '100%' : 'auto',
            alignSelf: 'stretch',
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? COLORS.muted : variantStyle.backgroundColor,
            borderWidth: variantStyle.borderWidth,
            borderColor: variantStyle.borderColor,
          },
        ]}
        accessible
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        <Text
          style={[
            styles.label,
            { fontSize: textSize.fontSize },
            { color: disabled ? COLORS.text.muted : textVariant.color },
          ]}
        >
          {loading ? '...' : label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});
