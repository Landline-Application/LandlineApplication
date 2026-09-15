import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { BadgeThumbnail, TIER_COLORS } from '@/components/achievements/badge-thumbnail';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Shadows, Spacing } from '@/constants/theme';
import {
  ACHIEVEMENT_FAMILIES,
  type AchievementFamily,
  type BadgeDefinition,
  familyProgressLabel,
  formatBadgeTierStatus,
  getHighestUnlockedBadge,
  useAchievementsStore,
} from '@/hooks/use-achievements-store';
import { haptics } from '@/services/haptics';

type AchievementsFamilyListProps = {
  isDark?: boolean;
  /** When false (Trophy Case), hide unlock progress lines — thumbnail still shows highest tier. */
  showProgressStatus?: boolean;
};

/**
 * Clickable achievement families (e.g. Time Away). Thumbnail = highest unlocked tier.
 */
export function AchievementsFamilyList({
  isDark = false,
  showProgressStatus = true,
}: AchievementsFamilyListProps) {
  const unlockedBadgeIds = useAchievementsStore((s) => s.unlockedBadgeIds);

  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      {ACHIEVEMENT_FAMILIES.map((family, index) => {
        const highest = getHighestUnlockedBadge(family, unlockedBadgeIds);
        const progress = familyProgressLabel(family, unlockedBadgeIds);
        return (
          <View key={family.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push(`/achievements/${family.id}`);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${family.title}. ${progress}. ${family.summary}`}
            >
              <View style={styles.row}>
                <BadgeThumbnail tier={highest?.tier ?? null} />
                <View style={styles.content}>
                  <Text
                    style={[
                      styles.title,
                      !highest && styles.titleLocked,
                      isDark && highest && styles.titleDark,
                    ]}
                    numberOfLines={1}
                  >
                    {family.title}
                  </Text>
                  {showProgressStatus ? (
                    <Text
                      style={[
                        styles.tierStatus,
                        {
                          color: highest
                            ? TIER_COLORS[highest.tier].solid
                            : COLORS.text.muted,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {progress}
                    </Text>
                  ) : null}
                  <Text style={[styles.summary, isDark && styles.summaryDark]} numberOfLines={2}>
                    {family.summary}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </Card>
  );
}

type BadgeTierListProps = {
  family: AchievementFamily;
  isDark?: boolean;
};

/** All tiers for one family — used on the family detail screen. */
export function BadgeTierList({ family, isDark = false }: BadgeTierListProps) {
  const unlockedBadgeIds = useAchievementsStore((s) => s.unlockedBadgeIds);

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {family.tiers.map((badge, index) => (
        <TierRow
          key={badge.id}
          badge={badge}
          unlocked={unlockedBadgeIds.includes(badge.id)}
          isDark={isDark}
          showDivider={index > 0}
        />
      ))}
    </Card>
  );
}

function TierRow({
  badge,
  unlocked,
  isDark,
  showDivider,
}: {
  badge: BadgeDefinition;
  unlocked: boolean;
  isDark: boolean;
  showDivider: boolean;
}) {
  const tierColor = TIER_COLORS[badge.tier];
  return (
    <View>
      {showDivider ? <View style={styles.tierDivider} /> : null}
      <View
        style={styles.tierRow}
        accessibilityRole="text"
        accessibilityLabel={`${badge.title}, ${badge.tier}${unlocked ? ', unlocked' : ', locked'}. ${badge.description}`}
      >
        <BadgeThumbnail tier={unlocked ? badge.tier : null} />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              !unlocked && styles.titleLocked,
              isDark && unlocked && styles.titleDark,
            ]}
            numberOfLines={1}
          >
            {tierTitle(badge)}
          </Text>
          <Text
            style={[
              styles.tierStatus,
              { color: unlocked ? tierColor.solid : COLORS.text.muted },
            ]}
            numberOfLines={1}
          >
            {formatBadgeTierStatus(badge.tier, unlocked)}
          </Text>
          <Text style={[styles.summary, isDark && styles.summaryDark]}>{badge.description}</Text>
        </View>
      </View>
    </View>
  );
}

function tierTitle(badge: BadgeDefinition): string {
  // e.g. "Bronze" as the row title under a Time Away detail page
  switch (badge.tier) {
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
  }
}

const styles = StyleSheet.create({
  card: {
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface.border,
    marginLeft: Spacing.md + 48 + Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tierDivider: {
    height: 1,
    backgroundColor: COLORS.surface.border,
    marginVertical: Spacing.lg,
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: 17,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  titleLocked: {
    color: COLORS.text.secondary,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  tierStatus: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summary: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  summaryDark: {
    color: '#F3F3F3',
  },
});
