import React from 'react';

import { Image, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/theme';

const GLYPH_COLORS = [
  '#5D7052',
  '#C18C5D',
  '#2563eb',
  '#ea580c',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#059669',
];

function glyphColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return GLYPH_COLORS[Math.abs(hash) % GLYPH_COLORS.length] ?? GLYPH_COLORS[0];
}

interface AppGlyphProps {
  name: string;
  iconUri?: string;
  size?: number;
}

export function AppGlyph({ name, iconUri, size = 40 }: AppGlyphProps) {
  const radius = Math.round(size * 0.28);
  if (iconUri) {
    return (
      <Image
        source={{ uri: iconUri }}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: glyphColor(name),
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.42) }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_700Bold',
  },
});
