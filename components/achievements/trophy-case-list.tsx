import React, { useEffect } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { BadgeThumbnail } from '@/components/achievements/badge-thumbnail';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Shadows, Spacing } from '@/constants/theme';
import {
  ACHIEVEMENT_FAMILIES,
  getHighestUnlockedBadge,
  getVisibleTrophies,
  useAchievementsStore,
} from '@/hooks/use-achievements-store';

type TrophyCaseListProps = {
  isDark?: boolean;
};

type CaseItem = {
  key: string;
  title: string;
  unlocked: boolean;
  /** Highest tier for progression badges; null = locked or special trophy. */
  tier: 'bronze' | 'silver' | 'gold' | null;
  kind: 'achievement' | 'special';
  familyId?: (typeof ACHIEVEMENT_FAMILIES)[number]['id'];
  emoji?: string;
};

/**
 * Visual trophy shelf: badge icon with title underneath.
 * Includes progression achievements and unlocked special/hidden trophies.
 */
export function TrophyCaseList({ isDark = false }: TrophyCaseListProps) {
  const unlockedBadgeIds = useAchievementsStore((s) => s.unlockedBadgeIds);
  const unlockedTrophyIds = useAchievementsStore((s) => s.unlockedTrophyIds);
  const checkAnniversaryTrophies = useAchievementsStore((s) => s.checkAnniversaryTrophies);

  useEffect(() => {
    checkAnniversaryTrophies();
  }, [checkAnniversaryTrophies]);

  const visibleTrophies = getVisibleTrophies(unlockedTrophyIds);

  const items: CaseItem[] = [
    ...ACHIEVEMENT_FAMILIES.map((family) => {
      const highest = getHighestUnlockedBadge(family, unlockedBadgeIds);
      return {
        key: family.id,
        title: family.title,
        unlocked: highest != null,
        tier: highest?.tier ?? null,
        kind: 'achievement' as const,
        familyId: family.id,
      };
    }),
    ...visibleTrophies.map((trophy) => ({
      key: trophy.id,
      title: trophy.title,
      unlocked: unlockedTrophyIds.includes(trophy.id),
      tier: null,
      kind: 'special' as const,
      emoji: trophy.emoji,
    })),
  ];

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.key}
            style={styles.cell}
            accessibilityRole="text"
            accessibilityLabel={`${item.title}${item.unlocked ? ', collected' : ', locked'}`}
          >
            {item.kind === 'achievement' ? (
              <BadgeThumbnail
                tier={item.tier}
                familyId={item.familyId}
                locked={!item.unlocked}
                size={64}
              />
            ) : (
              <View
                style={[
                  styles.specialIcon,
                  item.unlocked ? styles.specialIconUnlocked : styles.specialIconLocked,
                ]}
              >
                {item.emoji && item.unlocked ? (
                  <Text style={styles.specialEmoji}>{item.emoji}</Text>
                ) : (
                  <MaterialIcons
                    name={item.unlocked ? 'military-tech' : 'lock'}
                    size={28}
                    color={item.unlocked ? COLORS.primary : COLORS.text.muted}
                  />
                )}
              </View>
            )}
            <Text
              style={[
                styles.badgeTitle,
                !item.unlocked && styles.badgeTitleLocked,
                isDark && item.unlocked && styles.badgeTitleDark,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Shadows.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -Spacing.sm,
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  specialIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  specialIconUnlocked: {
    backgroundColor: 'rgba(93, 112, 82, 0.1)',
    borderColor: COLORS.primary,
  },
  specialIconLocked: {
    backgroundColor: COLORS.muted,
    borderColor: COLORS.surface.border,
  },
  specialEmoji: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  badgeTitle: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  badgeTitleLocked: {
    color: COLORS.text.muted,
  },
  badgeTitleDark: {
    color: '#FFFFFF',
  },
});
