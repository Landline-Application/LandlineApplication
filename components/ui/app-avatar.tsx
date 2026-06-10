import React from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS } from '@/constants/theme';

const TINTS = [
  'rgba(93,112,82,0.13)',
  'rgba(193,140,93,0.13)',
  'rgba(93,112,82,0.08)',
  'rgba(193,140,93,0.08)',
];

function initials(name: string): string {
  return (name || '')
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase())
    .join('');
}

export interface AppAvatarProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function AppAvatar({ name, size = 28, color = COLORS.primary, style }: AppAvatarProps) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  const bg = TINTS[hash % TINTS.length];

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: Math.round(size * 0.36), color },
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
