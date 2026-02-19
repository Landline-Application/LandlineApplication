import { useState } from 'react';

import { Alert, Button, ScrollView, StyleSheet } from 'react-native';

import { Image } from 'expo-image';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import NotificationApiManager from '@/modules/notification-api-manager';

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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.logo} />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Notification Log Test 📔</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Permissions Section */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Permissions</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Check Permission" onPress={checkNotificationPermission} />
          <Button title="Request Permission" onPress={requestNotificationPermission} />
        </ThemedView>
        <ThemedText style={styles.statusText}>
          Status: {hasPermission ? '✅ Granted' : '❌ Not Granted'}
        </ThemedText>
      </ThemedView>

      {/* Notification Log Section */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Notification Log</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Get Logged Notifications" onPress={getLoggedNotifications} />
          <Button
            title="Clear All Notifications"
            onPress={clearAllNotifications}
            color="#ff6b6b"
          />
        </ThemedView>
        <ThemedText style={styles.statusText}>Logged Notifications: {notifCount}</ThemedText>
      </ThemedView>

      {/* Test Actions */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Test Actions</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Send Test Notification" onPress={sendTestNotification} />
        </ThemedView>
      </ThemedView>

      {/* Instructions */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">ℹ️ Instructions</ThemedText>
        <ThemedText>1. Grant notification permission</ThemedText>
        <ThemedText>2. Send test notifications</ThemedText>
        <ThemedText>3. View them in the Notifications tab</ThemedText>
        <ThemedText>4. Use clear to remove all logged notifications</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  buttonGroup: {
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
