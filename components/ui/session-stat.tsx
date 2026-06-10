import React from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';

export interface SessionStatProps {
  label: string;
  value: string;
  tone?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function SessionStat({ label, value, tone = 'primary', style }: SessionStatProps) {
  const valueColor = tone === 'secondary' ? COLORS.secondary : COLORS.primary;
  const bg = tone === 'secondary' ? COLORS.surface.base : COLORS.surface.elevated;

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: COLORS.text.secondary,
  },
  value: {
    fontFamily: 'Fraunces_700Bold',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 28,
  },
});
