import React, { useEffect, useState } from 'react';

import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import the background service manager
import BackgroundServiceManager from '@/modules/background-service-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function BackgroundServiceDemo() {
  const insets = useSafeAreaInsets();
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

      // Setup notification channel
      NotificationApiManager.createChannel(
        'background_service_channel',
        'Background Service',
        3, // IMPORTANCE_DEFAULT
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
    // Schedule work to run every 15 minutes (minimum allowed)
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
      <View style={styles.container}>
        <Text style={styles.title}>Background Service Demo</Text>
        <Text style={styles.subtitle}>This feature is only available on Android</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={40} color="#007AFF" />
        <Text style={styles.title}>Background Service Demo</Text>
        <Text style={styles.subtitle}>Test background service functionality</Text>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Foreground Service:</Text>
          <Text style={[styles.statusValue, serviceRunning && styles.statusActive]}>
            {serviceRunning ? 'Running' : 'Stopped'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Background Work:</Text>
          <Text style={[styles.statusValue, workScheduled && styles.statusActive]}>
            {workScheduled ? 'Scheduled' : 'Not Scheduled'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Battery Optimization:</Text>
          <Text
            style={[styles.statusValue, batteryOptimizationIgnored && styles.statusActive]}
          >
            {batteryOptimizationIgnored ? 'Ignored' : 'Active'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Doze Mode:</Text>
          <Text style={styles.statusValue}>{isDozeMode ? 'Active' : 'Inactive'}</Text>
        </View>

        {androidVersion && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Android Version:</Text>
            <Text style={styles.statusValue}>
              {androidVersion.release} (SDK {androidVersion.sdkInt})
            </Text>
          </View>
        )}
      </View>

      {/* Foreground Service Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foreground Service</Text>
        <Text style={styles.description}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Work (WorkManager)</Text>
        <Text style={styles.description}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Battery Optimization</Text>
        <Text style={styles.description}>
          ⚠️ Use with caution. Google Play may reject apps that unnecessarily request to ignore
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notification</Text>
        <Text style={styles.description}>
          Send a test notification to verify the notification system is working.
        </Text>

        <View style={styles.button} onTouchEnd={handleSendTestNotification}>
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={styles.section}>
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
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusActive: {
    color: '#34C759',
    fontWeight: '600',
    opacity: 1,
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
