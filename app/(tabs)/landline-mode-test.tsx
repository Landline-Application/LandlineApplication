import React, { useEffect, useState } from 'react';

import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandlineModeTest() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLandlineModeActive, setIsLandlineModeActive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const t = {
    bg: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    secondaryText: isDark ? '#AAAAAA' : '#666666',
    sectionBg: isDark ? '#1E1E1E' : 'rgba(0, 122, 255, 0.05)',
    cardBg: isDark ? '#2A2A2A' : 'rgba(0, 0, 0, 0.05)',
    instructionBg: isDark ? '#2A2A1A' : 'rgba(255, 204, 0, 0.1)',
    badgeInactiveBg: isDark ? 'rgba(255, 80, 80, 0.2)' : 'rgba(255, 0, 0, 0.1)',
    badgeInactiveText: isDark ? '#FF6B6B' : '#CC0000',
    badgeActiveBg: 'rgba(52, 199, 89, 0.2)',
    badgeActiveText: '#34C759',
    badgeNeutralText: isDark ? '#FFFFFF' : '#000000',
  };

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

  const loadNotifications = async () => {
    try {
      const logs = await NotificationApiManager.getLoggedNotifications();
      setNotifications(logs);
    } catch (error) {
      console.error('Failed to load logged notifications', error);
      Alert.alert('Error', 'Failed to load logged notifications');
    }
  };

  const handleRequestPermission = async () => {
    await NotificationApiManager.requestNotificationListenerPermission();
    Alert.alert(
      'Grant Permission',
      'Please enable notification access for this app, then come back and check status.',
      [{ text: 'OK', onPress: () => setTimeout(checkPermission, 1000) }],
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

  const handlePullRefresh = () => {
    setRefreshing(true);
    checkPermission();
    checkLandlineMode();
    loadNotifications();
    setRefreshing(false);
  };

  const handleClearLogs = () => {
    NotificationApiManager.clearLoggedNotifications();
    setNotifications([]);
    Alert.alert('Success', 'All notification logs cleared');
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <Text style={[styles.title, { color: t.text }]}>Landline Mode Test</Text>
        <Text style={{ color: t.text }}>This feature is only available on Android</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Landline Mode Test</Text>
        <Text style={[styles.subtitle, { color: t.secondaryText }]}>Test notification logging</Text>
      </View>

      <View style={[styles.section, { backgroundColor: t.sectionBg }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Status</Text>

        <View style={styles.statusRow}>
          <Text style={{ color: t.text }}>Notification Listener Permission:</Text>
          <Text style={[
            styles.statusBadge,
            {
              backgroundColor: hasPermission ? t.badgeActiveBg : t.badgeInactiveBg,
              color: hasPermission ? t.badgeActiveText : t.badgeInactiveText,
            },
          ]}>
            {hasPermission ? 'Granted' : 'Not Granted'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={{ color: t.text }}>Landline Mode:</Text>
          <Text style={[
            styles.statusBadge,
            {
              backgroundColor: isLandlineModeActive ? t.badgeActiveBg : t.badgeInactiveBg,
              color: isLandlineModeActive ? t.badgeActiveText : t.badgeInactiveText,
            },
          ]}>
            {isLandlineModeActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={{ color: t.text }}>Logged Notifications:</Text>
          <Text style={[styles.statusBadge, { backgroundColor: t.cardBg, color: t.badgeNeutralText }]}>
            {notifications.length}
          </Text>
        </View>
      </View>

      {!hasPermission && (
        <View style={[styles.section, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>⚠️ Permission Required</Text>
          <Text style={[styles.description, { color: t.secondaryText }]}>
            This app needs Notification Access permission to log notifications during Landline mode.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleRequestPermission} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasPermission && (
        <View style={[styles.section, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Landline Mode Control</Text>
          <Text style={[styles.description, { color: t.secondaryText }]}>
            When active, all notifications will be logged and can be viewed later.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleToggleLandlineMode} activeOpacity={0.8}>
            <Text style={styles.buttonText}>
              {isLandlineModeActive ? 'Deactivate' : 'Activate'} Landline Mode
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: t.sectionBg }]}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>
          Logged Notifications ({notifications.length})
        </Text>

        {notifications.length === 0 ? (
          <Text style={[styles.emptyText, { color: t.secondaryText }]}>
            No notifications logged yet.{' '}
            {isLandlineModeActive
              ? 'Send yourself a test notification!'
              : 'Activate Landline mode first.'}
          </Text>
        ) : (
          notifications.map((notif, index) => (
            <View key={index} style={[styles.notificationCard, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.notifApp, { color: t.secondaryText }]}>{notif.appName}</Text>
              <Text style={[styles.notifTitle, { color: t.text }]}>{notif.title}</Text>
              <Text style={[styles.notifText, { color: t.text }]}>{notif.text}</Text>
              <Text style={[styles.notifTime, { color: t.secondaryText }]}>
                {new Date(notif.postTime).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.section, { backgroundColor: t.sectionBg }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.refreshButton, { flex: 1 }]}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton, { flex: 1 }]}
              onPress={handleClearLogs}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.instructions, { backgroundColor: t.instructionBg }]}>
        <Text style={[styles.instructionsTitle, { color: t.text }]}>📝 Testing Instructions:</Text>
        <Text style={[styles.instructionsText, { color: t.text }]}>
          1. Grant Notification Access permission{'\n'}
          2. Activate Landline Mode{'\n'}
          3. Send yourself a test notification (email, message, etc.){'\n'}
          4. Come back and tap Refresh to see logged notifications
        </Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
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
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
  notificationCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  notifApp: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  instructions: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
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
