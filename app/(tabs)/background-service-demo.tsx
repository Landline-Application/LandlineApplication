import React, { useEffect, useState } from 'react';

import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import BackgroundServiceManager from '@/modules/background-service-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useAppTheme } from '@/contexts/theme-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackgroundServiceDemo() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const t = isDark ? dark : light;

  const [serviceRunning, setServiceRunning] = useState(false);
  const [workScheduled, setWorkScheduled] = useState(false);
  const [batteryOptimizationIgnored, setBatteryOptimizationIgnored] = useState(false);
  const [androidVersion, setAndroidVersion] = useState<any>(null);
  const [isDozeMode, setIsDozeMode] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkServiceStatus();
      checkWorkStatus();
      checkBatteryOptimization();
      getVersionInfo();
      checkDozeMode();

      NotificationApiManager.createChannel(
        'background_service_channel',
        'Background Service',
        3,
      );
    }
  }, []);

  const checkServiceStatus = () => {
    const running = BackgroundServiceManager.isForegroundServiceRunning();
    setServiceRunning(running);
  };

  const checkWorkStatus = () => {
    const scheduled = BackgroundServiceManager.isBackgroundWorkScheduled();
    setWorkScheduled(scheduled);
  };

  const checkBatteryOptimization = () => {
    const ignored = BackgroundServiceManager.isIgnoringBatteryOptimizations();
    setBatteryOptimizationIgnored(ignored);
  };

  const getVersionInfo = () => {
    const version = BackgroundServiceManager.getAndroidVersion();
    setAndroidVersion(version);
  };

  const checkDozeMode = () => {
    const doze = BackgroundServiceManager.isDeviceIdleMode();
    setIsDozeMode(doze);
  };

  const handleStartForegroundService = () => {
    const success = BackgroundServiceManager.startForegroundService(
      'Background Service Active',
      'Monitoring notifications in the background',
    );

    if (success) {
      Alert.alert('Success', 'Foreground service started successfully!');
      checkServiceStatus();
    } else {
      Alert.alert('Error', 'Failed to start foreground service');
    }
  };

  const handleStopForegroundService = () => {
    const success = BackgroundServiceManager.stopForegroundService();

    if (success) {
      Alert.alert('Success', 'Foreground service stopped');
      checkServiceStatus();
    } else {
      Alert.alert('Error', 'Failed to stop foreground service');
    }
  };

  const handleScheduleWork = () => {
    const success = BackgroundServiceManager.scheduleBackgroundWork(15, 'notification_check');

    if (success) {
      Alert.alert('Success', 'Background work scheduled (runs every 15 minutes)');
      checkWorkStatus();
    } else {
      Alert.alert('Error', 'Failed to schedule background work');
    }
  };

  const handleCancelWork = () => {
    const success = BackgroundServiceManager.cancelBackgroundWork();

    if (success) {
      Alert.alert('Success', 'Background work cancelled');
      checkWorkStatus();
    } else {
      Alert.alert('Error', 'Failed to cancel background work');
    }
  };

  const handleRequestBatteryOptimization = async () => {
    Alert.alert(
      'Battery Optimization',
      'This will request the system to disable battery optimizations for this app. Only use if necessary for core functionality.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const success = await BackgroundServiceManager.requestIgnoreBatteryOptimizations();
            if (success) {
              setTimeout(() => checkBatteryOptimization(), 1000);
            }
          },
        },
      ],
    );
  };

  const handleOpenBatterySettings = async () => {
    await BackgroundServiceManager.openBatteryOptimizationSettings();
  };

  const handleSendTestNotification = () => {
    const hasPermission = NotificationApiManager.hasPostPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Notification permission is required to send test notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => NotificationApiManager.requestPostPermission(),
          },
        ],
      );
      return;
    }

    const success = NotificationApiManager.notify(
      'Test Notification',
      'This is a test notification from the background service',
      'background_service_channel',
      Date.now(),
    );

    if (success) {
      Alert.alert('Success', 'Test notification sent!');
    } else {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <Text style={[styles.title, { color: t.text }]}>Background Service Demo</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          This feature is only available on Android
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={40} color={t.accent} />
        <Text style={[styles.title, { color: t.text }]}>Background Service Demo</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Test background service functionality
        </Text>
      </View>

      {/* System Status */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>System Status</Text>

        <View style={[styles.statusRow, { borderBottomColor: t.divider }]}>
          <Text style={[styles.statusLabel, { color: t.text }]}>Foreground Service:</Text>
          <Text style={[styles.statusValue, { color: t.textSecondary }, serviceRunning && styles.statusActive]}>
            {serviceRunning ? 'Running' : 'Stopped'}
          </Text>
        </View>

        <View style={[styles.statusRow, { borderBottomColor: t.divider }]}>
          <Text style={[styles.statusLabel, { color: t.text }]}>Background Work:</Text>
          <Text style={[styles.statusValue, { color: t.textSecondary }, workScheduled && styles.statusActive]}>
            {workScheduled ? 'Scheduled' : 'Not Scheduled'}
          </Text>
        </View>

        <View style={[styles.statusRow, { borderBottomColor: t.divider }]}>
          <Text style={[styles.statusLabel, { color: t.text }]}>Battery Optimization:</Text>
          <Text style={[styles.statusValue, { color: t.textSecondary }, batteryOptimizationIgnored && styles.statusActive]}>
            {batteryOptimizationIgnored ? 'Ignored' : 'Active'}
          </Text>
        </View>

        <View style={[styles.statusRow, { borderBottomColor: t.divider }]}>
          <Text style={[styles.statusLabel, { color: t.text }]}>Doze Mode:</Text>
          <Text style={[styles.statusValue, { color: t.textSecondary }]}>
            {isDozeMode ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {androidVersion && (
          <View style={[styles.statusRow, { borderBottomColor: 'transparent' }]}>
            <Text style={[styles.statusLabel, { color: t.text }]}>Android Version:</Text>
            <Text style={[styles.statusValue, { color: t.textSecondary }]}>
              {androidVersion.release} (SDK {androidVersion.sdkInt})
            </Text>
          </View>
        )}
      </View>

      {/* Foreground Service Controls */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Foreground Service</Text>
        <Text style={[styles.description, { color: t.textSecondary }]}>
          Foreground services display a persistent notification and can run even when the app is in
          the background.
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.button} onTouchEnd={handleStartForegroundService}>
            <Text style={styles.buttonText}>Start Service</Text>
          </View>

          <View style={styles.button} onTouchEnd={handleStopForegroundService}>
            <Text style={styles.buttonText}>Stop Service</Text>
          </View>
        </View>
      </View>

      {/* WorkManager Controls */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Background Work (WorkManager)</Text>
        <Text style={[styles.description, { color: t.textSecondary }]}>
          WorkManager schedules battery-efficient periodic tasks. Minimum interval is 15 minutes.
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.button} onTouchEnd={handleScheduleWork}>
            <Text style={styles.buttonText}>Schedule Work</Text>
          </View>

          <View style={styles.button} onTouchEnd={handleCancelWork}>
            <Text style={styles.buttonText}>Cancel Work</Text>
          </View>
        </View>
      </View>

      {/* Battery Optimization */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Battery Optimization</Text>
        <Text style={[styles.description, { color: t.textSecondary }]}>
          Warning: Use with caution. Google Play may reject apps that unnecessarily request to ignore
          battery optimization.
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.button} onTouchEnd={handleRequestBatteryOptimization}>
            <Text style={styles.buttonText}>Request Ignore</Text>
          </View>

          <View style={styles.button} onTouchEnd={handleOpenBatterySettings}>
            <Text style={styles.buttonText}>Open Settings</Text>
          </View>
        </View>
      </View>

      {/* Test Notifications */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Test Notification</Text>
        <Text style={[styles.description, { color: t.textSecondary }]}>
          Send a test notification to verify the notification system is working.
        </Text>

        <View style={styles.button} onTouchEnd={handleSendTestNotification}>
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={[styles.section, { backgroundColor: 'transparent' }]}>
        <View
          style={[styles.button, styles.refreshButton]}
          onTouchEnd={() => {
            checkServiceStatus();
            checkWorkStatus();
            checkBatteryOptimization();
            checkDozeMode();
          }}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const light = {
  bg: '#f5f5f5',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666',
  accent: '#007AFF',
  divider: 'rgba(0, 0, 0, 0.08)',
};

const dark = {
  bg: '#0a0a0a',
  card: '#1c1c1c',
  text: '#f0f0f0',
  textSecondary: '#999',
  accent: '#5B7FE8',
  divider: 'rgba(255, 255, 255, 0.08)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
  },
  statusActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#34C759',
  },
});
