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

// Layout-affecting style keys that must be forwarded to the outer Animated.View
// so that flex, width, etc. participate correctly in the parent's layout.
const LAYOUT_KEYS: (keyof ViewStyle)[] = [
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'position',
  'top',
  'bottom',
  'left',
  'right',
];

function splitStyle(style?: ViewStyle): { outerStyle: ViewStyle; innerStyle: ViewStyle } {
  if (!style) return { outerStyle: {}, innerStyle: {} };
  const outerStyle: ViewStyle = {};
  const innerStyle: ViewStyle = {};
  for (const key of Object.keys(style) as (keyof ViewStyle)[]) {
    if (LAYOUT_KEYS.includes(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (outerStyle as any)[key] = style[key];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (innerStyle as any)[key] = style[key];
    }
  }
  return { outerStyle, innerStyle };
}

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

  // Split caller's style so layout props go to the Animated.View wrapper
  // and visual props (borderRadius, etc.) go to the Pressable.
  const { outerStyle, innerStyle } = splitStyle(style);

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
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { alignSelf: 'stretch' },
        outerStyle,
      ]}
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
          config.container,
          fullWidth && { alignSelf: 'stretch' },
          isDisabled && {
            opacity: 0.6,
            backgroundColor: variant === 'ghost' || variant === 'text' ? undefined : COLORS.muted,
          },
          innerStyle,
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
