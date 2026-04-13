import React from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export interface SessionCardProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

const variantConfig = {
  primary: {
    bgColor: COLORS.surface.elevated,
    valueColor: COLORS.primary,
    labelColor: COLORS.text.secondary,
  },
  secondary: {
    bgColor: COLORS.surface.base,
    valueColor: COLORS.secondary,
    labelColor: COLORS.text.muted,
  },
} as const;

export const SessionCard = ({ label, value, variant = 'primary', style }: SessionCardProps) => {
  const { bgColor, valueColor, labelColor } = variantConfig[variant];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
    minHeight: 100,
    ...Shadows.sm,
  },
  label: {
    fontSize: Typography.labelSm.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Fraunces_700Bold',
  },
});
