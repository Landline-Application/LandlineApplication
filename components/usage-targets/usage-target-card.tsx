import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppGlyph } from '@/components/usage-targets/app-glyph';
import { UsageTrendChart } from '@/components/usage-targets/usage-trend-chart';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import {
  type LimitPace,
  type TargetProgress,
  type UsageTarget,
  formatUsageDuration,
  limitPace,
  limitRemainingLabel,
} from '@/utils/usage-targets';

interface UsageTargetCardProps {
  target: UsageTarget;
  progress: TargetProgress | null;
  iconUri?: string;
  /** Shown in place of progress when screen time is unavailable. */
  unavailableNote?: string;
  onPress: () => void;
}

function paceColor(pace: LimitPace): string {
  switch (pace) {
    case 'over':
      return COLORS.destructive;
    case 'close':
      return COLORS.warning;
    case 'under':
      return COLORS.primary;
    case 'unset':
      return COLORS.text.muted;
  }
}

function LimitMeter({
  label,
  usedMs,
  limitMs,
  trackColor,
  labelColor,
}: {
  label: string;
  usedMs: number;
  limitMs: number;
  trackColor: string;
  labelColor: string;
}) {
  const pace = limitPace(usedMs, limitMs);
  const color = paceColor(pace);
  const ratio = Math.min(1, usedMs / limitMs);

  return (
    <View style={styles.meter}>
      <View style={styles.meterHeader}>
        <Text style={[styles.meterLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.meterValue, { color }]}>
          {formatUsageDuration(usedMs)} of {formatUsageDuration(limitMs)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.meterHint, { color }]}>{limitRemainingLabel(usedMs, limitMs)}</Text>
    </View>
  );
}

export function UsageTargetCard({
  target,
  progress,
  iconUri,
  unavailableNote = 'Grant usage access to see how close you are and the trend over time.',
  onPress,
}: UsageTargetCardProps) {
  const { isDark } = useAppTheme();
  const titleColor = isDark ? '#FFFFFF' : COLORS.foreground;
  const mutedColor = isDark ? '#E0E0E0' : COLORS.text.muted;
  const labelColor = isDark ? '#F3F3F3' : COLORS.text.secondary;
  const trackColor = isDark ? '#3a3a3a' : COLORS.accent;

  const summary = progress
    ? [
        target.dailyLimitMs != null
          ? `Today ${formatUsageDuration(progress.todayMs)} of ${formatUsageDuration(target.dailyLimitMs)}`
          : null,
        target.weeklyLimitMs != null
          ? `This week ${formatUsageDuration(progress.weekMs)} of ${formatUsageDuration(target.weeklyLimitMs)}`
          : null,
      ]
        .filter(Boolean)
        .join('. ')
    : unavailableNote;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${target.appName}. ${summary} Edit target.`}
    >
      <Card variant="elevated" shadow="sm" padding="lg" borderRadius="xl" style={styles.card}>
        <View style={styles.header}>
          <AppGlyph name={target.appName} iconUri={iconUri} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
              {target.appName}
            </Text>
            <Text style={[styles.subtitle, { color: mutedColor }]} numberOfLines={1}>
              {target.dailyLimitMs != null && target.weeklyLimitMs != null
                ? 'Daily and weekly cap'
                : target.dailyLimitMs != null
                  ? 'Daily cap'
                  : 'Weekly cap'}
            </Text>
          </View>
          <MaterialIcons name="edit" size={20} color={COLORS.primary} />
        </View>

        {progress ? (
          <>
            {target.dailyLimitMs != null ? (
              <LimitMeter
                label="Today"
                usedMs={progress.todayMs}
                limitMs={target.dailyLimitMs}
                trackColor={trackColor}
                labelColor={labelColor}
              />
            ) : null}
            {target.weeklyLimitMs != null ? (
              <LimitMeter
                label="This week"
                usedMs={progress.weekMs}
                limitMs={target.weeklyLimitMs}
                trackColor={trackColor}
                labelColor={labelColor}
              />
            ) : null}
            <View style={styles.chart}>
              <UsageTrendChart
                appName={target.appName}
                days={progress.days}
                weeks={progress.weeks}
                dailyLimitMs={target.dailyLimitMs}
                weeklyLimitMs={target.weeklyLimitMs}
              />
            </View>
          </>
        ) : (
          <Text style={[styles.unavailable, { color: mutedColor }]}>{unavailableNote}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  meter: {
    marginTop: Spacing.lg,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  meterLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  meterValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: Radius.full,
  },
  meterHint: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  chart: {
    marginTop: Spacing.xl,
  },
  unavailable: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.lg,
  },
});
