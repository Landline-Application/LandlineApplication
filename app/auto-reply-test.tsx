import { useEffect, useState } from 'react';

import { Alert, Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as Notifications from 'expo-notifications';

import { useAppTheme } from '@/contexts/theme-context';
import {
  clearReplyHistory,
  getActiveNotifications,
  getAllowedApps,
  getReplyHistory,
  getReplyMessage,
  isAutoReplyEnabled,
  isListenerEnabled,
  isServiceRunning,
  requestListenerPermission,
  sendTestNotification,
  setAllowedApps,
  setAutoReplyEnabled,
  setReplyMessage,
} from '@/modules/auto-reply-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatResult(result: any): string {
  if (result && typeof result === 'object') {
    return result.message || (result.success ? 'Success' : 'Failed');
  }
  return String(result);
}

export default function AutoReplyTestScreen() {
  const { isDark } = useAppTheme();
  const [status, setStatus] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

  const t = {
    bg: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    secondaryText: isDark ? '#AAAAAA' : '#666666',
    sectionBg: isDark ? '#1E1E1E' : '#F5F5F5',
    statusBg: isDark ? '#1A2A3A' : '#E8F4FD',
  };

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  async function requestNotificationPermissions() {
    if (Platform.OS === 'android') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notification permission in settings');
        }
      }
    }
  }

  async function checkListenerPermission() {
    const hasPermission = isListenerEnabled();
    Alert.alert(
      'Listener Permission',
      hasPermission
        ? 'Notification listener is enabled ✓'
        : 'Notification listener is not enabled ✗',
    );
  }

  async function requestPermission() {
    const result = await requestListenerPermission();
    Alert.alert('Request Permission', formatResult(result));
  }

  async function checkAutoReplyStatus() {
    const enabled = isAutoReplyEnabled();
    const running = isServiceRunning();
    setStatus(`Auto-reply: ${enabled ? 'ON' : 'OFF'}, Service: ${running ? 'Running' : 'Stopped'}`);
    Alert.alert(
      'Auto-Reply Status',
      `Enabled: ${enabled ? 'Yes ✓' : 'No ✗'}\nService Running: ${running ? 'Yes ✓' : 'No ✗'}`,
    );
  }

  async function enableAutoReply() {
    const result = await setAutoReplyEnabled(true);
    Alert.alert('Enable Auto-Reply', formatResult(result));
  }

  async function disableAutoReply() {
    const result = await setAutoReplyEnabled(false);
    Alert.alert('Disable Auto-Reply', formatResult(result));
  }

  async function updateReplyMessage() {
    const result = await setReplyMessage("I'm in a meeting right now. I'll get back to you soon!");
    Alert.alert('Update Message', formatResult(result));
  }

  async function showCurrentMessage() {
    const message = getReplyMessage();
    Alert.alert('Current Reply Message', message || 'No message set');
  }

  async function setWhatsAppOnly() {
    const result = await setAllowedApps(['com.whatsapp']);
    Alert.alert('Set WhatsApp Only', formatResult(result));
  }

  async function setMessagingApps() {
    const apps = [
      'com.whatsapp',
      'com.facebook.orca',
      'org.telegram.messenger',
      'com.instagram.android',
      'com.google.android.apps.messaging',
    ];
    const result = await setAllowedApps(apps);
    Alert.alert('Set Messaging Apps', `Configured ${apps.length} apps`);
  }

  async function allowAllApps() {
    const result = await setAllowedApps([]);
    Alert.alert('Allow All Apps', formatResult(result));
  }

  async function showAllowedApps() {
    const apps = getAllowedApps();
    Alert.alert(
      'Allowed Apps',
      apps.length > 0
        ? `${apps.length} apps:\n${apps.join('\n')}`
        : 'All apps allowed (empty list)',
    );
  }

  async function checkServiceStatus() {
    const running = isServiceRunning();
    Alert.alert('Service Status', running ? 'Running ✓' : 'Not Running ✗');
  }

  async function showActiveNotifications() {
    const notifications = await getActiveNotifications();
    setNotificationCount(notifications.length);

    if (notifications.length === 0) {
      Alert.alert('Active Notifications', 'No notifications found');
      return;
    }

    const summary = notifications
      .slice(0, 5)
      .map((n) => {
        return `${n.packageName}\n${n.title || 'No title'}\n${n.text || 'No text'}\nReply: ${n.hasReplyAction ? '✓' : '✗'}`;
      })
      .join('\n\n');

    Alert.alert(
      'Active Notifications',
      `Found ${notifications.length} notifications\n\nFirst 5:\n\n${summary}`,
    );
  }

  async function showNotificationDetails() {
    const notifications = await getActiveNotifications();

    if (notifications.length === 0) {
      Alert.alert('Notification Details', 'No notifications found');
      return;
    }

    const first = notifications[0];
    const details = [
      `Package: ${first.packageName}`,
      `Title: ${first.title || 'N/A'}`,
      `Text: ${first.text || 'N/A'}`,
      `Has Reply: ${first.hasReplyAction ? 'Yes ✓' : 'No ✗'}`,
    ].join('\n');
    Alert.alert('First Notification', details);
  }

  async function sendTestMessage() {
    const result = await sendTestNotification('John Doe', 'Hey! Are you available for a call?');
    Alert.alert(
      'Test Notification Sent',
      `${formatResult(result)}\n\n✅ Pull down from the top of the screen to see the notification!\n\nIf you don't see it, the emulator might have display issues. Try on a real device.`,
    );
  }

  async function sendMultipleTests() {
    const messages = [
      { sender: 'Alice', message: 'Can you review my PR?' },
      { sender: 'Bob', message: 'Meeting in 10 minutes' },
      { sender: 'Charlie', message: 'Did you see my message?' },
    ];

    for (const msg of messages) {
      await sendTestNotification(msg.sender, msg.message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    Alert.alert('Test Notifications', `Sent ${messages.length} test notifications`);
  }

  function viewReplyHistory() {
    const history = getReplyHistory();

    if (history.length === 0) {
      Alert.alert('Reply History', 'No replies sent yet');
      return;
    }

    const formatted = history
      .reverse()
      .slice(0, 10)
      .map((item, index) => {
        const date = new Date(item.timestamp);
        return `${index + 1}. "${item.message}"\n   ${date.toLocaleString()}`;
      })
      .join('\n\n');

    Alert.alert(
      `Reply History (${history.length} total)`,
      formatted + (history.length > 10 ? '\n\n...and more' : ''),
    );
  }

  async function clearHistory() {
    const result = await clearReplyHistory();
    Alert.alert('Clear History', formatResult(result));
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: t.text }]}>Auto-Reply Test</Text>
        </View>

        {status !== '' && (
          <View style={[styles.statusContainer, { backgroundColor: t.statusBg }]}>
            <Text style={{ color: t.text }}>{status}</Text>
          </View>
        )}

        {notificationCount > 0 && (
          <View style={[styles.statusContainer, { backgroundColor: t.statusBg }]}>
            <Text style={{ color: t.text }}>Active notifications: {notificationCount}</Text>
          </View>
        )}

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Permissions</Text>
          <View style={styles.buttonGroup}>
            <Button title="Check Listener Permission" onPress={checkListenerPermission} />
            <Button title="Request Listener Permission" onPress={requestPermission} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Auto-Reply Control</Text>
          <View style={styles.buttonGroup}>
            <Button title="Check Status" onPress={checkAutoReplyStatus} />
            <Button title="Enable Auto-Reply" onPress={enableAutoReply} />
            <Button title="Disable Auto-Reply" onPress={disableAutoReply} />
            <Button title="Check Service Running" onPress={checkServiceStatus} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Reply Message</Text>
          <View style={styles.buttonGroup}>
            <Button title="Show Current Message" onPress={showCurrentMessage} />
            <Button title="Update Message" onPress={updateReplyMessage} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Allowed Apps</Text>
          <View style={styles.buttonGroup}>
            <Button title="Show Allowed Apps" onPress={showAllowedApps} />
            <Button title="Set WhatsApp Only" onPress={setWhatsAppOnly} />
            <Button title="Set Messaging Apps" onPress={setMessagingApps} />
            <Button title="Allow All Apps" onPress={allowAllApps} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            Test Notifications (Emulator)
          </Text>
          <Text style={{ fontSize: 12, color: t.secondaryText, marginBottom: 8 }}>
            ⚠️ Note: Test notifications won&apos;t trigger auto-reply (Android limitation). Use real
            messaging apps for full testing.
          </Text>
          <View style={styles.buttonGroup}>
            <Button title="Send Test Message" onPress={sendTestMessage} />
            <Button title="Send Multiple Test Messages" onPress={sendMultipleTests} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Notifications</Text>
          <View style={styles.buttonGroup}>
            <Button title="Show Active Notifications" onPress={showActiveNotifications} />
            <Button title="Show First Notification Details" onPress={showNotificationDetails} />
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: t.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Reply History</Text>
          <View style={styles.buttonGroup}>
            <Button title="View Reply History" onPress={viewReplyHistory} />
            <Button title="Clear History" onPress={clearHistory} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  titleContainer: {
    marginBottom: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
  },
  sectionContainer: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonGroup: {
    gap: 8,
  },
});
