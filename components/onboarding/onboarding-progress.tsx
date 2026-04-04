import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { COLORS, Fonts, Radius } from '@/constants/theme';

interface OnboardingProgressProps {
  total: number;
  current: number; // 0-indexed
  labels?: string[];
}

export function OnboardingProgress({ total, current, labels }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index <= current;
          const isCurrent = index === current;
          return (
            <View
              key={index}
              style={[
                styles.segment,
                isActive && styles.segmentActive,
                isCurrent && styles.segmentCurrent,
                index === 0 && styles.segmentFirst,
                index === total - 1 && styles.segmentLast,
              ]}
            />
          );
        })}
      </View>
      {labels && labels[current] && <Text style={styles.label}>{labels[current]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segment: {
    height: 4,
    flex: 1,
    maxWidth: 64,
    backgroundColor: COLORS.border,
    borderRadius: Radius.pill,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentCurrent: {
    height: 6,
    backgroundColor: COLORS.primary,
  },
  segmentFirst: {
    borderTopLeftRadius: Radius.pill,
    borderBottomLeftRadius: Radius.pill,
  },
  segmentLast: {
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
  },
  label: {
    fontFamily: Fonts?.sansMedium ?? 'Nunito_500Medium',
    fontSize: 13,
    color: COLORS.mutedForeground,
    letterSpacing: 0.3,
  },
});
