import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS } from '@/constants/theme';
import {
  DAILY_STREAK_FAMILY_ID,
  NOTIFICATIONS_BLOCKED_FAMILY_ID,
  TIME_AWAY_FAMILY_ID,
  type AchievementFamilyId,
  type BadgeTier,
} from '@/hooks/use-achievements-store';

export const TIER_COLORS: Record<BadgeTier, { solid: string; muted: string }> = {
  bronze: { solid: '#B87333', muted: 'rgba(184, 115, 51, 0.12)' },
  silver: { solid: '#8A8D91', muted: 'rgba(138, 141, 145, 0.14)' },
  gold: { solid: '#C4A035', muted: 'rgba(196, 160, 53, 0.14)' },
};

/** Unique badge glyphs per achievement family (same symbol for bronze / silver / gold). */
export const FAMILY_EMOJI: Record<AchievementFamilyId, string> = {
  [TIME_AWAY_FAMILY_ID]: '🏖️',
  [DAILY_STREAK_FAMILY_ID]: '🔥',
  [NOTIFICATIONS_BLOCKED_FAMILY_ID]: '🚫',
};

type BadgeThumbnailProps = {
  /** Tier color ring — pass the tier even when locked so bronze/silver/gold stay visible. */
  tier: BadgeTier | null;
  /** Achievement family — picks the unique badge symbol. */
  familyId?: AchievementFamilyId;
  /** True when this tier is not yet earned (muted symbol, tier-colored ring). */
  locked?: boolean;
  size?: number;
};

/**
 * Family badge: unique symbol inside a bronze / silver / gold ring.
 * Locked tiers still show the symbol and tier color — only muted.
 */
export function BadgeThumbnail({
  tier,
  familyId,
  locked = false,
  size = 48,
}: BadgeThumbnailProps) {
  const emoji = familyId ? FAMILY_EMOJI[familyId] : null;
  const emojiSize = Math.round(size * 0.42);
  const lockSize = Math.round(size * 0.46);
  const hasTier = tier != null;
  const colors = hasTier ? TIER_COLORS[tier] : null;
  const earned = hasTier && !locked;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        hasTier && colors
          ? {
              backgroundColor: colors.muted,
              borderColor: colors.solid,
              opacity: locked ? 0.72 : 1,
            }
          : styles.locked,
      ]}
    >
      {emoji ? (
        <Text
          style={[
            styles.emoji,
            {
              fontSize: emojiSize,
              lineHeight: emojiSize + 4,
              opacity: earned ? 1 : 0.38,
            },
          ]}
        >
          {emoji}
        </Text>
      ) : earned ? (
        <MaterialIcons name="emoji-events" size={lockSize} color={colors?.solid ?? COLORS.primary} />
      ) : (
        <MaterialIcons name="lock" size={lockSize} color={COLORS.text.muted} />
      )}
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
  emoji: {
    textAlign: 'center',
  },
});
