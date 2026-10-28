import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { COLORS, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import {
  type DayUsage,
  type WeekUsage,
  formatDateKey,
  formatUsageDuration,
} from '@/utils/usage-targets';

const PLOT_HEIGHT = 72;

interface UsageTrendChartProps {
  appName: string;
  days: readonly DayUsage[];
  weeks: readonly WeekUsage[];
  dailyLimitMs: number | null;
  weeklyLimitMs: number | null;
}

function barColor(usedMs: number, limitMs: number | null, isDark: boolean): string {
  if (limitMs != null && usedMs > limitMs) return COLORS.destructive;
  if (usedMs <= 0) return isDark ? '#3a3a3a' : COLORS.accent;
  return COLORS.primary;
}

export function UsageTrendChart({
  appName,
  days,
  weeks,
  dailyLimitMs,
  weeklyLimitMs,
}: UsageTrendChartProps) {
  const { isDark } = useAppTheme();
  const textMuted = isDark ? '#E0E0E0' : COLORS.text.muted;
  const textSecondary = isDark ? '#F3F3F3' : COLORS.text.secondary;
  const axisColor = isDark ? '#3a3a3a' : COLORS.border;

  const dailyScale = useMemo(() => {
    const peak = days.reduce((max, day) => Math.max(max, day.totalTimeMs), 0);
    return Math.max(peak, dailyLimitMs ?? 0, 1);
  }, [dailyLimitMs, days]);

  const weeklyScale = useMemo(() => {
    const peak = weeks.reduce((max, week) => Math.max(max, week.totalTimeMs), 0);
    return Math.max(peak, weeklyLimitMs ?? 0, 1);
  }, [weeklyLimitMs, weeks]);

  const rangeLabel =
    days.length > 0
      ? `${formatDateKey(days[0]?.date ?? '')} – ${formatDateKey(days[days.length - 1]?.date ?? '')}`
      : 'Last 14 days';

  const today = days.find((day) => day.isToday);
  const chartLabel = `${appName} screen time, ${rangeLabel}. Today ${formatUsageDuration(today?.totalTimeMs ?? 0)}.`;

  const limitBottom =
    dailyLimitMs != null && dailyLimitMs > 0
      ? Math.min(PLOT_HEIGHT - 1, (dailyLimitMs / dailyScale) * PLOT_HEIGHT)
      : null;

  return (
    <View accessible accessibilityLabel={chartLabel}>
      <View style={styles.captionRow}>
        <Text style={[styles.caption, { color: textMuted }]}>Last 14 days</Text>
        <Text style={[styles.caption, { color: textMuted }]}>{rangeLabel}</Text>
      </View>
      <View style={[styles.plot, { borderBottomColor: axisColor }]}>
        {limitBottom != null ? (
          <View
            pointerEvents="none"
            style={[styles.limitLine, { bottom: limitBottom, backgroundColor: COLORS.secondary }]}
          />
        ) : null}
        {days.map((day) => {
          const height = Math.round((day.totalTimeMs / dailyScale) * PLOT_HEIGHT);
          return (
            <View key={day.date} style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(day.totalTimeMs > 0 ? 2 : 0, height),
                    backgroundColor: barColor(day.totalTimeMs, dailyLimitMs, isDark),
                    opacity: day.isToday ? 1 : 0.85,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelRow}>
        {days.map((day) => (
          <Text
            key={day.date}
            style={[
              styles.dayLabel,
              { color: day.isToday ? COLORS.primary : textMuted },
            ]}
            numberOfLines={1}
          >
            {day.label}
          </Text>
        ))}
      </View>
      {dailyLimitMs != null ? (
        <Text style={[styles.note, { color: textSecondary }]}>
          Line is the daily cap ({formatUsageDuration(dailyLimitMs)}).
        </Text>
      ) : null}

      {weeklyLimitMs != null ? (
        <View style={styles.weekBlock}>
          <Text style={[styles.caption, { color: textMuted }]}>Weekly totals</Text>
          <View style={[styles.weekPlot, { borderBottomColor: axisColor }]}>
            {weeks.map((week) => {
              const height = Math.round((week.totalTimeMs / weeklyScale) * PLOT_HEIGHT);
              return (
                <View key={week.startDate} style={styles.weekSlot}>
                  <View
                    style={[
                      styles.weekBar,
                      {
                        height: Math.max(week.totalTimeMs > 0 ? 2 : 0, height),
                        backgroundColor: barColor(week.totalTimeMs, weeklyLimitMs, isDark),
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.weekLabels}>
            {weeks.map((week) => (
              <Text
                key={week.startDate}
                style={[styles.weekLabel, { color: week.isCurrent ? COLORS.primary : textMuted }]}
                numberOfLines={1}
              >
                {week.label}
              </Text>
            ))}
          </View>
          <Text style={[styles.note, { color: textSecondary }]}>
            Monday–Sunday. This week’s cap is {formatUsageDuration(weeklyLimitMs)}.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  caption: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    zIndex: 2,
  },
  barSlot: {
    flex: 1,
    height: PLOT_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minWidth: 3,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 9,
  },
  note: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: Spacing.sm,
  },
  weekBlock: {
    marginTop: Spacing.lg,
  },
  weekPlot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
  },
  weekSlot: {
    flex: 1,
    height: PLOT_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weekBar: {
    width: '55%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minWidth: 8,
  },
  weekLabels: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
  },
});
