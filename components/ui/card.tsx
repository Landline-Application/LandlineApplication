import React from 'react';

import { StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';

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

const variantStyles: Record<string, ViewStyle> = {
  base: {
    backgroundColor: COLORS.surface.base,
    borderWidth: 0,
  },
  elevated: {
    backgroundColor: COLORS.surface.elevated,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: COLORS.surface.base,
    borderWidth: 1,
    borderColor: COLORS.surface.border,
  },
};

export const Card = ({
  children,
  variant = 'base',
  shadow = 'md',
  padding = 'md',
  borderRadius = 'lg',
  style,
}: CardProps) => {
  const shadowStyle = shadow !== 'none' ? Shadows[shadow as keyof typeof Shadows] : undefined;

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
