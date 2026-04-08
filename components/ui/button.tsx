import React, { useCallback } from 'react';

import {
  ActivityIndicator,
  Animated,
  Pressable,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Text } from 'react-native';

import { COLORS, Motion, Radius, Spacing, TouchTargets, Typography } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import { type VariantProps, cva } from 'class-variance-authority';

// ── Variant definition ────────────────────────────────────────────────────────

const buttonVariants = cva(
  {
    container: {
      borderRadius: Radius.xl,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    } as ViewStyle,
    text: {
      fontFamily: 'Nunito_600SemiBold',
      letterSpacing: 0.3,
    } as TextStyle,
  },
  {
    variants: {
      variant: {
        primary: {
          container: {
            backgroundColor: COLORS.primary,
          } as ViewStyle,
          text: {
            color: COLORS.text.onPrimary,
          } as TextStyle,
        },
        secondary: {
          container: {
            backgroundColor: COLORS.secondary,
          } as ViewStyle,
          text: {
            color: COLORS.text.onSecondary,
          } as TextStyle,
        },
        ghost: {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: COLORS.primary,
          } as ViewStyle,
          text: {
            color: COLORS.primary,
          } as TextStyle,
        },
        danger: {
          container: {
            backgroundColor: COLORS.destructive,
          } as ViewStyle,
          text: {
            color: COLORS.text.onPrimary,
          } as TextStyle,
        },
        text: {
          container: {
            backgroundColor: 'transparent',
          } as ViewStyle,
          text: {
            color: COLORS.text.secondary,
            fontFamily: 'Nunito_400Regular',
            opacity: 0.8,
          } as TextStyle,
        },
      },
      size: {
        sm: {
          container: { height: TouchTargets.sm, paddingHorizontal: Spacing.md } as ViewStyle,
          text: { fontSize: Typography.labelSm.fontSize } as TextStyle,
        },
        md: {
          container: { height: TouchTargets.md, paddingHorizontal: Spacing.lg } as ViewStyle,
          text: { fontSize: Typography.label.fontSize } as TextStyle,
        },
        lg: {
          container: { height: TouchTargets.lg, paddingHorizontal: Spacing.xl } as ViewStyle,
          text: { fontSize: Typography.labelLg.fontSize } as TextStyle,
        },
        xl: {
          container: { height: TouchTargets.xl, paddingHorizontal: Spacing.xxl } as ViewStyle,
          text: { fontSize: Typography.labelLg.fontSize } as TextStyle,
        },
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant,
  size,
  disabled = false,
  loading = false,
  haptic: hapticEnabled = true,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // CVA returns the matched variant config objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = buttonVariants({ variant, size }) as any as {
    container: ViewStyle;
    text: TextStyle;
  };

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    Animated.timing(scaleAnim, {
      toValue: Motion.scalePress,
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
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        style={[
          config.container,
          fullWidth && { width: '100%', alignSelf: 'stretch' },
          isDisabled && {
            opacity: 0.6,
            backgroundColor: variant === 'ghost' || variant === 'text' ? undefined : COLORS.muted,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} />
        ) : (
          <Text style={[config.text, textStyle]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
