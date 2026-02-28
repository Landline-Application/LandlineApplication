import React, { useCallback, useState } from 'react';

import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import NotificationApiManager from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postTime: number;
}

interface AppGroup {
  appName: string;
  packageName: string;
  count: number;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APP_COLORS: { pattern: RegExp; color: string }[] = [
  { pattern: /instagram/i, color: '#C13584' },
  { pattern: /message|sms|mms|messenger/i, color: '#3B82F6' },
  { pattern: /phone|dialer|missed.call/i, color: '#22C55E' },
  { pattern: /voicemail/i, color: '#F59E0B' },
  { pattern: /youtube/i, color: '#EF4444' },
  { pattern: /gmail|email|mail|outlook/i, color: '#EA4335' },
  { pattern: /whatsapp/i, color: '#25D366' },
  { pattern: /telegram/i, color: '#0088CC' },
  { pattern: /twitter|x\.com/i, color: '#1DA1F2' },
  { pattern: /facebook/i, color: '#1877F2' },
  { pattern: /snapchat/i, color: '#FFFC00' },
  { pattern: /tiktok/i, color: '#FF0050' },
];

const FALLBACK_COLORS = ['#8B5CF6', '#F97316', '#06B6D4', '#EC4899', '#84CC16', '#6366F1'];

function getAppColor(packageName: string): string {
  for (const { pattern, color } of APP_COLORS) {
    if (pattern.test(packageName)) return color;
  }
  const hash = packageName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function groupByApp(notifs: NotificationItem[]): AppGroup[] {
  const map = new Map<string, AppGroup>();
  for (const n of notifs) {
    const key = n.packageName || n.appName;
    if (!map.has(key)) {
      map.set(key, {
        appName: n.appName || n.packageName,
        packageName: n.packageName,
        count: 0,
        color: getAppColor(n.packageName || n.appName),
      });
    }
    map.get(key)!.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppRow({ group, onView }: { group: AppGroup; onView: () => void }) {
  return (
    <View style={styles.appRow}>
      <View style={[styles.appRowAccent, { backgroundColor: group.color }]} />
      <Text style={styles.appRowLabel}>
        {group.appName.toUpperCase()}{' '}
        <Text style={styles.appRowCount}>({group.count})</Text>
      </Text>
      <TouchableOpacity style={styles.viewButton} onPress={onView} activeOpacity={0.7}>
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LandlineScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    if (Platform.OS === 'android') {
      setHasPermission(NotificationApiManager.hasNotificationListenerPermission());
      setIsActive(NotificationApiManager.isLandlineModeActive());
      setNotifications(NotificationApiManager.getLoggedNotifications());
    }
  }, []);

  useFocusEffect(refresh);

  const handlePullRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleActivatePress = () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Notification Access permission is needed for Landline Mode to log notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: async () => {
              await NotificationApiManager.requestNotificationListenerPermission();
              setTimeout(refresh, 1000);
            },
          },
        ],
      );
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmActivate = () => {
    setShowConfirm(false);
    NotificationApiManager.setLandlineMode(true);
    setIsActive(true);
    refresh();
  };

  const handleDeactivate = () => {
    NotificationApiManager.setLandlineMode(false);
    setIsActive(false);
    refresh();
  };

  const handleClearLog = () => {
    Alert.alert('Clear Log', 'Clear all logged notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          NotificationApiManager.clearLoggedNotifications();
          setNotifications([]);
        },
      },
    ]);
  };

  const handleViewNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const appGroups = groupByApp(notifications);

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inactiveCenter}>
          <Text style={styles.inactiveTitle}>Landline</Text>
          <Text style={styles.inactiveSubtitle}>Android only</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {!isActive ? (
        // ── Inactive state ──────────────────────────────────────────────────
        <ScrollView
          contentContainerStyle={styles.inactiveScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor="#5B7FE8"
            />
          }
        >
          <View style={styles.inactiveWrapper}>
            <Text style={styles.inactiveTitle}>Landline</Text>

            <View style={styles.inactiveCenter}>
              <TouchableOpacity
                style={styles.activateButton}
                onPress={handleActivatePress}
                activeOpacity={0.85}
              >
                <Text style={styles.activateButtonText}>Activate</Text>
              </TouchableOpacity>
              <Text style={styles.inactiveSubtitle}>
                Disconnect from distractions.{'\n'}Only emergencies get through.
              </Text>
            </View>

            <View style={styles.recentSessions}>
              <Text style={styles.recentSessionsTitle}>Recent Sessions</Text>
              <Text style={styles.recentSessionsEmpty}>No recent sessions</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        // ── Active state ────────────────────────────────────────────────────
        <ScrollView
          style={styles.activeScroll}
          contentContainerStyle={styles.activeContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor="#5B7FE8"
            />
          }
        >
          <Text style={styles.activeTitle}>Landline Active</Text>

          {/* Total count card */}
          <View style={styles.countCard}>
            <Text style={styles.countLabel}>Notifications logged:</Text>
            <Text style={styles.countNumber}>{notifications.length}</Text>
          </View>

          {/* Per-app rows */}
          {appGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No notifications logged yet.</Text>
            </View>
          ) : (
            appGroups.map((group) => (
              <AppRow
                key={group.packageName || group.appName}
                group={group}
                onView={handleViewNotifications}
              />
            ))
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearLog}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>Clear Log</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={handleDeactivate}
              activeOpacity={0.85}
            >
              <Text style={styles.deactivateButtonText}>Deactivate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── Confirmation modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Activate Landline Mode?</Text>
            <Text style={styles.modalBody}>
              Notifications will be logged silently. Emergencies from selected contacts will break
              through.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonNo}
                onPress={() => setShowConfirm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonYes}
                onPress={handleConfirmActivate}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonYesText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = '#0a0a0a';
const CARD_BG = '#1c1c1c';
const BORDER = '#2a2a2a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#888888';
const ACCENT_BLUE = '#5B7FE8';
const DEACTIVATE_RED = '#E85D5D';
const MODAL_BLUE = '#1E4D8C';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Inactive ──────────────────────────────────────────────────────────────
  inactiveScrollContent: {
    flexGrow: 1,
  },
  inactiveWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inactiveTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.5,
  },
  inactiveCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  activateButton: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: ACCENT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inactiveSubtitle: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 23,
  },
  recentSessions: {
    paddingBottom: 28,
    gap: 8,
  },
  recentSessionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  recentSessionsEmpty: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  // ── Active ────────────────────────────────────────────────────────────────
  activeScroll: {
    flex: 1,
  },
  activeContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    paddingVertical: 24,
    letterSpacing: 0.3,
  },
  countCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  countNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: ACCENT_BLUE,
    lineHeight: 48,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    paddingRight: 16,
    minHeight: 56,
  },
  appRowAccent: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 16,
  },
  appRowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  appRowCount: {
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  viewButton: {
    borderWidth: 1,
    borderColor: TEXT_SECONDARY,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  viewButtonText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  deactivateButton: {
    flex: 1.4,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: DEACTIVATE_RED,
    alignItems: 'center',
    shadowColor: DEACTIVATE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  deactivateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Confirmation modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(80,80,80,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#d8d8d8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: MODAL_BLUE,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MODAL_BLUE,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalBody: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonNo: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    alignItems: 'center',
    backgroundColor: '#c8c8c8',
  },
  modalButtonNoText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  modalButtonYes: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: MODAL_BLUE,
    alignItems: 'center',
  },
  modalButtonYesText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
