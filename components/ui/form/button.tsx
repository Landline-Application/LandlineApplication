import React from 'react';

import { ActivityIndicator, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

import { COLORS, Radius, Typography } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import { type VariantProps, cva } from 'class-variance-authority';

const buttonVariants = cva(
  {
    /* Base styles */
    container: {
      borderRadius: Radius.sm,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
    text: {
      fontSize: Typography.label.fontSize,
      fontFamily: 'Nunito_700Bold',
      letterSpacing: 1,
    } as TextStyle,
  },
  {
    variants: {
      variant: {
        primary: {
          container: {
            backgroundColor: COLORS.text.primary,
            shadowColor: COLORS.shadow.dark,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          },
          text: {
            color: COLORS.text.onPrimary,
          },
        },
        outline: {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: COLORS.text.primary,
          },
          text: {
            color: COLORS.text.primary,
          },
        },
        text: {
          container: {
            backgroundColor: 'transparent',
            height: 'auto',
            padding: 10,
          },
          text: {
            color: COLORS.text.secondary,
            fontSize: Typography.body.fontSize,
            fontFamily: 'Nunito_600SemiBold',
            letterSpacing: 0,
            opacity: 0.8,
          },
        },
      },
      size: {
        default: {
          container: { height: 50, paddingHorizontal: 20 },
        },
        sm: {
          container: { height: 36, paddingHorizontal: 12 },
          text: { fontSize: Typography.labelSm.fontSize },
        },
        lg: {
          container: { height: 56, paddingHorizontal: 24 },
          text: { fontSize: Typography.labelLg.fontSize },
        },
      },
      disabled: {
        true: {
          container: { opacity: 0.6 },
        },
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress: () => void;
  loading?: boolean;
  children: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({
  onPress,
  disabled = false,
  loading = false,
  variant,
  size,
  children,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  // CVA works a bit differently with React Native styles since we can't just concatenate strings
  // We use the variant config to pick the right style objects
  const config = buttonVariants({ variant, size, disabled: disabled || loading }) as any;

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const loaderColor =
    variant === 'primary' || !variant ? COLORS.text.onPrimary : COLORS.text.primary;

  return (
    <TouchableOpacity
      style={[config.container, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} />
      ) : (
        <Text style={[config.text, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
