import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { type MaterialIconName, MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Shadows, Spacing } from '@/constants/theme';

export interface StatisticsOverviewRow {
  id: string;
  icon: MaterialIconName;
  title: string;
  value: string;
  summary: string;
}

type StatisticsOverviewProps = {
  isDark?: boolean;
  rows: readonly StatisticsOverviewRow[];
};

/**
 * Achievements-style shelf: one row per stat, icon, value, and short description.
 */
export function StatisticsOverview({ isDark = false, rows }: StatisticsOverviewProps) {
  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      {rows.map((row, index) => (
        <View key={row.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View
            style={styles.row}
            accessibilityRole="text"
            accessibilityLabel={`${row.title}. ${row.value}. ${row.summary}`}
          >
            <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
              <MaterialIcons name={row.icon} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={1}>
                {row.title}
              </Text>
              <Text style={styles.value} numberOfLines={1}>
                {row.value}
              </Text>
              <Text style={[styles.summary, isDark && styles.summaryDark]}>{row.summary}</Text>
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(93, 112, 82, 0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(93, 112, 82, 0.28)',
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
  titleDark: {
    color: '#FFFFFF',
  },
  value: {
    fontSize: 20,
    color: COLORS.primary,
    fontFamily: 'Fraunces_700Bold',
    marginTop: 2,
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
