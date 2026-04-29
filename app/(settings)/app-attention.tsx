import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Radius, Shadows, Spacing, TouchTargets } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import NotificationApiManager from '@/modules/notification-api-manager';
import UsageStatsManager, { AppUsageSummary, UsageWindow } from '@/modules/usage-stats-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function AppAttentionScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [usageWindow, setUsageWindow] = useState<UsageWindow>('24h');
  const [selectedMetric, setSelectedMetric] = useState<AppAttentionMetric>('screenTime');
  const [allApps, setAllApps] = useState<AppAttentionRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const loadUsageData = useCallback(async (window: UsageWindow) => {
    if (Platform.OS !== 'android') return;

    const usageGranted = UsageStatsManager.hasUsageStatsPermission();
    setHasUsagePermission(usageGranted);

    if (!usageGranted) {
      setAllApps([]);
      return;
    }

    try {
      setUsageLoading(true);
      // Get all apps (no limit)
      const usage = await UsageStatsManager.getTopUsageApps(window, 1000);
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
      setAllApps(merged);
    } catch (error) {
      console.error('Failed to load app usage data', error);
      Alert.alert('Error', 'Failed to load app attention data.');
    } finally {
      setUsageLoading(false);
    }
  }, []);

  // Refresh usage data every time this screen is focused (not just on mount)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        loadUsageData(usageWindow);
      }
    }, [loadUsageData, usageWindow]),
  );

  const handleRequestUsagePermission = useCallback(async () => {
    await UsageStatsManager.openUsageStatsSettings();
    Alert.alert(
      'Grant Usage Access',
      `To enable App Attention data:\n\n1) Open "Usage access" or "Special app access"\n2) Select "Landline"\n3) Turn on "Permit usage access"\n\nCommon Android paths:\n• Settings -> Apps -> Special app access -> Usage access\n• Settings -> Security & privacy -> Privacy -> Usage access\n\nAfter enabling, return here.`,
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
    () => (allApps.length > 0 ? Math.max(...allApps.map((a) => a.totalTimeMs)) : 1),
    [allApps],
  );
  const maxNotificationCount = useMemo(
    () => (allApps.length > 0 ? Math.max(...allApps.map((a) => a.notificationCount)) : 1),
    [allApps],
  );
  const displayedApps = useMemo(() => {
    const apps = [...allApps];
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
  }, [allApps, selectedMetric]);

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

  const darkUi = isDark
    ? {
        bg: '#5f5f5f',
        surface: '#4a4a4a',
        surfaceAlt: '#4f4f4f',
        border: '#3a3a3a',
        textPrimary: '#FFFFFF',
        textSecondary: '#F3F3F3',
        textMuted: '#E0E0E0',
      }
    : null;

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, isDark && { backgroundColor: darkUi?.bg }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top },
            isDark && { borderBottomColor: darkUi?.border },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? darkUi?.textPrimary : COLORS.foreground}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && { color: darkUi?.textPrimary }]}>
            App Attention
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="apps" size={48} color={COLORS.text.muted} />
          <Text style={styles.centerTitle}>App Attention</Text>
          <Text style={styles.centerBody}>App Attention is only available on Android devices.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: darkUi?.bg }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top },
          isDark && { borderBottomColor: darkUi?.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={isDark ? darkUi?.textPrimary : COLORS.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: darkUi?.textPrimary }]}>App Attention</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status and Controls Card */}
        <Card variant="elevated" padding="lg" style={styles.controlsCard}>
          {/* Section header row */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, isDark && { color: darkUi?.textMuted }]}>Usage Access</Text>
            <View style={styles.usageStatusChip}>
              <StatusIndicator
                active={hasUsagePermission}
                size="sm"
                showGlow={false}
                color={hasUsagePermission ? COLORS.success : COLORS.error}
              />
              <Text style={[styles.usageStatusText, isDark && { color: darkUi?.textMuted }]}>
                {hasUsagePermission ? 'Granted' : 'Not granted'}
              </Text>
            </View>
          </View>

          {!hasUsagePermission ? (
            <View style={styles.permissionBanner}>
              <View style={styles.permissionBannerInner}>
                <MaterialIcons name="bar-chart" size={18} color={COLORS.secondary} />
                <Text style={[styles.permissionBannerText, isDark && { color: darkUi?.textSecondary }]}>
                  Enable Usage Access to see screen time data for all your apps.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleRequestUsagePermission}
                accessibilityRole="button"
              >
                <Text style={styles.permissionButtonText}>Grant Usage Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Time window selector */}
              <View style={styles.controlsRow}>
                <View style={styles.segmentGroup}>
                  {windows.map((w) => {
                    const active = usageWindow === w;
                    return (
                      <Pressable
                        key={w}
                        style={[
                          styles.segmentChip,
                          active && styles.segmentChipActive,
                          isDark && !active && {
                            borderColor: darkUi?.border,
                            backgroundColor: darkUi?.surfaceAlt,
                          },
                        ]}
                        onPress={() => handleChangeUsageWindow(w)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Show ${w} data`}
                      >
                        <Text
                          style={[
                            styles.segmentChipText,
                            active && styles.segmentChipTextActive,
                            isDark && !active && { color: darkUi?.textSecondary },
                          ]}
                        >
                          {w}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {/* Refresh button */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleRefreshUsageData}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh usage data"
                >
                  <MaterialIcons
                    name="refresh"
                    size={22}
                    color={isDark ? darkUi?.textSecondary : COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricGroup}>
                  {metrics.map((metric) => {
                    const active = selectedMetric === metric.key;
                    return (
                      <Pressable
                        key={metric.key}
                        style={[
                          styles.segmentChip,
                          active && styles.segmentChipActive,
                          isDark && !active && {
                            borderColor: darkUi?.border,
                            backgroundColor: darkUi?.surfaceAlt,
                          },
                        ]}
                        onPress={() => setSelectedMetric(metric.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Show apps by ${metric.label.toLowerCase()}`}
                      >
                        <Text
                          style={[
                            styles.segmentChipText,
                            active && styles.segmentChipTextActive,
                            isDark && !active && { color: darkUi?.textSecondary },
                          ]}
                        >
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
                  <Text style={[styles.loadingLabel, isDark && { color: darkUi?.textSecondary }]}>
                    Loading all apps…
                  </Text>
                </View>
              ) : (
                <Text style={[styles.summaryText, isDark && { color: darkUi?.textSecondary }]}>
                  Showing {displayedApps.length} app{displayedApps.length === 1 ? '' : 's'} by{' '}
                  {selectedMetric === 'screenTime' ? 'screen time' : 'notifications'}
                </Text>
              )}
            </>
          )}
        </Card>

        {/* App List */}
        {hasUsagePermission && !usageLoading && (
          <Card
            variant="outlined"
            padding="lg"
            style={StyleSheet.flatten([
              styles.listCard,
              isDark && { borderColor: darkUi?.border, backgroundColor: darkUi?.surface },
            ])}
          >
            {displayedApps.length === 0 ? (
              <Text style={[styles.emptyText, isDark && { color: darkUi?.textMuted }]}>
                No usage data found for this range yet. Keep using your apps and tap refresh.
              </Text>
            ) : (
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
                    <View
                      key={app.packageName}
                      style={[styles.listItem, isDark && { borderBottomColor: `${darkUi?.border}80` }]}
                    >
                      {/* Leading element — app icon */}
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
                        <Text
                          style={[styles.listItemHeadline, isDark && { color: darkUi?.textPrimary }]}
                          numberOfLines={1}
                        >
                          {app.appName}
                        </Text>
                        <Text
                          style={[styles.listItemSupporting, isDark && { color: darkUi?.textMuted }]}
                          numberOfLines={1}
                        >
                          {app.packageName}
                        </Text>
                        {/* Thin progress bar (relative to max) */}
                        <View
                          style={[styles.progressTrack, isDark && { backgroundColor: darkUi?.border }]}
                        >
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
              </View>
            )}
          </Card>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSpacer: {
    width: 40,
  },

  // ── Center container (for non-Android) ────────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  centerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  centerBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  controlsCard: {
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  listCard: {
    marginBottom: Spacing.xl,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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

  // ── Permission banner ─────────────────────────────────────────────────────
  permissionBanner: {
    marginTop: Spacing.sm,
  },
  permissionBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${COLORS.secondary}14`,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  permissionBannerText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: COLORS.text.onPrimary,
  },

  // ── Controls ──────────────────────────────────────────────────────────────
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: Spacing.lg,
  },
  loadingLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // ── Summary text ──────────────────────────────────────────────────────────
  summaryText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
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

  // ── List ──────────────────────────────────────────────────────────────────
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

  // List item content
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

  // Progress bar
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

  // Trailing
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

  // Notification chip
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
});
