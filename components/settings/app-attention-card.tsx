import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Radius, Spacing, TouchTargets } from '@/constants/theme';
import NotificationApiManager from '@/modules/notification-api-manager';
import UsageStatsManager, { AppUsageSummary, UsageWindow } from '@/modules/usage-stats-manager';
import { haptics } from '@/services/haptics';

type LoggedNotification = {
  timestamp?: number;
  packageName?: string;
  appName?: string;
};

type AppAttentionRow = AppUsageSummary & { notificationCount: number };
type AppAttentionMetric = 'screenTime' | 'notifications';

function getWindowMs(window: UsageWindow): number {
  switch (window) {
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function countLoggedNotificationsByPackage(
  logs: LoggedNotification[],
  windowMs: number,
): Map<string, number> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const counts = new Map<string, number>();
  for (const n of logs) {
    const ts = typeof n.timestamp === 'number' ? n.timestamp : 0;
    if (ts < cutoff || ts > now) continue;
    const pkg = n.packageName;
    if (!pkg) continue;
    counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
  }
  return counts;
}

interface AppAttentionCardProps {
  /** Number of apps to show before the "View More" button. Default: 5 */
  limit?: number;
  /** Whether to show the "View More" button. Default: true */
  showViewMore?: boolean;
  /** Callback when View More is pressed. If not provided, navigates to /(settings)/app-attention */
  onViewMore?: () => void;
  /** Card style overrides */
  style?: any;
}

export function AppAttentionCard({
  limit = 5,
  showViewMore = true,
  onViewMore,
  style,
}: AppAttentionCardProps) {
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [usageWindow, setUsageWindow] = useState<UsageWindow>('24h');
  const [selectedMetric, setSelectedMetric] = useState<AppAttentionMetric>('screenTime');
  const [topApps, setTopApps] = useState<AppAttentionRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const loadUsageData = useCallback(
    async (window: UsageWindow) => {
      if (Platform.OS !== 'android') return;

      const usageGranted = UsageStatsManager.hasUsageStatsPermission();
      setHasUsagePermission(usageGranted);

      if (!usageGranted) {
        setTopApps([]);
        return;
      }

      try {
        setUsageLoading(true);
        const usage = await UsageStatsManager.getTopUsageApps(window, limit);
        const windowMs = getWindowMs(window);
        let logs: LoggedNotification[] = [];
        try {
          logs = (await NotificationApiManager.getLoggedNotifications()) as LoggedNotification[];
        } catch {
          logs = [];
        }
        const notifCounts = countLoggedNotificationsByPackage(logs, windowMs);
        const usageByPackage = new Map(usage.map((app) => [app.packageName, app] as const));
        const notificationOnlyApps = Array.from(notifCounts.entries())
          .filter(([packageName, count]) => count > 0 && !usageByPackage.has(packageName))
          .map(([packageName, notificationCount]) => {
            const matchingLog = logs.find((log) => log.packageName === packageName && log.appName);
            return {
              packageName,
              appName: matchingLog?.appName?.trim() || packageName,
              totalTimeMs: 0,
              notificationCount,
            };
          });
        const merged: AppAttentionRow[] = [
          ...usage.map((app) => ({
            ...app,
            notificationCount: notifCounts.get(app.packageName) ?? 0,
          })),
          ...notificationOnlyApps,
        ];
        setTopApps(merged);
      } catch (error) {
        console.error('Failed to load app usage data', error);
        Alert.alert('Error', 'Failed to load app attention data.');
      } finally {
        setUsageLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      loadUsageData(usageWindow);
    }
  }, [loadUsageData, usageWindow]);

  const handleRequestUsagePermission = useCallback(async () => {
    await UsageStatsManager.openUsageStatsSettings();
    Alert.alert(
      'Grant Usage Access',
      `To enable App Attention data:\n\n1) Open "Usage access" or "Special app access"\n2) Select "Landline"\n3) Turn on "Permit usage access"\n\nCommon Android paths:\n• Settings -> Apps -> Special app access -> Usage access\n• Settings -> Security & privacy -> Privacy -> Usage access\n\nAfter enabling, return here and tap Refresh.`,
    );
  }, []);

  const handleChangeUsageWindow = useCallback(
    async (window: UsageWindow) => {
      setUsageWindow(window);
      await loadUsageData(window);
    },
    [loadUsageData],
  );

  const handleRefreshUsageData = useCallback(async () => {
    await loadUsageData(usageWindow);
  }, [loadUsageData, usageWindow]);

  const handleViewMore = useCallback(() => {
    if (onViewMore) {
      onViewMore();
    } else {
      router.push('/(settings)/app-attention');
    }
  }, [onViewMore]);

  const formatDuration = useCallback((durationMs: number) => {
    const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }, []);

  // Compute the max duration for the progress bar baseline
  const maxDurationMs = useMemo(
    () => (topApps.length > 0 ? Math.max(...topApps.map((a) => a.totalTimeMs)) : 1),
    [topApps],
  );
  const maxNotificationCount = useMemo(
    () => (topApps.length > 0 ? Math.max(...topApps.map((a) => a.notificationCount)) : 1),
    [topApps],
  );
  const displayedApps = useMemo(() => {
    const apps = [...topApps];
    if (selectedMetric === 'notifications') {
      return apps.sort((a, b) => {
        if (b.notificationCount !== a.notificationCount) {
          return b.notificationCount - a.notificationCount;
        }
        return b.totalTimeMs - a.totalTimeMs;
      });
    }
    return apps.sort((a, b) => {
      if (b.totalTimeMs !== a.totalTimeMs) {
        return b.totalTimeMs - a.totalTimeMs;
      }
      return b.notificationCount - a.notificationCount;
    });
  }, [selectedMetric, topApps]);

  const windows: UsageWindow[] = ['24h', '7d', '30d'];
  const metrics: Array<{ key: AppAttentionMetric; label: string }> = [
    { key: 'screenTime', label: 'Screen time' },
    { key: 'notifications', label: 'Notifications' },
  ];

  // Generate a consistent color for an app based on its name
  const getAppIconColor = useCallback((appName: string) => {
    const colors = [
      '#5D7052', // primary
      '#C18C5D', // secondary
      '#2563eb', // blue
      '#ea580c', // orange
      '#9333ea', // purple
      '#dc2626', // red
      '#0891b2', // cyan
      '#059669', // emerald
    ];
    let hash = 0;
    for (let i = 0; i < appName.length; i++) {
      hash = appName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  return (
    <Card variant="outlined" shadow="sm" padding="lg" borderRadius="xl" style={style}>
      {/* Section header row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>App Attention</Text>
        <View style={styles.usageStatusChip}>
          <StatusIndicator
            active={hasUsagePermission}
            size="sm"
            showGlow={false}
            color={hasUsagePermission ? COLORS.success : COLORS.error}
          />
          <Text style={styles.usageStatusText}>
            {hasUsagePermission ? 'Usage granted' : 'No usage access'}
          </Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        Top apps by screen time for the selected period. Notification counts reflect what Landline
        captured while active.
      </Text>

      {/* No usage permission — M3 Outlined CTA */}
      {!hasUsagePermission && (
        <View style={styles.usagePermissionBanner}>
          <View style={styles.usagePermissionBannerInner}>
            <MaterialIcons name="bar-chart" size={18} color={COLORS.secondary} />
            <Text style={styles.usagePermissionBannerText}>
              Enable Usage Access to see screen time data.
            </Text>
          </View>
          <View style={styles.usagePermissionButtonWrapper}>
            <Button
              label="Grant Usage Access"
              onPress={handleRequestUsagePermission}
              variant="ghost"
              size="md"
              fullWidth
            />
          </View>
          <View style={styles.usageHelpBox}>
            <Text style={styles.usageHelpTitle}>How to enable</Text>
            <Text style={styles.usageHelpText}>
              1{')'} Settings {'→'} Apps {'→'} Special app access {'→'} Usage access{'\n'}2{')'} Tap
              Landline {'→'} Permit usage access
            </Text>
          </View>
        </View>
      )}

      {/* Usage data controls + list */}
      {hasUsagePermission && (
        <>
          {/* M3 Toggle button group + Standard icon button */}
          <View style={styles.controlsRow}>
            <View style={styles.segmentGroup}>
              {windows.map((w) => {
                const active = usageWindow === w;
                return (
                  <Pressable
                    key={w}
                    style={[styles.segmentChip, active && styles.segmentChipActive]}
                    onPress={() => {
                      haptics.light();
                      handleChangeUsageWindow(w);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${w} data`}
                  >
                    <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                      {w}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* M3 Standard icon button — lowest emphasis, supplementary action */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleRefreshUsageData}
              accessibilityRole="button"
              accessibilityLabel="Refresh usage data"
            >
              <MaterialIcons name="refresh" size={22} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricGroup}>
              {metrics.map((metric) => {
                const active = selectedMetric === metric.key;
                return (
                  <Pressable
                    key={metric.key}
                    style={[styles.segmentChip, active && styles.segmentChipActive]}
                    onPress={() => {
                      haptics.light();
                      setSelectedMetric(metric.key);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show apps by ${metric.label.toLowerCase()}`}
                  >
                    <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                      {metric.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {usageLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingLabel}>Loading data…</Text>
            </View>
          ) : displayedApps.length === 0 ? (
            <Text style={styles.emptyText}>
              No usage data found for this range yet. Keep using your apps and tap refresh.
            </Text>
          ) : (
            /* M3 two-line list — headline + supporting text, trailing metadata */
            <View style={styles.listContainer}>
              {displayedApps.map((app) => {
                const progressValue =
                  selectedMetric === 'screenTime' ? app.totalTimeMs : app.notificationCount;
                const progressMax =
                  selectedMetric === 'screenTime' ? maxDurationMs : maxNotificationCount;
                const barWidth =
                  `${Math.round((progressValue / Math.max(progressMax, 1)) * 100)}%` as `${number}%`;
                const iconColor = getAppIconColor(app.appName);
                return (
                  <View key={app.packageName} style={styles.listItem}>
                    {/* Leading element — app icon circle */}
                    {app.iconUri ? (
                      <Image
                        source={{ uri: app.iconUri }}
                        style={styles.appIconImage}
                        accessibilityLabel={`${app.appName} icon`}
                      />
                    ) : (
                      <View style={[styles.appIconCircle, { backgroundColor: `${iconColor}20` }]}>
                        <Text style={[styles.appIconText, { color: iconColor }]}>
                          {app.appName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Headline + supporting text + progress bar */}
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemHeadline} numberOfLines={1}>
                        {app.appName}
                      </Text>
                      <Text style={styles.listItemSupporting} numberOfLines={1}>
                        {app.packageName}
                      </Text>
                      {/* Thin progress bar (relative to max) */}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: barWidth }]} />
                      </View>
                    </View>

                    {/* Trailing — primary metric + secondary detail */}
                    <View style={styles.listItemTrailing}>
                      <Text style={styles.trailingDuration}>
                        {selectedMetric === 'screenTime'
                          ? formatDuration(app.totalTimeMs)
                          : `${app.notificationCount} ${
                              app.notificationCount === 1 ? 'notif' : 'notifs'
                            }`}
                      </Text>
                      {selectedMetric === 'screenTime' ? (
                        app.notificationCount > 0 && (
                          <View style={styles.notifChip}>
                            <Text style={styles.notifChipText}>
                              {app.notificationCount}{' '}
                              {app.notificationCount === 1 ? 'notif' : 'notifs'}
                            </Text>
                          </View>
                        )
                      ) : (
                        <View style={styles.notifChip}>
                          <Text style={styles.notifChipText}>
                            {app.totalTimeMs > 0
                              ? formatDuration(app.totalTimeMs)
                              : 'No screen time'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* View More button */}
              {showViewMore && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={handleViewMore}
                  accessibilityRole="button"
                  accessibilityLabel="View all apps"
                >
                  <Text style={styles.viewMoreText}>View all apps</Text>
                  <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  // ── Section header ────────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
  },
  usageStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  usageStatusText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: COLORS.text.muted,
  },

  // ── Shared body text ──────────────────────────────────────────────────────
  bodyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
  },

  // ── Usage permission banner ───────────────────────────────────────────────
  usagePermissionBanner: {
    marginTop: Spacing.md,
  },
  usagePermissionBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${COLORS.secondary}14`,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  usagePermissionBannerText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  usagePermissionButtonWrapper: {
    marginBottom: Spacing.md,
  },
  usageHelpBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: COLORS.surface.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  usageHelpTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
    marginBottom: Spacing.xs,
  },
  usageHelpText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },

  // ── Time-window segmented control (M3 toggle chips) ───────────────────────
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  metricRow: {
    marginBottom: Spacing.md,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flex: 1,
  },
  metricGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  segmentChip: {
    paddingHorizontal: Spacing.md,
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
  segmentChipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  segmentChipTextActive: {
    color: COLORS.text.onPrimary,
  },
  // M3 Standard icon button — 48dp touch target, no container
  iconButton: {
    width: TouchTargets.md,
    height: TouchTargets.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Loading state ─────────────────────────────────────────────────────────
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // ── M3 Two-line list ──────────────────────────────────────────────────────
  listContainer: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72, // M3 two-line list item minimum
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  // Leading element — app icon circle
  appIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appIconImage: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    flexShrink: 0,
  },
  appIconText: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 16,
  },
  // M3 list item content — headline + supporting text
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
  listItemSupporting: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text.muted,
  },
  // Relative progress bar
  progressTrack: {
    marginTop: 5,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: COLORS.accent,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: COLORS.primary,
  },
  // M3 trailing supporting text
  listItemTrailing: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    flexShrink: 0,
    maxWidth: '38%',
  },
  trailingDuration: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.primary,
  },
  // Notification count chip (clay/terracotta pill)
  notifChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: `${COLORS.secondary}20`,
  },
  notifChipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: COLORS.secondary,
  },

  // ── View More button ──────────────────────────────────────────────────────
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewMoreText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
});
