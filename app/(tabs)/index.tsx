import { LandlineColors } from '@/constants/theme';
import NotificationApiManager from '@/modules/notification-api-manager';
import * as BackgroundServiceManager from '@/modules/background-service-manager';
import * as DndManager from '@/modules/dnd-manager';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface NotificationSummary {
  total: number;
  apps: number;
  messages: number;
  calls: number;
}

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
  }, []);

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
        ])
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
          setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
        [{ text: 'OK', onPress: () => setTimeout(checkPermission, 2000) }]
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
        ]
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
          'Your notifications are being captured'
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
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
        <Animated.View 
          style={[
            styles.toggleContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Animated.View 
            style={[
              styles.glowEffect,
              { backgroundColor: glowColor },
            ]} 
          />
          
          <Pressable
            onPress={isActive ? handleDeactivate : handleActivate}
            style={({ pressed }) => [
              styles.mainToggle,
              isActive && styles.mainToggleActive,
              pressed && styles.mainTogglePressed,
            ]}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Text style={styles.toggleIcon}>
                {isActive ? '🔕' : '📱'}
              </Text>
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
              <Text style={styles.sessionLabel}>Captured</Text>
              <Text style={styles.sessionValue}>{summary.total}</Text>
            </View>
          </View>
        )}

        {/* Permission Warning */}
        {!hasPermission && (
          <TouchableOpacity 
            style={styles.warningCard}
            onPress={handleRequestPermission}
          >
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Permission Required</Text>
              <Text style={styles.warningText}>
                Tap to grant notification access
              </Text>
            </View>
            <Text style={styles.warningArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Notification Summary (when has notifications) */}
        {(isActive || notifications.length > 0) && (
          <TouchableOpacity 
            style={styles.notificationCard}
            onPress={handleViewNotifications}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationIcon}>📬</Text>
              <Text style={styles.notificationTitle}>Notifications</Text>
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
            <Text style={styles.viewAllText}>View all notifications →</Text>
          </TouchableOpacity>
        )}

        {/* Quick Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔔</Text>
            <Text style={styles.infoText}>Notifications silently captured</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🤫</Text>
            <Text style={styles.infoText}>Phone stays silent</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚨</Text>
            <Text style={styles.infoText}>Emergency contacts can reach you</Text>
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
              You'll start receiving notifications normally again.
              {summary.total > 0 && `\n\nYou captured ${summary.total} notification${summary.total !== 1 ? 's' : ''}.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDeactivate]}
                onPress={confirmDeactivation}
              >
                <Text style={styles.modalButtonConfirmText}>End</Text>
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
    backgroundColor: LandlineColors.dark.background,
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
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: LandlineColors.dark.textSecondary,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
  },
  mainToggle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: LandlineColors.dark.surface,
    borderWidth: 3,
    borderColor: LandlineColors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainToggleActive: {
    backgroundColor: LandlineColors.dark.primary + '20',
    borderColor: LandlineColors.dark.primary,
  },
  mainTogglePressed: {
    opacity: 0.9,
  },
  toggleIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  toggleStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LandlineColors.dark.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  toggleStatusActive: {
    color: LandlineColors.dark.primary,
  },
  toggleHint: {
    fontSize: 11,
    color: LandlineColors.dark.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  sessionInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  sessionLabel: {
    fontSize: 11,
    color: LandlineColors.dark.textMuted,
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LandlineColors.dark.primary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.warning + '40',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: LandlineColors.dark.textSecondary,
  },
  warningArrow: {
    fontSize: 18,
    color: LandlineColors.dark.warning,
    fontWeight: 'bold',
  },
  notificationCard: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  notificationBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LandlineColors.dark.divider,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
  },
  breakdownLabel: {
    fontSize: 11,
    color: LandlineColors.dark.textMuted,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: LandlineColors.dark.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 26,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
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
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: LandlineColors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: LandlineColors.dark.surface,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  modalButtonConfirm: {
    backgroundColor: LandlineColors.dark.primary,
  },
  modalButtonDeactivate: {
    backgroundColor: LandlineColors.dark.warning,
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
