import React, { useState } from 'react';

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
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
import { haptics } from '@/services/haptics';
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
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Debug Tools
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Debug Tools</Text>
          <Text style={styles.heroSubtitle}>Testing and system information</Text>
        </View>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.buttonStack}>
            <Button label="Refresh status" onPress={refreshStatus} variant="primary" fullWidth />
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Notification system</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Permission</Text>
            <Text
              style={[
                styles.statValue,
                NotificationApiManager.hasPostPermission() ? styles.statValueSuccess : null,
              ]}
            >
              {NotificationApiManager.hasPostPermission() ? 'Granted' : 'Denied'}
            </Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>Logged notifications</Text>
            <Text style={[styles.statValue, styles.tabular]}>{notifCount}</Text>
          </View>
          <View style={styles.buttonStack}>
            <Button
              label="Request permission"
              onPress={async () => {
                const granted = await NotificationApiManager.requestPostPermission();
                Alert.alert('Permission', granted ? 'Granted!' : 'Denied');
                refreshStatus();
              }}
              variant="primary"
              fullWidth
            />
            <Button
              label="Send test notification"
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
              variant="primary"
              fullWidth
            />
            <Button
              label="Refresh logs"
              onPress={async () => {
                try {
                  const notifs = await NotificationApiManager.getLoggedNotifications();
                  setNotifCount(notifs.length);
                  Alert.alert('Logs', `Found ${notifs.length} notifications`);
                } catch (error) {
                  Alert.alert('Error', `Failed to get logs: ${error}`);
                }
              }}
              variant="primary"
              fullWidth
            />
            <Button
              label="Clear all logs"
              onPress={() => {
                Alert.alert('Clear Logs', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      const success = await NotificationApiManager.clearLoggedNotifications();
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
              variant="danger"
              fullWidth
            />
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Landline Mode</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Landline Mode</Text>
            <Text style={[styles.statValue, landlineActive ? styles.statValueSuccess : null]}>
              {landlineActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>Logged notifications</Text>
            <Text style={[styles.statValue, styles.tabular]}>{notifications.length}</Text>
          </View>
          <View style={styles.buttonStack}>
            {!landlinePermission && (
              <Button
                label="Request permission"
                onPress={async () => {
                  try {
                    await requestLandlinePermission();
                    Alert.alert('Permission', 'Please enable notification access in settings');
                    setTimeout(() => checkStatus(), 1500);
                  } catch {
                    Alert.alert('Error', 'Could not open settings');
                  }
                }}
                variant="secondary"
                fullWidth
              />
            )}
            <Button
              key={`landline-${landlineActive}`}
              label={landlineActive ? 'Deactivate Landline Mode' : 'Activate Landline Mode'}
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
              variant={landlineActive ? 'danger' : 'primary'}
              fullWidth
            />
            <Button
              label="Refresh logs"
              onPress={async () => {
                await refreshNotifications();
                Alert.alert('Refreshed', `Found ${notifications.length} notifications`);
              }}
              variant="primary"
              fullWidth
            />
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Do Not Disturb</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>DND permission</Text>
            <Text style={[styles.statValue, hasDNDPermission() ? styles.statValueSuccess : null]}>
              {hasDNDPermission() ? 'Granted' : 'Denied'}
            </Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>DND status</Text>
            <Text style={[styles.statValue, styles.statValueWrap]} numberOfLines={3}>
              {dndStatus || '—'}
            </Text>
          </View>
          <View style={styles.buttonStack}>
            {!hasDNDPermission() && (
              <Button
                label="Request DND permission"
                onPress={async () => {
                  const granted = await requestDNDPermission();
                  Alert.alert(
                    'DND Permission',
                    granted ? 'Granted!' : 'Denied - Please enable in settings',
                  );
                  await refreshStatus();
                }}
                variant="secondary"
                fullWidth
              />
            )}
            <Button
              key={`dnd-${dndStatus}`}
              label={dndStatus.includes('NONE') ? 'Enable DND (All)' : 'Set priority mode'}
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
              variant="primary"
              fullWidth
            />
            <Button
              label="Disable DND"
              onPress={async () => {
                const result = await setDNDEnabled(false);
                Alert.alert('DND', JSON.stringify(result, null, 2));
                setTimeout(() => refreshStatus(), 500);
              }}
              variant="ghost"
              fullWidth
            />
            <Button
              label="Get installed apps"
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
              variant="primary"
              fullWidth
            />
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Auto-Reply</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Auto-Reply status</Text>
            <Text style={[styles.statValue, autoReplyEnabled ? styles.statValueSuccess : null]}>
              {autoReplyEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Service running</Text>
            <Text style={[styles.statValue, isServiceRunning() ? styles.statValueSuccess : null]}>
              {isServiceRunning() ? 'Running' : 'Stopped'}
            </Text>
          </View>
          <View style={[styles.statRow, styles.statRowLast]}>
            <Text style={styles.statLabel}>Listener permission</Text>
            <Text style={[styles.statValue, isListenerEnabled() ? styles.statValueSuccess : null]}>
              {isListenerEnabled() ? 'Granted' : 'Denied'}
            </Text>
          </View>
          {autoReplyMessage && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteLabel}>Current message</Text>
              <Text selectable style={styles.quoteBody}>
                {autoReplyMessage}
              </Text>
            </View>
          )}
          <View style={styles.buttonStack}>
            {!autoReplyPermission && (
              <Button
                label="Request permission"
                onPress={async () => {
                  try {
                    await requestAutoReplyPermission();
                    Alert.alert('Permission', 'Please enable notification access in settings');
                    setTimeout(() => refreshStatus(), 1500);
                  } catch {
                    Alert.alert('Error', 'Could not open settings');
                  }
                }}
                variant="secondary"
                fullWidth
              />
            )}
            <Button
              key={`auto-reply-${autoReplyEnabled}`}
              label={autoReplyEnabled ? 'Disable Auto-Reply' : 'Enable Auto-Reply'}
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
              variant={autoReplyEnabled ? 'danger' : 'primary'}
              fullWidth
            />
            <Text style={styles.subheading}>Quick templates</Text>
            <Text style={styles.hint}>Tap a template to load it into the editor</Text>
            <Button
              label="In a meeting"
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
              variant="ghost"
              fullWidth
            />
            <Button
              label="On vacation"
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
              variant="ghost"
              fullWidth
            />
            <Button
              label="Driving"
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
              variant="ghost"
              fullWidth
            />
            <Button
              label="Focus time"
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
              variant="ghost"
              fullWidth
            />
            <Button
              label="Away"
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
              variant="ghost"
              fullWidth
            />
            <Text style={styles.subheading}>Custom message</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter custom auto-reply message..."
              placeholderTextColor={COLORS.text.muted}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
            />
            <Button
              label="Set custom message"
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
              variant="primary"
              fullWidth
            />
            <Text style={styles.subheading}>Reply to apps</Text>
            <Text style={styles.hint}>Choose which apps trigger an auto-reply</Text>
            <Button
              label="All apps"
              onPress={async () => {
                try {
                  await setAutoReplyAllowedApps([]);
                  Alert.alert('Apps Updated', 'Now replying to any app with a reply action');
                } catch {
                  Alert.alert('Error', 'Could not update allowed apps');
                }
              }}
              variant="primary"
              fullWidth
            />
            <Button
              label="Messaging only"
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
              variant="primary"
              fullWidth
            />
            <Button
              label="WhatsApp only"
              onPress={async () => {
                try {
                  await setAutoReplyAllowedApps(['com.whatsapp']);
                  Alert.alert('Apps Updated', 'Only replying to WhatsApp messages');
                } catch {
                  Alert.alert('Error', 'Could not update allowed apps');
                }
              }}
              variant="primary"
              fullWidth
            />
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Home screen widget</Text>
          <View style={styles.infoCallout}>
            <Text style={styles.bodyMuted}>
              Widget provides quick access to Landline mode from your home screen and quick settings
              panel.
            </Text>
          </View>
          <View style={styles.buttonStack}>
            <Button
              label="Widget instructions"
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
              variant="primary"
              fullWidth
            />
            <Button
              label="Quick Settings tile instructions"
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
              variant="primary"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.jumbo,
    gap: Spacing.lg,
  },
  hero: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  heroTitle: {
    fontSize: 28,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },
  sectionCard: {
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    marginBottom: Spacing.sm,
  },
  statRowLast: {
    marginBottom: Spacing.md,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  statValue: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
  statValueSuccess: {
    color: COLORS.success,
  },
  statValueWrap: {
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  buttonStack: {
    gap: Spacing.sm,
  },
  subheading: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.text.muted,
    marginBottom: Spacing.sm,
  },
  bodyMuted: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  quoteBox: {
    backgroundColor: COLORS.surface.card,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginBottom: Spacing.md,
  },
  quoteLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.text.secondary,
    marginBottom: Spacing.xs,
  },
  quoteBody: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.foreground,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: COLORS.surface.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: COLORS.foreground,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCallout: {
    backgroundColor: COLORS.surface.card,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginBottom: Spacing.md,
  },
});
