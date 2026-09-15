import React, { useMemo } from 'react';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { BadgeThumbnail } from '@/components/achievements/badge-thumbnail';
import { BadgeTierList } from '@/components/achievements/achievements-shelf';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import {
  DAILY_STREAK_FAMILY_ID,
  NOTIFICATIONS_BLOCKED_FAMILY_ID,
  familyProgressLabel,
  formatBlockedCount,
  getAchievementFamily,
  getEffectiveCurrentStreak,
  getHighestUnlockedBadge,
  useAchievementsStore,
} from '@/hooks/use-achievements-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';

export default function AchievementFamilyScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { familyId } = useLocalSearchParams<{ familyId: string }>();
  const unlockedBadgeIds = useAchievementsStore((s) => s.unlockedBadgeIds);
  const currentStreak = useAchievementsStore((s) => s.currentStreak);
  const longestStreak = useAchievementsStore((s) => s.longestStreak);
  const lastActiveDay = useAchievementsStore((s) => s.lastActiveDay);
  const totalNotificationsBlocked = useAchievementsStore((s) => s.totalNotificationsBlocked);

  const family = useMemo(() => getAchievementFamily(familyId), [familyId]);
  const highest = family ? getHighestUnlockedBadge(family, unlockedBadgeIds) : null;
  const progress = family ? familyProgressLabel(family, unlockedBadgeIds) : '';
  const liveStreak = getEffectiveCurrentStreak(currentStreak, lastActiveDay);
  const isStreakFamily = family?.id === DAILY_STREAK_FAMILY_ID;
  const isBlockedFamily = family?.id === NOTIFICATIONS_BLOCKED_FAMILY_ID;

  if (!family) {
    return (
      <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top },
            isDark && { backgroundColor: D_BG, borderBottomColor: D_BORDER },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? '#FFFFFF' : COLORS.foreground}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>Not found</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.missingBody}>
          <Text style={[styles.missingText, isDark && { color: '#F3F3F3' }]}>
            This achievement could not be found.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top },
          isDark && { backgroundColor: D_BG, borderBottomColor: D_BORDER },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : COLORS.foreground}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>{family.title}</Text>
          <Text style={[styles.headerSubtitle, isDark && { color: '#E0E0E0' }]}>{progress}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <BadgeThumbnail tier={highest?.tier ?? null} size={72} />
          <Text style={[styles.heroTitle, isDark && { color: '#FFFFFF' }]}>{family.title}</Text>
          <Text style={[styles.heroSummary, isDark && { color: '#F3F3F3' }]}>{family.summary}</Text>
          {isStreakFamily ? (
            <Text style={[styles.streakMeta, isDark && { color: '#E0E0E0' }]}>
              Current streak: {liveStreak} day{liveStreak === 1 ? '' : 's'}
              {longestStreak > 0 ? ` · Best: ${longestStreak}` : ''}
            </Text>
          ) : null}
          {isBlockedFamily ? (
            <Text style={[styles.streakMeta, isDark && { color: '#E0E0E0' }]}>
              Blocked so far: {formatBlockedCount(totalNotificationsBlocked)}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#FFFFFF' }]}>Tiers</Text>
        <BadgeTierList family={family} isDark={isDark} />
        {isStreakFamily ? (
          <Text style={[styles.footnote, isDark && { color: '#E0E0E0' }]}>
            A day counts when you end a Landline Mode session of at least 1 minute.
          </Text>
        ) : null}
        {isBlockedFamily ? (
          <Text style={[styles.footnote, isDark && { color: '#E0E0E0' }]}>
            Counts notifications logged while Landline Mode is on. Totals add up across sessions.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  heroTitle: {
    fontSize: 24,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
    marginTop: Spacing.lg,
  },
  heroSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  streakMeta: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  missingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  missingText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
});
