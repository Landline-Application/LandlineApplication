import React, { useState } from 'react';

import {
  Alert,
  Button,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { COLORS } from '@/constants/theme';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { isListenerEnabled, isServiceRunning } from '@/modules/auto-reply-manager';
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

  const {
    isEnabled: autoReplyEnabled,
    hasPermission: autoReplyPermission,
    message: autoReplyMessage,
    enable: enableAutoReply,
    disable: disableAutoReply,
    setMessage: setAutoReplyMessage,
    setAllowedApps: setAutoReplyAllowedApps,
    requestPermission: requestAutoReplyPermission,
    checkStatus: checkAutoReplyStatus,
  } = useAutoReplyStore();

  const [notifCount, setNotifCount] = useState(0);
  const [dndStatus, setDndStatus] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const refreshStatus = async () => {
    if (Platform.OS !== 'android') return;

    await checkStatus();
    checkAutoReplyStatus();

    const state = getCurrentState();
    setDndStatus(`State: ${state.message}`);

    try {
      const notifs = await NotificationApiManager.getLoggedNotifications();
      setNotifCount(notifs.length);
    } catch {
      setNotifCount(0);
    }
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.dark.border,
          backgroundColor: COLORS.dark.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 8, paddingRight: 12 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.dark.primary }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: '700',
            textAlign: 'center',
            color: COLORS.dark.text.primary,
          }}
        >
          Debug Tools
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 40,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: COLORS.dark.background }}
      >
        <View style={{ paddingHorizontal: 20, gap: 4 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: COLORS.dark.text.primary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Debug Tools
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.dark.text.secondary }}>
            Testing & System Information
          </Text>
        </View>

        {/* System Status */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            📱 System Status
          </Text>

          <View style={{ gap: 8 }}>
            <Button title="Refresh Status" onPress={refreshStatus} color={COLORS.dark.primary} />
          </View>
        </View>

        {/* Notification System */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            🔔 Notification System
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Permission:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: NotificationApiManager.hasPostPermission()
                  ? COLORS.dark.success
                  : COLORS.dark.text.muted,
              }}
            >
              {NotificationApiManager.hasPostPermission() ? 'Granted' : 'Denied'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Logged Notifications:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.dark.text.muted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {notifCount}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
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

        {/* Landline Mode */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            📞 Landline Mode
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Landline Mode:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: landlineActive ? COLORS.dark.success : COLORS.dark.text.muted,
              }}
            >
              {landlineActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Logged Notifications:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.dark.text.muted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {notifications.length}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {!landlinePermission && (
              <Button
                title="Request Permission"
                onPress={async () => {
                  try {
                    await requestLandlinePermission();
                    Alert.alert('Permission', 'Please enable notification access in settings');
                    setTimeout(() => checkStatus(), 1500);
                  } catch {
                    Alert.alert('Error', 'Could not open settings');
                  }
                }}
                color={COLORS.dark.warning}
              />
            )}
            <Button
              key={`landline-${landlineActive}`}
              title={landlineActive ? 'Deactivate Landline Mode' : 'Activate Landline Mode'}
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

        {/* Do Not Disturb */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            🚫 Do Not Disturb
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              DND Permission:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: hasDNDPermission() ? COLORS.dark.success : COLORS.dark.text.muted,
              }}
            >
              {hasDNDPermission() ? 'Granted' : 'Denied'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              DND Status:
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.dark.text.muted }}>
              {dndStatus}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {!hasDNDPermission() && (
              <Button
                title="Request DND Permission"
                onPress={async () => {
                  const granted = await requestDNDPermission();
                  Alert.alert(
                    'DND Permission',
                    granted ? 'Granted!' : 'Denied - Please enable in settings',
                  );
                  await refreshStatus();
                }}
                color={COLORS.dark.warning}
              />
            )}
            <Button
              key={`dnd-${dndStatus}`}
              title={dndStatus.includes('NONE') ? 'Enable DND (All)' : 'Set Priority Mode'}
              onPress={async () => {
                if (!hasDNDPermission()) {
                  Alert.alert('Permission Required', 'Please grant DND permission first');
                  return;
                }

                if (dndStatus.includes('NONE')) {
                  const result = await setDNDEnabled(true);
                  Alert.alert('DND', result.success ? 'DND enabled (All)' : result.message);
                } else {
                  const constants = getInterruptionFilterConstants();
                  const result = await setInterruptionFilter(constants.PRIORITY);
                  Alert.alert('DND', result.success ? 'Set to Priority mode' : result.message);
                }
                setTimeout(() => refreshStatus(), 500);
              }}
              color={dndStatus.includes('NONE') ? COLORS.dark.success : COLORS.dark.primary}
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

        {/* Auto-Reply */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            💬 Auto-Reply
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Auto-Reply Status:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: autoReplyEnabled ? COLORS.dark.success : COLORS.dark.text.muted,
              }}
            >
              {autoReplyEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Service Running:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isServiceRunning() ? COLORS.dark.success : COLORS.dark.text.muted,
              }}
            >
              {isServiceRunning() ? 'Running' : 'Stopped'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dark.divider,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, flex: 1 }}>
              Listener Permission:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isListenerEnabled() ? COLORS.dark.success : COLORS.dark.text.muted,
              }}
            >
              {isListenerEnabled() ? 'Granted' : 'Denied'}
            </Text>
          </View>

          {autoReplyMessage && (
            <View
              style={{
                backgroundColor: COLORS.dark.card,
                padding: 12,
                borderRadius: 8,
                borderCurve: 'continuous',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.dark.text.secondary,
                  fontWeight: '600',
                  marginBottom: 4,
                }}
              >
                Current Message:
              </Text>
              <Text
                selectable
                style={{ fontSize: 14, color: COLORS.dark.text.primary, lineHeight: 20 }}
              >
                {autoReplyMessage}
              </Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
            {!autoReplyPermission && (
              <Button
                title="Request Permission"
                onPress={async () => {
                  try {
                    await requestAutoReplyPermission();
                    Alert.alert('Permission', 'Please enable notification access in settings');
                    setTimeout(() => refreshStatus(), 1500);
                  } catch {
                    Alert.alert('Error', 'Could not open settings');
                  }
                }}
                color={COLORS.dark.warning}
              />
            )}

            <Button
              key={`auto-reply-${autoReplyEnabled}`}
              title={autoReplyEnabled ? 'Disable Auto-Reply' : 'Enable Auto-Reply'}
              onPress={async () => {
                if (!autoReplyPermission) {
                  Alert.alert(
                    'Permission Required',
                    'Please grant notification listener permission',
                  );
                  return;
                }
                try {
                  if (autoReplyEnabled) {
                    await disableAutoReply();
                    Alert.alert('Auto-Reply', 'Auto-reply disabled');
                  } else {
                    await enableAutoReply();
                    Alert.alert('Auto-Reply', 'Auto-reply enabled');
                  }
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not toggle auto-reply');
                }
              }}
              color={autoReplyEnabled ? COLORS.dark.error : COLORS.dark.success}
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.dark.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 8,
              }}
            >
              Quick Templates:
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.dark.text.muted, marginBottom: 4 }}>
              Tap a template to load it into the editor
            </Text>

            <Button
              title="In a Meeting"
              onPress={async () => {
                try {
                  await setAutoReplyMessage(
                    "I'm currently in a meeting. I'll get back to you as soon as possible.",
                  );
                  Alert.alert('Template Set', 'Meeting auto-reply message activated');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="On Vacation"
              onPress={async () => {
                try {
                  await setAutoReplyMessage(
                    "I'm currently out of office on vacation. I'll respond when I return. Thank you for your patience!",
                  );
                  Alert.alert('Template Set', 'Vacation auto-reply message activated');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="Driving"
              onPress={async () => {
                try {
                  await setAutoReplyMessage(
                    "I'm driving right now and can't respond. I'll reply when I arrive safely.",
                  );
                  Alert.alert('Template Set', 'Driving auto-reply message activated');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="Focus Time"
              onPress={async () => {
                try {
                  await setAutoReplyMessage(
                    "I'm in focus mode and not checking messages right now. I'll get back to you later today.",
                  );
                  Alert.alert('Template Set', 'Focus time auto-reply message activated');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="Away"
              onPress={async () => {
                try {
                  await setAutoReplyMessage(
                    "I'm away from my phone right now. I'll get back to you shortly.",
                  );
                  Alert.alert('Template Set', 'Away auto-reply message activated');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.dark.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 8,
              }}
            >
              Custom Message:
            </Text>

            <TextInput
              style={{
                backgroundColor: COLORS.dark.card,
                borderWidth: 1,
                borderColor: COLORS.dark.border,
                borderRadius: 8,
                padding: 12,
                color: COLORS.dark.text.primary,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: 'top',
                borderCurve: 'continuous',
              }}
              placeholder="Enter custom auto-reply message..."
              placeholderTextColor={COLORS.dark.text.muted}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
            />

            <Button
              title="Set Custom Message"
              onPress={async () => {
                if (!customMessage.trim()) {
                  Alert.alert('Empty Message', 'Please enter a message');
                  return;
                }
                try {
                  await setAutoReplyMessage(customMessage.trim());
                  Alert.alert('Message Updated', 'Custom message set');
                  setCustomMessage('');
                  await refreshStatus();
                } catch {
                  Alert.alert('Error', 'Could not update message');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.dark.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 8,
              }}
            >
              Reply to Apps:
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.dark.text.muted, marginBottom: 4 }}>
              Choose which apps trigger an auto-reply
            </Text>

            <Button
              title="All Apps"
              onPress={async () => {
                try {
                  await setAutoReplyAllowedApps([]);
                  Alert.alert('Apps Updated', 'Now replying to any app with a reply action');
                } catch {
                  Alert.alert('Error', 'Could not update allowed apps');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="Messaging Only"
              onPress={async () => {
                try {
                  await setAutoReplyAllowedApps([
                    'com.whatsapp',
                    'com.facebook.orca',
                    'org.telegram.messenger',
                    'com.google.android.apps.messaging',
                  ]);
                  Alert.alert('Apps Updated', 'Replying to WhatsApp, Messenger, Telegram, SMS');
                } catch {
                  Alert.alert('Error', 'Could not update allowed apps');
                }
              }}
              color={COLORS.dark.primary}
            />

            <Button
              title="WhatsApp Only"
              onPress={async () => {
                try {
                  await setAutoReplyAllowedApps(['com.whatsapp']);
                  Alert.alert('Apps Updated', 'Only replying to WhatsApp messages');
                } catch {
                  Alert.alert('Error', 'Could not update allowed apps');
                }
              }}
              color={COLORS.dark.primary}
            />
          </View>
        </View>

        {/* Home Screen Widget */}
        <View
          style={{
            backgroundColor: COLORS.dark.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.dark.border,
            borderCurve: 'continuous',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark.text.primary }}>
            🏠 Home Screen Widget
          </Text>

          <View
            style={{
              backgroundColor: COLORS.dark.card,
              padding: 12,
              borderRadius: 8,
              borderCurve: 'continuous',
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.dark.text.secondary, lineHeight: 18 }}>
              Widget provides quick access to Landline mode from your home screen and quick settings
              panel.
            </Text>
          </View>

          <View style={{ gap: 8 }}>
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
      </ScrollView>
    </>
  );
}
