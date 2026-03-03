import React, { useEffect, useState } from 'react';

import { Alert, Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useLandlineStore } from '@/hooks/useLandlineStore';
import {
  getReplyMessage,
  isAutoReplyEnabled,
  isListenerEnabled,
  isServiceRunning,
  requestListenerPermission,
  setAllowedApps,
  setReplyMessage,
} from '@/modules/auto-reply-manager';
import BackgroundServiceManager from '@/modules/background-service-manager';
import {
  getAllInstalledApps,
  getCurrentState,
  getInterruptionFilterConstants,
  hasPermission as hasDNDPermission,
  requestPermission as requestDNDPermission,
  setDNDEnabled,
  setInterruptionFilter,
} from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DebugToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  // Landline store
  const {
    hasPermission: landlinePermission,
    isActive: landlineActive,
    notifications,
    activateLandlineMode,
    deactivateLandlineMode,
    requestPermission: requestLandlinePermission,
    checkStatus,
    refreshNotifications,
  } = useLandlineStore();

  // Local state for status displays
  const [serviceRunning, setServiceRunning] = useState(false);
  const [workScheduled, setWorkScheduled] = useState(false);
  const [batteryOptimizationIgnored, setBatteryOptimizationIgnored] = useState(false);
  const [isDozeMode, setIsDozeMode] = useState(false);
  const [androidVersion, setAndroidVersion] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [dndStatus, setDndStatus] = useState('');

  // Initialize on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      refreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper functions to refresh status
  const refreshStatus = async () => {
    if (Platform.OS !== 'android') return;

    // Background Service Status
    setServiceRunning(BackgroundServiceManager.isForegroundServiceRunning());
    setWorkScheduled(BackgroundServiceManager.isBackgroundWorkScheduled());
    setBatteryOptimizationIgnored(BackgroundServiceManager.isIgnoringBatteryOptimizations());
    setIsDozeMode(BackgroundServiceManager.isDeviceIdleMode());
    const versionInfo = BackgroundServiceManager.getAndroidVersion();
    setAndroidVersion(versionInfo?.release || 'Unknown');

    // Landline
    await checkStatus();

    // Auto Reply
    setAutoReplyEnabled(isAutoReplyEnabled());

    // DND
    const state = getCurrentState();
    setDndStatus(`State: ${state.message}`);

    // Notification count
    try {
      const notifs = await NotificationApiManager.getLoggedNotifications();
      setNotifCount(notifs.length);
    } catch {
      setNotifCount(0);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Debug Tools</Text>
        <Text style={styles.subtitle}>Testing & System Information</Text>
      </View>

      {/* System Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 System Status</Text>

        {androidVersion && typeof androidVersion === 'string' && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Android Version:</Text>
            <Text style={styles.statusValue}>{androidVersion}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Foreground Service:</Text>
          <Text style={[styles.statusValue, serviceRunning ? styles.active : styles.inactive]}>
            {serviceRunning ? 'Running' : 'Stopped'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Background Work:</Text>
          <Text style={[styles.statusValue, workScheduled ? styles.active : styles.inactive]}>
            {workScheduled ? 'Scheduled' : 'Not Scheduled'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Battery Optimization:</Text>
          <Text
            style={[
              styles.statusValue,
              batteryOptimizationIgnored ? styles.active : styles.inactive,
            ]}
          >
            {batteryOptimizationIgnored ? 'Ignored' : 'Enabled'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Doze Mode:</Text>
          <Text style={[styles.statusValue, isDozeMode ? styles.warning : styles.inactive]}>
            {isDozeMode ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button title="Refresh Status" onPress={refreshStatus} color={COLORS.dark.primary} />
          <Button
            title="Start Foreground Service"
            onPress={() => {
              const success = BackgroundServiceManager.startForegroundService(
                'Debug Service',
                'Testing background service',
              );
              Alert.alert('Result', success ? 'Service started' : 'Failed to start service');
              refreshStatus();
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Stop Foreground Service"
            onPress={() => {
              const success = BackgroundServiceManager.stopForegroundService();
              Alert.alert('Result', success ? 'Service stopped' : 'Failed to stop service');
              refreshStatus();
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Notification System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notification System</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permission:</Text>
          <Text
            style={[
              styles.statusValue,
              NotificationApiManager.hasPostPermission() ? styles.active : styles.inactive,
            ]}
          >
            {NotificationApiManager.hasPostPermission() ? 'Granted' : 'Denied'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Logged Notifications:</Text>
          <Text style={styles.statusValue}>{notifCount}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Request Permission"
            onPress={async () => {
              const granted = await NotificationApiManager.requestPostPermission();
              Alert.alert('Permission', granted ? 'Granted!' : 'Denied');
              refreshStatus();
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Send Test Notification"
            onPress={() => {
              if (!NotificationApiManager.hasPostPermission()) {
                Alert.alert('Error', 'Enable notifications first');
                return;
              }
              NotificationApiManager.createChannel('debug', 'Debug', 3);
              const id = Date.now() % 100000;
              NotificationApiManager.notify('Test', 'Debug notification', 'debug', id);
              Alert.alert('Success', 'Test notification sent');
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Refresh Logs"
            onPress={async () => {
              try {
                const notifs = await NotificationApiManager.getLoggedNotifications();
                setNotifCount(notifs.length);
                Alert.alert('Logs', `Found ${notifs.length} notifications`);
              } catch (error) {
                Alert.alert('Error', `Failed to get logs: ${error}`);
              }
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Clear All Logs"
            onPress={() => {
              Alert.alert('Clear Logs', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: async () => {
                    const success = await NotificationApiManager.clearAllData();
                    if (success) {
                      setNotifCount(0);
                      Alert.alert('Success', 'Logs cleared');
                    } else {
                      Alert.alert('Error', 'Failed to clear logs');
                    }
                  },
                },
              ]);
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Landline Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Landline Mode</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Listener Permission:</Text>
          <Text style={[styles.statusValue, landlinePermission ? styles.active : styles.inactive]}>
            {landlinePermission ? 'Granted' : 'Not Granted'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Landline Mode:</Text>
          <Text style={[styles.statusValue, landlineActive ? styles.active : styles.inactive]}>
            {landlineActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Logged Notifications:</Text>
          <Text style={styles.statusValue}>{notifications.length}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Request Listener Permission"
            onPress={async () => {
              try {
                await requestLandlinePermission();
                Alert.alert('Permission', 'Please enable notification access in settings');
                setTimeout(() => checkStatus(), 1500);
              } catch {
                Alert.alert('Error', 'Could not open settings');
              }
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title={landlineActive ? 'Deactivate' : 'Activate'}
            onPress={async () => {
              try {
                if (landlineActive) {
                  await deactivateLandlineMode();
                  Alert.alert('Success', 'Landline mode deactivated');
                } else {
                  await activateLandlineMode();
                  Alert.alert('Success', 'Landline mode activated');
                }
                await refreshStatus();
              } catch {
                Alert.alert('Error', 'Could not toggle landline mode');
              }
            }}
            color={landlineActive ? COLORS.dark.error : COLORS.dark.success}
          />
          <Button
            title="Refresh Logs"
            onPress={async () => {
              await refreshNotifications();
              Alert.alert('Refreshed', `Found ${notifications.length} notifications`);
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Do Not Disturb Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚫 Do Not Disturb</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>DND Status:</Text>
          <Text style={styles.statusValue}>{dndStatus}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>DND Permission:</Text>
          <Text style={[styles.statusValue, hasDNDPermission() ? styles.active : styles.inactive]}>
            {hasDNDPermission() ? 'Granted' : 'Denied'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Request DND Permission"
            onPress={async () => {
              const granted = await requestDNDPermission();
              Alert.alert(
                'DND Permission',
                granted ? 'Granted!' : 'Denied - Please enable in settings',
              );
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Enable DND"
            onPress={async () => {
              const result = await setDNDEnabled(true);
              Alert.alert('DND', JSON.stringify(result, null, 2));
              setTimeout(() => refreshStatus(), 500);
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Disable DND"
            onPress={async () => {
              const result = await setDNDEnabled(false);
              Alert.alert('DND', JSON.stringify(result, null, 2));
              setTimeout(() => refreshStatus(), 500);
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Set Priority Mode"
            onPress={async () => {
              const constants = getInterruptionFilterConstants();
              const result = await setInterruptionFilter(constants.PRIORITY);
              Alert.alert('Priority Mode', JSON.stringify(result, null, 2));
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Get Installed Apps"
            onPress={async () => {
              const apps = await getAllInstalledApps(false);
              Alert.alert(
                'Installed Apps',
                `Found ${apps.length} apps\n\nFirst 3:\n${apps
                  .slice(0, 3)
                  .map((a) => `${a.appName}`)
                  .join('\n')}`,
              );
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Auto-Reply Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Auto-Reply</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Auto-Reply Status:</Text>
          <Text style={[styles.statusValue, autoReplyEnabled ? styles.active : styles.inactive]}>
            {autoReplyEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Service Running:</Text>
          <Text style={[styles.statusValue, isServiceRunning() ? styles.active : styles.inactive]}>
            {isServiceRunning() ? 'Running' : 'Stopped'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Listener Permission:</Text>
          <Text style={[styles.statusValue, isListenerEnabled() ? styles.active : styles.inactive]}>
            {isListenerEnabled() ? 'Granted' : 'Denied'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Request Listener Permission"
            onPress={async () => {
              const result = await requestListenerPermission();
              Alert.alert('Listener Permission', JSON.stringify(result, null, 2));
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Enable Auto-Reply"
            onPress={async () => {
              const result = await setAutoReplyEnabled(true);
              Alert.alert('Auto-Reply', JSON.stringify(result, null, 2));
              setAutoReplyEnabled(true);
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Disable Auto-Reply"
            onPress={async () => {
              const result = await setAutoReplyEnabled(false);
              Alert.alert('Auto-Reply', JSON.stringify(result, null, 2));
              setAutoReplyEnabled(false);
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Set Reply Message"
            onPress={async () => {
              const result = await setReplyMessage(
                "I'm currently unavailable. I'll get back to you soon!",
              );
              Alert.alert('Message Updated', JSON.stringify(result, null, 2));
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Show Current Message"
            onPress={() => {
              const message = getReplyMessage();
              Alert.alert('Current Reply Message', message);
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Set WhatsApp Only"
            onPress={async () => {
              const result = await setAllowedApps(['com.whatsapp']);
              Alert.alert('Apps Updated', JSON.stringify(result, null, 2));
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Home Screen Widget Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Home Screen Widget</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Widget provides quick access to Landline mode from your home screen and quick settings
            panel.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Widget Instructions"
            onPress={() => {
              Alert.alert(
                'Add Widget to Home Screen',
                'To add the Landline widget:\n\n' +
                  '1. Long press on empty space on home screen\n' +
                  '2. Tap "Widgets" or "Add widget"\n' +
                  '3. Find "Landline" in the widget list\n' +
                  '4. Drag the widget to your desired location\n' +
                  '5. The widget will show current landline status',
                [{ text: 'Got it!' }],
              );
            }}
            color={COLORS.dark.primary}
          />
          <Button
            title="Quick Settings Tile Instructions"
            onPress={() => {
              Alert.alert(
                'Quick Settings Tile',
                'For fast access to Landline mode:\n\n' +
                  '• Swipe down from top of screen twice\n' +
                  '• Tap the edit/pencil icon\n' +
                  '• Find "Landline" tile and drag to active tiles\n' +
                  '• Tap the tile to quickly toggle landline mode',
                [{ text: 'Understood' }],
              );
            }}
            color={COLORS.dark.primary}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Account</Text>

        {isAuthenticated ? (
          <View style={styles.authContainer}>
            <Text style={styles.authText}>Signed in as:</Text>
            <Text style={styles.authEmail}>{user?.email}</Text>
            <View style={styles.buttonGroup}>
              <Button title="Sign Out" onPress={handleSignOut} color={COLORS.dark.error} />
            </View>
          </View>
        ) : (
          <View style={styles.authContainer}>
            <Text style={styles.authText}>Not signed in</Text>
            <View style={styles.buttonGroup}>
              <Button
                title="Sign Up"
                onPress={() => router.push('/create-account')}
                color={COLORS.dark.primary}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.dark.text,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
  },
  section: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.divider,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    flex: 1,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark.textMuted,
    marginLeft: 8,
  },
  active: {
    color: COLORS.dark.success,
  },
  inactive: {
    color: COLORS.dark.textMuted,
  },
  warning: {
    color: COLORS.dark.warning,
  },
  buttonGroup: {
    marginTop: 12,
    gap: 8,
  },
  infoBox: {
    backgroundColor: COLORS.dark.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.dark.primary,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    lineHeight: 18,
  },
  authContainer: {
    paddingVertical: 8,
  },
  authText: {
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
  },
  authEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark.text,
    marginBottom: 12,
  },
});
