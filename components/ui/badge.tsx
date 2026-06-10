import React from 'react';

import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { COLORS, Radius, Typography } from '@/constants/theme';

export type BadgeTone = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  soft?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const toneColors: Record<BadgeTone, string> = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  neutral: COLORS.text.muted,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.error,
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Badge({ label, tone = 'primary', soft = true, style, textStyle }: BadgeProps) {
  const color = toneColors[tone];
  const bgColor = soft ? hexToRgba(color, 0.14) : color;
  const borderColor = soft ? hexToRgba(color, 0.3) : 'transparent';
  const textColor = soft ? color : '#fff';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bgColor, borderColor, borderWidth: soft ? 1 : 0 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  text: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: Typography.captionSm.fontSize,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
});
