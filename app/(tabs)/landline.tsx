import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLandlineStore } from '@/hooks/use-landline-store';
import NotificationApiManager from '@/modules/notification-api-manager';
import UsageStatsManager, { AppUsageSummary, UsageWindow } from '@/modules/usage-stats-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LoggedNotification = {
  timestamp?: number;
  packageName?: string;
};

type AppAttentionRow = AppUsageSummary & { notificationCount: number };

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

export default function LandlineScreen() {
  const insets = useSafeAreaInsets();

  const {
    hasPermission,
    isActive,
    isLoading,
    checkStatus,
    requestPermission,
    activateLandlineMode,
    deactivateLandlineMode,
  } = useLandlineStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [usageWindow, setUsageWindow] = useState<UsageWindow>('24h');
  const [topApps, setTopApps] = useState<AppAttentionRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const loadUsageData = useCallback(async (window: UsageWindow) => {
    if (Platform.OS !== 'android') return;

    const usageGranted = UsageStatsManager.hasUsageStatsPermission();
    setHasUsagePermission(usageGranted);

    if (!usageGranted) {
      setTopApps([]);
      return;
    }

    try {
      setUsageLoading(true);
      const usage = await UsageStatsManager.getTopUsageApps(window, 5);
      const windowMs = getWindowMs(window);
      let logs: LoggedNotification[] = [];
      try {
        logs = (await NotificationApiManager.getLoggedNotifications()) as LoggedNotification[];
      } catch {
        logs = [];
      }
      const notifCounts = countLoggedNotificationsByPackage(logs, windowMs);
      const merged: AppAttentionRow[] = usage.map((app) => ({
        ...app,
        notificationCount: notifCounts.get(app.packageName) ?? 0,
      }));
      setTopApps(merged);
    } catch (error) {
      console.error('Failed to load app usage data', error);
      Alert.alert('Error', 'Failed to load app attention data.');
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus().finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && !initialLoading) {
      loadUsageData(usageWindow);
    }
  }, [initialLoading, loadUsageData, usageWindow]);

  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for this app, then come back to confirm status.',
      );
    } catch {
      // Error is already set in store
      console.error('Permission request failed');
    } finally {
      // Give the system a moment, then re-check
      setTimeout(() => {
        checkStatus();
      }, 1000);
    }
  }, [requestPermission, checkStatus]);

  const handleToggleLandlineMode = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Landline Mode requires Notification Access permission. Please grant permission first.',
      );
      return;
    }

    try {
      if (isActive) {
        await deactivateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now OFF.');
      } else {
        await activateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now ON.');
      }
    } catch {
      Alert.alert('Error', 'Unable to update Landline Mode. Please try again.');
    }
  }, [hasPermission, isActive, activateLandlineMode, deactivateLandlineMode]);

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

  const formatDuration = useCallback((durationMs: number) => {
    const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }, []);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Landline Mode</Text>
        <Text style={styles.description}>Landline Mode is only available on Android devices.</Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4AF7A" />
        <Text style={styles.loadingText}>Checking Landline status...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Landline Mode</Text>
      </View>

      {/* Explanation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What is Landline Mode?</Text>
        <Text style={styles.cardBody}>
          Landline Mode temporarily captures your notifications, so you can stay focused. Afterward,
          you can review everything that came in from the Notifications tab.
        </Text>
      </View>

      {/* Status */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Notification Access</Text>
          <View
            style={[
              styles.statusPill,
              hasPermission ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>{hasPermission ? 'Granted' : 'Not Granted'}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Landline Mode</Text>
          <View
            style={[
              styles.statusPill,
              isActive ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>{isActive ? 'On' : 'Off'}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {!hasPermission && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Enable Landline Mode</Text>
          <Text style={styles.cardBody}>
            To use Landline Mode, grant Notification Access permission. We only use this to log
            notifications while mode is active.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermission}>
            <Text style={styles.primaryButtonText}>Grant Notification Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasPermission && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Control</Text>
          <Text style={styles.cardBody}>
            Turn Landline Mode on to capture notifications, then turn it off when you&apos;re done.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isActive ? styles.buttonOn : styles.buttonOff,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleToggleLandlineMode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#3d3325" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isActive ? 'Turn Landline Mode Off' : 'Turn Landline Mode On'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>App Attention</Text>
        <Text style={styles.cardBody}>
          Top 5 apps by screen time (Android usage stats) for the selected period. Notification
          counts use Landline&apos;s log for the same period — only notifications captured while
          Landline Mode was on are included.
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Usage Access</Text>
          <View
            style={[
              styles.statusPill,
              hasUsagePermission ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>
              {hasUsagePermission ? 'Granted' : 'Not Granted'}
            </Text>
          </View>
        </View>

        {!hasUsagePermission && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRequestUsagePermission}>
              <Text style={styles.primaryButtonText}>Grant Usage Access</Text>
            </TouchableOpacity>
            <View style={styles.usageHelpBox}>
              <Text style={styles.usageHelpTitle}>How to enable</Text>
              <Text style={styles.usageHelpText}>
                1) Open Usage access / Special app access{'\n'}
                2) Tap Landline{'\n'}
                3) Turn on Permit usage access
              </Text>
              <Text style={styles.usageHelpText}>
                Common paths:{'\n'}- Settings {'->'} Apps {'->'} Special app access {'->'} Usage
                access{'\n'}- Settings {'->'} Security & privacy {'->'} Privacy {'->'} Usage access
              </Text>
            </View>
          </>
        )}

        {hasUsagePermission && (
          <>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, usageWindow === '24h' && styles.toggleButtonActive]}
                onPress={() => handleChangeUsageWindow('24h')}
              >
                <Text style={[styles.toggleButtonText, usageWindow === '24h' && styles.toggleButtonTextActive]}>24h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, usageWindow === '7d' && styles.toggleButtonActive]}
                onPress={() => handleChangeUsageWindow('7d')}
              >
                <Text style={[styles.toggleButtonText, usageWindow === '7d' && styles.toggleButtonTextActive]}>7d</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, usageWindow === '30d' && styles.toggleButtonActive]}
                onPress={() => handleChangeUsageWindow('30d')}
              >
                <Text style={[styles.toggleButtonText, usageWindow === '30d' && styles.toggleButtonTextActive]}>30d</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshDataButton} onPress={handleRefreshUsageData}>
                <Text style={styles.refreshDataButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {usageLoading ? (
              <Text style={styles.cardBody}>Loading app attention data...</Text>
            ) : topApps.length === 0 ? (
              <Text style={styles.cardBody}>
                No usage data found for this range yet. Keep using your apps and try Refresh again.
              </Text>
            ) : (
              <View style={styles.usageList}>
                {topApps.map((app, index) => (
                  <View key={app.packageName} style={styles.usageRowItem}>
                    <Text style={styles.usageRank}>{index + 1}.</Text>
                    <View style={styles.usageAppInfo}>
                      <Text style={styles.usageAppName}>{app.appName}</Text>
                      <Text style={styles.usagePackageName}>{app.packageName}</Text>
                    </View>
                    <View style={styles.usageMetaRight}>
                      <Text style={styles.usageDuration}>{formatDuration(app.totalTimeMs)}</Text>
                      <Text style={styles.usageNotifCount}>
                        {app.notificationCount}{' '}
                        {app.notificationCount === 1 ? 'notif' : 'notifs'} (logged)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Hint to Notifications tab */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          When Landline Mode is on, your notifications are quietly logged. Visit the Notifications
          tab any time to review what you missed.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d3325',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#3d3325',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F4E4C1',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#D4AF7A',
  },
  loadingText: {
    fontSize: 16,
    color: '#F4E4C1',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,228,193,0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#F4E4C1',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#F9F2DF',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#F4E4C1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 15,
    color: '#F9F2DF',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9F2DF',
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#D4AF7A',
  },
  buttonOn: {
    backgroundColor: '#c0392b',
  },
  buttonOff: {
    backgroundColor: '#27ae60',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3d3325',
  },
  footerNote: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  footerNoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#D4AF7A',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#F9F2DF',
    textAlign: 'center',
  },
  toggleRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(244,228,193,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244,228,193,0.2)',
  },
  toggleButtonActive: {
    backgroundColor: '#D4AF7A',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9F2DF',
  },
  toggleButtonTextActive: {
    color: '#3d3325',
  },
  refreshDataButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4AF7A',
  },
  refreshDataButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4E4C1',
  },
  usageList: {
    marginTop: 12,
    gap: 8,
  },
  usageRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  usageRank: {
    width: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#F4E4C1',
  },
  usageAppInfo: {
    flex: 1,
    marginRight: 8,
  },
  usageAppName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9F2DF',
  },
  usagePackageName: {
    marginTop: 2,
    fontSize: 11,
    color: '#D4AF7A',
  },
  usageDuration: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4E4C1',
  },
  usageMetaRight: {
    alignItems: 'flex-end',
    maxWidth: '42%',
  },
  usageNotifCount: {
    fontSize: 11,
    color: '#D4AF7A',
    marginTop: 2,
    textAlign: 'right',
  },
  usageHelpBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244,228,193,0.2)',
  },
  usageHelpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4E4C1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  usageHelpText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#F9F2DF',
    marginBottom: 6,
  },
});
