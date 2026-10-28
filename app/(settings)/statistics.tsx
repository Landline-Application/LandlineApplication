import React, { useEffect, useMemo, useState } from 'react';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { StatisticsActivity } from '@/components/statistics/statistics-activity';
import {
  StatisticsOverview,
  type StatisticsOverviewRow,
} from '@/components/statistics/statistics-overview';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { getEffectiveCurrentStreak, useAchievementsStore } from '@/hooks/use-achievements-store';
import {
  type StatsWindow,
  formatCount,
  formatLandlineDuration,
  pluralLabel,
  statsWindowPhrase,
  summarizeStatsWindow,
  useLandlineStatsStore,
} from '@/hooks/use-landline-stats-store';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';

type StatisticsLayout = 'overview' | 'usage';

/**
 * Two layouts for the same Landline Mode stats so we can pick one:
 * overview matches Achievements, usage matches App Attention.
 */
export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [layout, setLayout] = useState<StatisticsLayout>('overview');
  const [window, setWindow] = useState<StatsWindow>('7d');
  const [now, setNow] = useState(() => Date.now());

  const totalDurationMs = useLandlineStatsStore((s) => s.totalDurationMs);
  const sessionCount = useLandlineStatsStore((s) => s.sessionCount);
  const sessions = useLandlineStatsStore((s) => s.sessions);
  const totalNotificationsBlocked = useAchievementsStore((s) => s.totalNotificationsBlocked);
  const currentStreak = useAchievementsStore((s) => s.currentStreak);
  const longestStreak = useAchievementsStore((s) => s.longestStreak);
  const lastActiveDay = useAchievementsStore((s) => s.lastActiveDay);
  const isActive = useLandlineStore((s) => s.isActive);
  const sessionStartTime = useLandlineStore((s) => s.sessionStartTime);
  const notifications = useLandlineStore((s) => s.notifications);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), isActive ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [isActive]);

  const activeSession = useMemo(() => {
    if (!isActive || !sessionStartTime) return null;
    const startedAt = sessionStartTime.getTime();
    return {
      startedAt,
      notificationsBlocked: notifications.filter((entry) => entry.postTime >= startedAt).length,
    };
  }, [isActive, notifications, sessionStartTime]);

  const allTime = useMemo(
    () =>
      summarizeStatsWindow({
        window: 'all',
        totalDurationMs,
        sessionCount,
        sessions,
        lifetimeNotificationsBlocked: totalNotificationsBlocked,
        active: activeSession,
        now,
      }),
    [activeSession, now, sessionCount, sessions, totalDurationMs, totalNotificationsBlocked],
  );

  const windowSummary = useMemo(
    () =>
      summarizeStatsWindow({
        window,
        totalDurationMs,
        sessionCount,
        sessions,
        lifetimeNotificationsBlocked: totalNotificationsBlocked,
        active: activeSession,
        now,
      }),
    [
      activeSession,
      now,
      sessionCount,
      sessions,
      totalDurationMs,
      totalNotificationsBlocked,
      window,
    ],
  );

  const liveStreak = getEffectiveCurrentStreak(currentStreak, lastActiveDay);
  const logCount = notifications.length;

  const overviewRows: StatisticsOverviewRow[] = [
    {
      id: 'time',
      icon: 'schedule',
      title: 'Time in Landline Mode',
      value: formatLandlineDuration(allTime.durationMs),
      summary:
        sessionCount === 0 && !activeSession
          ? 'Starts counting the next time you finish a Landline Mode session.'
          : 'Total time Landline Mode has been on, including a session in progress.',
    },
    {
      id: 'sessions',
      icon: 'repeat',
      title: 'Sessions',
      value: formatCount(allTime.sessionCount),
      summary:
        sessionCount === 0 && !activeSession
          ? 'Each time you turn Landline Mode on counts as one session.'
          : 'How many times you have started Landline Mode.',
    },
    {
      id: 'log',
      icon: 'inbox',
      title: 'Held in the log',
      value: formatCount(logCount),
      summary: 'Notifications waiting in your log right now.',
    },
    {
      id: 'quieted',
      icon: 'notifications-off',
      title: 'Notifications quieted',
      value: formatCount(allTime.notificationsBlocked),
      summary: 'Notifications logged while Landline Mode was on.',
    },
    {
      id: 'streak',
      icon: 'local-fire-department',
      title: 'Current streak',
      value: pluralLabel(liveStreak, 'day'),
      summary: 'Days in a row with a Landline Mode session.',
    },
    {
      id: 'longest',
      icon: 'emoji-events',
      title: 'Longest streak',
      value: pluralLabel(longestStreak, 'day'),
      summary: 'Your best run of consecutive days.',
    },
  ];

  const headerSubtitle =
    layout === 'overview'
      ? `${formatLandlineDuration(allTime.durationMs)} in Landline Mode`
      : statsWindowPhrase(window);

  const intro =
    layout === 'overview'
      ? 'Laid out like Achievements — a shelf of the stats Landline keeps about your time in Landline Mode.'
      : 'Laid out like App Attention — pick a time range and compare sessions in that window.';

  function selectLayout(next: StatisticsLayout) {
    if (next === layout) return;
    haptics.light();
    setLayout(next);
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
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>Statistics</Text>
          <Text style={[styles.headerSubtitle, isDark && { color: '#E0E0E0' }]}>
            {headerSubtitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabBarWrap, isDark && { borderBottomColor: D_BORDER }]}>
        <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
          <TouchableOpacity
            style={[
              styles.tab,
              layout === 'overview' && styles.tabActive,
              isDark && layout === 'overview' && styles.tabActiveDark,
            ]}
            onPress={() => selectLayout('overview')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: layout === 'overview' }}
            accessibilityLabel="Overview, achievements layout"
          >
            <Text
              style={[
                styles.tabLabel,
                layout === 'overview' && styles.tabLabelActive,
                isDark && layout !== 'overview' && { color: '#E0E0E0' },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              layout === 'usage' && styles.tabActive,
              isDark && layout === 'usage' && styles.tabActiveDark,
            ]}
            onPress={() => selectLayout('usage')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: layout === 'usage' }}
            accessibilityLabel="Usage, app attention layout"
          >
            <Text
              style={[
                styles.tabLabel,
                layout === 'usage' && styles.tabLabelActive,
                isDark && layout !== 'usage' && { color: '#E0E0E0' },
              ]}
            >
              Usage
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.intro, isDark && { color: '#F3F3F3' }]}>{intro}</Text>
        {layout === 'overview' ? (
          <StatisticsOverview isDark={isDark} rows={overviewRows} />
        ) : (
          <StatisticsActivity
            isDark={isDark}
            window={window}
            onChangeWindow={setWindow}
            summary={windowSummary}
            logCount={logCount}
          />
        )}
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
  tabBarWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
    borderRadius: Radius.md,
    padding: 4,
  },
  tabBarDark: {
    backgroundColor: '#4a4a4a',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: COLORS.background,
  },
  tabActiveDark: {
    backgroundColor: '#5f5f5f',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.text.secondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginBottom: Spacing.xl,
  },
});
