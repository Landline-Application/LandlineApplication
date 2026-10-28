import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import {
  STATS_WINDOWS,
  type SessionListItem,
  type StatsWindow,
  type WindowSummary,
  formatCount,
  formatLandlineDuration,
  pluralLabel,
} from '@/hooks/use-landline-stats-store';
import { haptics } from '@/services/haptics';

type StatisticsActivityProps = {
  isDark?: boolean;
  window: StatsWindow;
  onChangeWindow: (window: StatsWindow) => void;
  summary: WindowSummary;
  logCount: number;
};

/**
 * App Attention-style view: time-range chips, a short summary, and a ranked session list.
 */
export function StatisticsActivity({
  isDark = false,
  window,
  onChangeWindow,
  summary,
  logCount,
}: StatisticsActivityProps) {
  const maxDuration = summary.items.reduce((max, item) => Math.max(max, item.durationMs), 1);

  return (
    <View>
      <Card variant="elevated" padding="lg" style={styles.controlsCard}>
        <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>Time range</Text>
        <View style={styles.segmentGroup}>
          {STATS_WINDOWS.map((option) => {
            const active = window === option.key;
            return (
              <Pressable
                key={option.key}
                style={[
                  styles.segmentChip,
                  active && styles.segmentChipActive,
                  isDark && !active && styles.segmentChipDark,
                ]}
                onPress={() => {
                  if (active) return;
                  haptics.light();
                  onChangeWindow(option.key);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Show ${option.label} statistics`}
              >
                <Text
                  style={[
                    styles.segmentChipText,
                    active && styles.segmentChipTextActive,
                    isDark && !active && styles.segmentChipTextDark,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.metricRow}>
          <Metric label="Time" value={formatLandlineDuration(summary.durationMs)} isDark={isDark} />
          <Metric label="Sessions" value={formatCount(summary.sessionCount)} isDark={isDark} />
          <Metric
            label="Quieted"
            value={formatCount(summary.notificationsBlocked)}
            isDark={isDark}
          />
        </View>
        <Text style={[styles.summaryText, isDark && styles.summaryTextDark]}>
          {pluralLabel(logCount, 'notification', 'notifications')} held in the log
        </Text>
      </Card>

      <Card variant="outlined" padding="lg" style={styles.listCard}>
        {summary.items.length === 0 ? (
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            No sessions in this range yet. Time and session counts start the next time you finish a
            Landline Mode session.
          </Text>
        ) : (
          <View style={styles.listContainer}>
            {summary.items.map((item) => (
              <SessionRow key={item.id} item={item} maxDuration={maxDuration} isDark={isDark} />
            ))}
            {summary.historyTruncated ? (
              <Text style={[styles.truncatedText, isDark && styles.emptyTextDark]}>
                Showing your most recent sessions. Totals above include every session.
              </Text>
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

function Metric({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <View style={styles.metric} accessibilityRole="text" accessibilityLabel={`${label}. ${value}`}>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, isDark && styles.sectionLabelDark]}>{label}</Text>
    </View>
  );
}

function SessionRow({
  item,
  maxDuration,
  isDark,
}: {
  item: SessionListItem;
  maxDuration: number;
  isDark: boolean;
}) {
  const barWidth =
    `${Math.max(4, Math.round((item.durationMs / Math.max(maxDuration, 1)) * 100))}%` as `${number}%`;

  return (
    <View
      style={[styles.listItem, isDark && styles.listItemDark]}
      accessibilityRole="text"
      accessibilityLabel={`${item.title}. ${formatLandlineDuration(item.durationMs)}. ${item.subtitle}`}
    >
      <View style={[styles.leading, item.inProgress && styles.leadingActive]}>
        <MaterialIcons
          name={item.inProgress ? 'timelapse' : 'schedule'}
          size={20}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemHeadline, isDark && styles.headlineDark]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text
          style={[styles.listItemSupporting, isDark && styles.supportingDark]}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
        <View style={[styles.progressTrack, isDark && styles.progressTrackDark]}>
          <View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
      <Text style={styles.trailingDuration}>{formatLandlineDuration(item.durationMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsCard: {
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
    marginBottom: Spacing.md,
  },
  sectionLabelDark: {
    color: '#E0E0E0',
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  segmentChip: {
    flex: 1,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  segmentChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentChipDark: {
    borderColor: '#3a3a3a',
    backgroundColor: '#4a4a4a',
  },
  segmentChipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  segmentChipTextActive: {
    color: COLORS.text.onPrimary,
  },
  segmentChipTextDark: {
    color: '#E0E0E0',
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  metricValue: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: COLORS.primary,
  },
  metricLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
    marginTop: 2,
  },
  summaryText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  summaryTextDark: {
    color: '#F3F3F3',
  },
  listCard: {
    marginBottom: Spacing.xl,
  },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyTextDark: {
    color: '#E0E0E0',
  },
  listContainer: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}60`,
  },
  listItemDark: {
    borderBottomColor: '#3a3a3a',
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  leadingActive: {
    backgroundColor: 'rgba(93, 112, 82, 0.18)',
  },
  listItemContent: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  listItemHeadline: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  headlineDark: {
    color: '#FFFFFF',
  },
  listItemSupporting: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text.muted,
  },
  supportingDark: {
    color: '#E0E0E0',
  },
  progressTrack: {
    marginTop: 5,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: COLORS.accent,
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#3a3a3a',
  },
  progressFill: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: COLORS.primary,
  },
  trailingDuration: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.primary,
  },
  truncatedText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingTop: Spacing.md,
  },
});
