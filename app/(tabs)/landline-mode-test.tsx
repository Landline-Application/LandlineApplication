import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import NotificationApiManager from '@/modules/notification-api-manager';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';

export default function LandlineModeTest() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLandlineModeActive, setIsLandlineModeActive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkPermission();
      checkLandlineMode();
      loadNotifications();
    }
  }, []);

  const checkPermission = () => {
    const granted = NotificationApiManager.hasNotificationListenerPermission();
    setHasPermission(granted);
  };

  const checkLandlineMode = () => {
    const active = NotificationApiManager.isLandlineModeActive();
    setIsLandlineModeActive(active);
  };

  const loadNotifications = () => {
    const logs = NotificationApiManager.getLoggedNotifications();
    setNotifications(logs);
  };

  const handleRequestPermission = async () => {
    await NotificationApiManager.requestNotificationListenerPermission();
    Alert.alert(
      'Grant Permission',
      'Please enable notification access for this app, then come back and check status.',
      [{ text: 'OK', onPress: () => setTimeout(checkPermission, 1000) }]
    );
  };

  const handleToggleLandlineMode = () => {
    const newState = !isLandlineModeActive;
    NotificationApiManager.setLandlineMode(newState);
    setIsLandlineModeActive(newState);
    Alert.alert('Success', `Landline mode ${newState ? 'activated' : 'deactivated'}`);
  };

  const handleRefresh = () => {
    checkPermission();
    checkLandlineMode();
    loadNotifications();
    Alert.alert('Refreshed', `Found ${notifications.length} logged notifications`);
  };

  const handleClearLogs = () => {
    NotificationApiManager.clearLoggedNotifications();
    setNotifications([]);
    Alert.alert('Success', 'All notification logs cleared');
  };

  if (Platform.OS !== 'android') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Landline Mode Test</ThemedText>
        <ThemedText>This feature is only available on Android</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Landline Mode Test</ThemedText>
        <ThemedText style={styles.subtitle}>Test notification logging</ThemedText>
      </ThemedView>

      {/* Status */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Status</ThemedText>
        
        <ThemedView style={styles.statusRow}>
          <ThemedText>Notification Listener Permission:</ThemedText>
          <ThemedText style={[styles.statusBadge, hasPermission && styles.statusActive]}>
            {hasPermission ? 'Granted' : 'Not Granted'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statusRow}>
          <ThemedText>Landline Mode:</ThemedText>
          <ThemedText style={[styles.statusBadge, isLandlineModeActive && styles.statusActive]}>
            {isLandlineModeActive ? 'Active' : 'Inactive'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statusRow}>
          <ThemedText>Logged Notifications:</ThemedText>
          <ThemedText style={styles.statusBadge}>{notifications.length}</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Permission */}
      {!hasPermission && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>⚠️ Permission Required</ThemedText>
          <ThemedText style={styles.description}>
            This app needs Notification Access permission to log notifications during Landline mode.
          </ThemedText>
          <ThemedView style={styles.button} onTouchEnd={handleRequestPermission}>
            <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* Landline Mode Toggle */}
      {hasPermission && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Landline Mode Control</ThemedText>
          <ThemedText style={styles.description}>
            When active, all notifications will be logged and can be viewed later.
          </ThemedText>
          <ThemedView style={styles.button} onTouchEnd={handleToggleLandlineMode}>
            <ThemedText style={styles.buttonText}>
              {isLandlineModeActive ? 'Deactivate' : 'Activate'} Landline Mode
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* Logged Notifications */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Logged Notifications ({notifications.length})</ThemedText>
        
        {notifications.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            No notifications logged yet. {isLandlineModeActive ? 'Send yourself a test notification!' : 'Activate Landline mode first.'}
          </ThemedText>
        ) : (
          notifications.map((notif, index) => (
            <ThemedView key={index} style={styles.notificationCard}>
              <ThemedText style={styles.notifApp}>{notif.appName}</ThemedText>
              <ThemedText style={styles.notifTitle}>{notif.title}</ThemedText>
              <ThemedText style={styles.notifText}>{notif.text}</ThemedText>
              <ThemedText style={styles.notifTime}>
                {new Date(notif.postTime).toLocaleString()}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>

      {/* Actions */}
      <ThemedView style={styles.section}>
        <ThemedView style={styles.buttonRow}>
          <ThemedView style={[styles.button, styles.refreshButton]} onTouchEnd={handleRefresh}>
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </ThemedView>
          
          {notifications.length > 0 && (
            <ThemedView style={[styles.button, styles.clearButton]} onTouchEnd={handleClearLogs}>
              <ThemedText style={styles.buttonText}>Clear All</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.instructions}>
        <ThemedText style={styles.instructionsTitle}>📝 Testing Instructions:</ThemedText>
        <ThemedText style={styles.instructionsText}>
          1. Grant Notification Access permission{'\n'}
          2. Activate Landline Mode{'\n'}
          3. Send yourself a test notification (email, message, etc.){'\n'}
          4. Come back and tap Refresh to see logged notifications
        </ThemedText>
      </ThemedView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
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
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    color: '#34C759',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    padding: 20,
  },
  notificationCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  notifApp: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifText: {
    fontSize: 14,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  instructions: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

