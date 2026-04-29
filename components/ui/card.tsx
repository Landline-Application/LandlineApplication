import React from 'react';

import { StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'outlined';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  borderRadius?: 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const paddingValues: Record<string, number> = {
  none: 0,
  sm: Spacing.md,
  md: Spacing.lg,
  lg: Spacing.xxl,
};

const radiusValues: Record<string, number> = {
  md: Radius.md,
  lg: Radius.lg,
  xl: Radius.xl,
};

export const Card = ({
  children,
  variant = 'base',
  shadow = 'md',
  padding = 'md',
  borderRadius = 'lg',
  style,
}: CardProps) => {
  const { isDark } = useAppTheme();
  const shadowStyle = shadow !== 'none' ? Shadows[shadow as keyof typeof Shadows] : undefined;
  const variantStyles: Record<string, ViewStyle> = {
    base: {
      backgroundColor: isDark ? '#5f5f5f' : COLORS.surface.base,
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: isDark ? '#4f4f4f' : COLORS.surface.elevated,
      borderWidth: 0,
    },
    outlined: {
      backgroundColor: isDark ? '#5f5f5f' : COLORS.surface.base,
      borderWidth: 1,
      borderColor: isDark ? '#3a3a3a' : COLORS.surface.border,
    },
  };

  return (
    <View
      style={[
        styles.base,
        { borderRadius: radiusValues[borderRadius], padding: paddingValues[padding] },
        variantStyles[variant],
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    // Structural base — dynamic values applied via style array above
  },
});
