import React from 'react';

import { StyleSheet, View } from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS } from '@/constants/theme';
import type { BadgeTier } from '@/hooks/use-achievements-store';

export const TIER_COLORS: Record<BadgeTier, { solid: string; muted: string }> = {
  bronze: { solid: '#B87333', muted: 'rgba(184, 115, 51, 0.12)' },
  silver: { solid: '#8A8D91', muted: 'rgba(138, 141, 145, 0.14)' },
  gold: { solid: '#C4A035', muted: 'rgba(196, 160, 53, 0.14)' },
};

type BadgeThumbnailProps = {
  /** Highest unlocked tier; null shows locked thumbnail. */
  tier: BadgeTier | null;
  size?: number;
};

/** Trophy thumbnail for a badge family — shows highest unlocked tier colors. */
export function BadgeThumbnail({ tier, size = 48 }: BadgeThumbnailProps) {
  const unlocked = tier != null;
  const colors = unlocked ? TIER_COLORS[tier] : null;
  const iconSize = Math.round(size * 0.46);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        unlocked && colors
          ? { backgroundColor: colors.muted, borderColor: colors.solid }
          : styles.locked,
      ]}
    >
      <MaterialIcons
        name={unlocked ? 'emoji-events' : 'lock'}
        size={iconSize}
        color={unlocked && colors ? colors.solid : COLORS.text.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  locked: {
    backgroundColor: COLORS.muted,
    borderColor: COLORS.surface.border,
  },
});
