import { useState } from 'react';

import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import NotificationApiManager from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationLogTestScreen() {
  const [notifCount, setNotifCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  async function checkNotificationPermission() {
    const hasPerms = NotificationApiManager.hasPostPermission();
    setHasPermission(hasPerms);
    Alert.alert('Notification Permission', `Has permission: ${hasPerms}`);
  }

  async function requestNotificationPermission() {
    const granted = await NotificationApiManager.requestPostPermission();
    setHasPermission(granted);
    if (granted) {
      Alert.alert('Success', 'Notification permission granted!');
    } else {
      Alert.alert('Denied', 'Notification permission was denied');
    }
  }

  async function getLoggedNotifications() {
    try {
      const notifs = await NotificationApiManager.getLoggedNotifications();
      setNotifCount(notifs.length);
      Alert.alert(
        'Logged Notifications',
        `Found ${notifs.length} notifications\n\nRecent:\n${notifs
          .slice(0, 3)
          .map((n: any) => `• ${n.appName}: ${n.title}`)
          .join('\n')}`,
      );
    } catch (error) {
      Alert.alert('Error', `Failed to get notifications: ${error}`);
    }
  }

  async function sendTestNotification() {
    const hasPerms = NotificationApiManager.hasPostPermission();
    if (!hasPerms) {
      Alert.alert('Permission Required', 'Please grant notification permission first');
      return;
    }

    // Create a test channel
    NotificationApiManager.createChannel('test', 'Test Notifications', 3);

    // Send test notification
    const id = Date.now() % 100000;
    const success = NotificationApiManager.notify(
      'Test Notification',
      'This is a test notification from the background service',
      'test',
      id,
    );

    Alert.alert('Test Notification', success ? 'Sent successfully!' : 'Failed to send');
  }

  async function clearAllNotifications() {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all logged notifications? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await NotificationApiManager.clearAllData();
              if (success) {
                setNotifCount(0);
                Alert.alert('Success', 'All notifications cleared');
              } else {
                Alert.alert('Error', 'Failed to clear notifications');
              }
            } catch (error) {
              Alert.alert('Error', `Failed to clear notifications: ${error}`);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Notification Log Test 📔</Text>
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.buttonGroup}>
            <Button title="Check Permission" onPress={checkNotificationPermission} />
            <Button title="Request Permission" onPress={requestNotificationPermission} />
          </View>
          <Text style={styles.statusText}>
            Status: {hasPermission ? '✅ Granted' : '❌ Not Granted'}
          </Text>
        </View>

        {/* Notification Log Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Log</Text>
          <View style={styles.buttonGroup}>
            <Button title="Get Logged Notifications" onPress={getLoggedNotifications} />
            <Button
              title="Clear All Notifications"
              onPress={clearAllNotifications}
              color="#ff6b6b"
            />
          </View>
          <Text style={styles.statusText}>Logged Notifications: {notifCount}</Text>
        </View>

        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          <View style={styles.buttonGroup}>
            <Button title="Send Test Notification" onPress={sendTestNotification} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Instructions</Text>
          <Text style={styles.instructionText}>1. Grant notification permission</Text>
          <Text style={styles.instructionText}>2. Send test notifications</Text>
          <Text style={styles.instructionText}>3. View them in the Notifications tab</Text>
          <Text style={styles.instructionText}>
            4. Use clear to remove all logged notifications
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonGroup: {
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
