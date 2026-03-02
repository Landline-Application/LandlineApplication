import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { COLORS } from '@/constants/colors';
import * as BackgroundServiceManager from '@/modules/background-service-manager';
import * as DndManager from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface NotificationSummary {
  total: number;
  apps: number;
  messages: number;
  calls: number;
}

// Redirect to landline screen as the main entry point
export default function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('0:00');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Check permissions and status on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      checkPermission();
      checkLandlineMode();
      loadNotifications();
    }
  }, [checkLandlineMode, checkPermission, loadNotifications]);

  // Pulse animation when active
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      // Glow animation
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive, pulseAnim, glowAnim]);

  // Timer for session duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        if (hours > 0) {
          setElapsedTime(
            `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          );
        } else {
          setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionStartTime]);

  const checkPermission = useCallback(() => {
    try {
      const granted = NotificationApiManager.hasNotificationListenerPermission();
      setHasPermission(granted);
    } catch {
      setHasPermission(false);
    }
  }, []);

  const checkLandlineMode = useCallback(() => {
    try {
      const active = NotificationApiManager.isLandlineModeActive();
      setIsActive(active);
      if (active) {
        setSessionStartTime(new Date());
      }
    } catch {
      setIsActive(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const logs = await NotificationApiManager.getLoggedNotifications();
      setNotifications(Array.isArray(logs) ? logs : []);
    } catch {
      setNotifications([]);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      await NotificationApiManager.requestNotificationListenerPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for Landline in your device settings, then return to the app.',
        [{ text: 'OK', onPress: () => setTimeout(checkPermission, 2000) }],
      );
    } catch {
      Alert.alert('Error', 'Could not open permission settings.');
    }
  };

  const handleActivate = () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Landline needs notification access to work. Would you like to grant permission?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: handleRequestPermission },
        ],
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmActivation = async () => {
    setShowConfirmModal(false);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Activate Landline Mode
      NotificationApiManager.setLandlineMode(true);

      // Try to enable DND
      try {
        if (DndManager.hasPermission()) {
          await DndManager.setDNDEnabled(true);
        }
      } catch {
        // DND not available, continue anyway
      }

      // Start foreground service for reliability
      try {
        BackgroundServiceManager.startForegroundService(
          'Landline Mode Active',
          'Your notifications are being captured',
        );
      } catch {
        // Service not available, continue anyway
      }

      setIsActive(true);
      setSessionStartTime(new Date());
      setElapsedTime('0:00');
    } catch {
      Alert.alert('Error', 'Could not activate Landline Mode. Please try again.');
    }
  };

  const handleDeactivate = () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivation = async () => {
    setShowDeactivateModal(false);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    try {
      // Deactivate Landline Mode
      NotificationApiManager.setLandlineMode(false);

      // Disable DND
      try {
        if (DndManager.hasPermission()) {
          await DndManager.setDNDEnabled(false);
        }
      } catch {
        // Continue anyway
      }

      // Stop foreground service
      try {
        BackgroundServiceManager.stopForegroundService();
      } catch {
        // Continue anyway
      }

      setIsActive(false);

      // Refresh notifications
      await loadNotifications();
    } catch {
      Alert.alert('Error', 'Could not deactivate Landline Mode. Please try again.');
    }
  };

  const handleViewNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const getNotificationSummary = (): NotificationSummary => {
    const summary = { total: notifications.length, apps: 0, messages: 0, calls: 0 };
    notifications.forEach((n) => {
      if (n.category === 'message' || n.appName?.toLowerCase().includes('message')) {
        summary.messages++;
      } else if (n.category === 'call' || n.appName?.toLowerCase().includes('phone')) {
        summary.calls++;
      } else {
        summary.apps++;
      }
    });
    return summary;
  };

  const summary = getNotificationSummary();

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(37, 99, 235, 0)', 'rgba(37, 99, 235, 0.3)'],
  });

  // Web fallback with mock UI
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Landline Mode</Text>
            <Text style={styles.headerSubtitle}>Take a break from notifications</Text>
          </View>

          <View style={styles.toggleContainer}>
            <Pressable
              onPress={() => setIsActive(!isActive)}
              style={[styles.mainToggle, isActive && styles.mainToggleActive]}
            >
              <Text style={styles.toggleIcon}>{isActive ? '🔕' : '📱'}</Text>
              <Text style={[styles.toggleStatus, isActive && styles.toggleStatusActive]}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
              <Text style={styles.toggleHint}>
                {isActive ? 'Tap to deactivate' : 'Tap to activate'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Web Preview Mode</Text>
            <Text style={styles.infoText}>
              Full Landline Mode functionality is available on Android devices.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Landline Mode</Text>
          <Text style={styles.headerSubtitle}>
            {isActive ? 'Your digital peace is active' : 'Take a break from notifications'}
          </Text>
        </View>

        {/* Main Toggle Area */}
        <Animated.View style={[styles.toggleContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.glowEffect, { backgroundColor: glowColor }]} />

          <Pressable
            onPress={isActive ? handleDeactivate : handleActivate}
            style={({ pressed }) => [
              styles.mainToggle,
              isActive && styles.mainToggleActive,
              pressed && styles.mainTogglePressed,
            ]}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Text style={styles.toggleIcon}>{isActive ? '🔕' : '📱'}</Text>
              <Text style={[styles.toggleStatus, isActive && styles.toggleStatusActive]}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
              <Text style={styles.toggleHint}>
                {isActive ? 'Tap to deactivate' : 'Tap to activate'}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Session Info (when active) */}
        {isActive && (
          <View style={styles.sessionInfo}>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Session Duration</Text>
              <Text style={styles.sessionValue}>{elapsedTime}</Text>
            </View>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Notifications Captured</Text>
              <Text style={styles.sessionValue}>{summary.total}</Text>
            </View>
          </View>
        )}

        {/* Status Cards */}
        <View style={styles.statusSection}>
          {/* Permission Status */}
          <View style={[styles.statusCard, !hasPermission && styles.statusCardWarning]}>
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardIcon}>{hasPermission ? '✓' : '!'}</Text>
              <Text style={styles.statusCardTitle}>Notification Access</Text>
            </View>
            <Text style={styles.statusCardText}>
              {hasPermission ? 'Landline can capture notifications' : 'Required for Landline Mode'}
            </Text>
            {!hasPermission && (
              <TouchableOpacity style={styles.statusCardButton} onPress={handleRequestPermission}>
                <Text style={styles.statusCardButtonText}>Grant Access</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification Summary (when active or has notifications) */}
          {(isActive || notifications.length > 0) && (
            <TouchableOpacity style={styles.statusCard} onPress={handleViewNotifications}>
              <View style={styles.statusCardHeader}>
                <Text style={styles.statusCardIcon}>📬</Text>
                <Text style={styles.statusCardTitle}>Captured Notifications</Text>
              </View>
              <View style={styles.notificationBreakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownValue}>{summary.messages}</Text>
                  <Text style={styles.breakdownLabel}>Messages</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownValue}>{summary.calls}</Text>
                  <Text style={styles.breakdownLabel}>Calls</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownValue}>{summary.apps}</Text>
                  <Text style={styles.breakdownLabel}>Apps</Text>
                </View>
              </View>
              <Text style={styles.viewAllText}>Tap to view all →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Sessions Section */}
        <View style={styles.recentSessionsSection}>
          <Text style={styles.recentSessionsTitle}>Recent Sessions</Text>
          <Text style={styles.recentSessionsPlaceholder}>No recent sessions</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔔</Text>
            <Text style={styles.infoText}>Notifications are silently captured and logged</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🤫</Text>
            <Text style={styles.infoText}>Your phone stays silent - no sounds or vibrations</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📋</Text>
            <Text style={styles.infoText}>Review all notifications later at your convenience</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚨</Text>
            <Text style={styles.infoText}>Emergency contacts can still reach you</Text>
          </View>
        </View>
      </ScrollView>

      {/* Activation Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🔕</Text>
            <Text style={styles.modalTitle}>Activate Landline Mode?</Text>
            <Text style={styles.modalText}>
              Your phone will go silent and all notifications will be captured for later review.
              {'\n\n'}
              You can deactivate at any time.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmActivation}
              >
                <Text style={styles.modalButtonConfirmText}>Activate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deactivation Confirmation Modal */}
      <Modal
        visible={showDeactivateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>📱</Text>
            <Text style={styles.modalTitle}>End Landline Mode?</Text>
            <Text style={styles.modalText}>
              You&apos;ll start receiving notifications normally again.
              {'\n\n'}
              You captured {summary.total} notification{summary.total !== 1 ? 's' : ''} during this
              session.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Stay in Landline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDeactivate]}
                onPress={confirmDeactivation}
              >
                <Text style={styles.modalButtonConfirmText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
  },
  mainToggle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 3,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainToggleActive: {
    backgroundColor: COLORS.dark.primary + '20',
    borderColor: COLORS.dark.primary,
  },
  mainTogglePressed: {
    opacity: 0.9,
  },
  toggleIcon: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 8,
  },
  toggleStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  toggleStatusActive: {
    color: COLORS.dark.primary,
  },
  toggleHint: {
    fontSize: 12,
    color: COLORS.dark.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  sessionInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: COLORS.dark.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  sessionLabel: {
    fontSize: 12,
    color: COLORS.dark.textMuted,
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark.primary,
  },
  statusSection: {
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  statusCardWarning: {
    borderColor: COLORS.dark.warning,
    backgroundColor: COLORS.dark.warning + '10',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCardIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  statusCardText: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    marginLeft: 34,
  },
  statusCardButton: {
    backgroundColor: COLORS.dark.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginLeft: 34,
    alignSelf: 'flex-start',
  },
  statusCardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.divider,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark.text,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.dark.textMuted,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.dark.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  recentSessionsSection: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    marginBottom: 24,
  },
  recentSessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.text,
    marginBottom: 12,
  },
  recentSessionsPlaceholder: {
    fontSize: 14,
    color: COLORS.dark.textMuted,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    lineHeight: 20,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.dark.primary,
  },
  modalButtonDeactivate: {
    backgroundColor: COLORS.dark.warning,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.textSecondary,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
