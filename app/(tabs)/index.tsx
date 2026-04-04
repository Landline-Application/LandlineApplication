import React, { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Card } from '@/components/core/card';
import { RotaryDialButton } from '@/components/core/rotary-dial-button';
import { SessionCard } from '@/components/core/session-card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useActiveRefresh } from '@/hooks/use-active-refresh';
import { SessionMode, useLandlineStore } from '@/hooks/use-landline-store';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Format duration in human-readable format
const formatDuration = (diffSeconds: number): string => {
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = Math.floor(diffSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

interface NotificationSummary {
  total: number;
  apps: number;
  messages: number;
  calls: number;
}

// Redirect to landline screen as the main entry point
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  // Get state from Zustand store (FIXED: no broken dependencies)
  const {
    isActive,
    hasPermission,
    notifications,
    sessionStartTime,
    sessionMode,
    sessionEndTime,
    activateLandlineMode,
    deactivateLandlineMode,
    requestPermission,
    checkStatus,
    refreshNotifications,
  } = useLandlineStore();

  // Component-specific UI state (keep these)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SessionMode>('indefinite');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [timeDisplay, setTimeDisplay] = useState('0:00');
  const alertShownRef = useRef(false);

  // Initialize store on mount (FIXED: no broken dependencies)
  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enable fast refresh (3s) when viewing this screen and Landline Mode is active
  useActiveRefresh(refreshNotifications, isActive);

  // Reset alert flag when session starts
  useEffect(() => {
    if (isActive) {
      alertShownRef.current = false;
    }
  }, [isActive]);

  // Timer for session duration / countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        if (sessionMode === 'timer' && sessionEndTime) {
          // Countdown mode
          const remaining = Math.max(
            0,
            Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000),
          );
          setTimeDisplay(formatDuration(remaining));
          if (remaining === 0 && !alertShownRef.current) {
            // Timer complete - could auto-deactivate here
            alertShownRef.current = true;
            clearInterval(interval);
            Alert.alert(
              'Focus Time Complete',
              'Your Landline session has ended. You can stay in Landline mode or deactivate now.',
              [
                {
                  text: 'Stay Active',
                  style: 'cancel',
                  onPress: () => {
                    // Switch to indefinite mode to keep session alive (count-up from now)
                    activateLandlineMode('indefinite');
                  },
                },
                { text: 'Deactivate', onPress: () => deactivateLandlineMode() },
              ],
            );
          }
        } else {
          // Indefinite mode - count up
          const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
          setTimeDisplay(formatDuration(diff));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, sessionStartTime, sessionMode, sessionEndTime]);

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for Landline in your device settings, then return to the app.',
        [{ text: 'OK', onPress: () => setTimeout(() => checkStatus(), 2000) }],
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
    setShowModeSelectionModal(true);
  };

  const confirmActivation = async () => {
    setShowModeSelectionModal(false);
    haptics.medium();

    try {
      // Activate via store with selected mode and duration
      if (selectedMode === 'timer') {
        await activateLandlineMode('timer', selectedDuration);
        setTimeDisplay(formatDuration(selectedDuration * 60));
      } else {
        await activateLandlineMode('indefinite');
        setTimeDisplay('0m');
      }
    } catch {
      Alert.alert('Error', 'Could not activate Landline Mode. Please try again.');
    }
  };

  const handleDeactivate = () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivation = async () => {
    setShowDeactivateModal(false);
    haptics.medium();

    try {
      // Deactivate via store (handles all native calls, verification, stop refresh)
      await deactivateLandlineMode();
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

  // Web fallback with mock UI
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: COLORS.foreground }]}>Landline Mode</Text>
            <Text style={[styles.headerSubtitle, { color: COLORS.text.secondary }]}>
              Take a break from notifications
            </Text>
          </View>

          <View style={styles.toggleContainer}>
            <Card variant="elevated" padding="lg" borderRadius="xl">
              <Pressable
                onPress={() => {
                  if (isActive) {
                    deactivateLandlineMode();
                  } else {
                    activateLandlineMode();
                  }
                }}
                style={styles.webToggleButton}
              >
                <MaterialIcons
                  name={isActive ? 'notifications-off' : 'notifications'}
                  size={56}
                  color={isActive ? COLORS.primary : COLORS.text.muted}
                />
                <Text
                  style={[
                    styles.webToggleStatus,
                    { color: isActive ? COLORS.primary : COLORS.text.secondary },
                  ]}
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </Pressable>
            </Card>
          </View>

          <Card variant="base" padding="lg">
            <Text style={[styles.infoTitle, { color: COLORS.foreground }]}>Web Preview Mode</Text>
            <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
              Full Landline Mode functionality is available on Android devices.
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Landline Mode</Text>
          <Text style={styles.headerSubtitle}>
            {isActive ? 'Your digital peace is active' : 'Take a break from notifications'}
          </Text>
        </View>

        {/* Main Toggle Area - Rotary Dial Button */}
        <View style={styles.toggleContainer}>
          <RotaryDialButton
            active={isActive}
            onPress={isActive ? handleDeactivate : handleActivate}
            disabled={false}
          />
        </View>

        {/* Session Info (when active) */}
        {isActive && (
          <View style={styles.sessionInfo}>
            <SessionCard
              label={sessionMode === 'timer' ? 'Time Remaining' : 'Session Duration'}
              value={timeDisplay}
              variant="primary"
              style={styles.flexCard}
            />
            <SessionCard
              label="Notifications"
              value={summary.total}
              variant="secondary"
              style={styles.flexCard}
            />
          </View>
        )}

        {/* Status Cards */}
        <View style={styles.statusSection}>
          {/* Notification Summary (when active or has notifications) */}
          {(isActive || notifications.length > 0) && (
            <TouchableOpacity onPress={handleViewNotifications} activeOpacity={0.7}>
              <Card variant="elevated" style={styles.statusCard}>
                <View style={styles.statusCardHeader}>
                  <MaterialIcons
                    name="all-inbox"
                    size={18}
                    color={COLORS.text.secondary}
                    style={styles.statusCardIcon}
                  />
                  <Text style={styles.statusCardTitle}>Notifications</Text>
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
              </Card>
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
            <MaterialIcons
              name="move-to-inbox"
              size={20}
              color={COLORS.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>Notifications are silently captured and logged</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons
              name="volume-off"
              size={20}
              color={COLORS.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>Your phone stays silent - no sounds or vibrations</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons
              name="fact-check"
              size={20}
              color={COLORS.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>Review all notifications later at your convenience</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons
              name="contact-emergency"
              size={20}
              color={COLORS.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>Emergency contacts can still reach you</Text>
          </View>
        </View>
      </ScrollView>

      {/* Mode Selection Modal */}
      <Modal
        visible={showModeSelectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 380 }]}>
            <Text style={styles.modalTitle}>Choose Session Type</Text>
            <Text style={styles.modalText}>How would you like to use Landline Mode?</Text>

            {/* Mode Options */}
            <View style={styles.modeOptions}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  selectedMode === 'indefinite' && styles.modeOptionSelected,
                ]}
                onPress={() => {
                  haptics.light();
                  setSelectedMode('indefinite');
                }}
              >
                <MaterialIcons
                  name="all-inclusive"
                  size={32}
                  color={selectedMode === 'indefinite' ? COLORS.primary : COLORS.text.secondary}
                />
                <Text
                  style={[
                    styles.modeOptionTitle,
                    selectedMode === 'indefinite' && styles.modeOptionTitleSelected,
                  ]}
                >
                  Indefinite
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeOption, selectedMode === 'timer' && styles.modeOptionSelected]}
                onPress={() => {
                  haptics.light();
                  setSelectedMode('timer');
                }}
              >
                <MaterialIcons
                  name="timer"
                  size={32}
                  color={selectedMode === 'timer' ? COLORS.primary : COLORS.text.secondary}
                />
                <Text
                  style={[
                    styles.modeOptionTitle,
                    selectedMode === 'timer' && styles.modeOptionTitleSelected,
                  ]}
                >
                  Focus Timer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description / Duration Selector Area */}
            <View style={styles.descriptionArea}>
              {/* Indefinite description */}
              <View
                style={[
                  styles.indefiniteDescription,
                  { opacity: selectedMode === 'indefinite' ? 1 : 0 },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.descriptionText}>Stay focused until you decide to stop</Text>
              </View>

              {/* Timer duration selector */}
              <View
                style={[styles.timerControls, { opacity: selectedMode === 'timer' ? 1 : 0 }]}
                pointerEvents={selectedMode === 'timer' ? 'auto' : 'none'}
              >
                <Text style={styles.durationLabel}>Duration</Text>
                <View style={styles.durationOptions}>
                  {[0.1666, 15, 30, 60, 120].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.durationOption,
                        selectedDuration === mins && styles.durationOptionSelected,
                      ]}
                      onPress={() => {
                        haptics.light();
                        setSelectedDuration(mins);
                      }}
                    >
                      <Text
                        style={[
                          styles.durationOptionText,
                          selectedDuration === mins && styles.durationOptionTextSelected,
                        ]}
                      >
                        {mins < 1 ? '10s' : mins < 60 ? `${mins}m` : `${mins / 60}h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModeSelectionModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmActivation}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {selectedMode === 'timer' ? 'Start Timer' : 'Start Session'}
                </Text>
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
            <MaterialIcons
              name="notifications-active"
              size={56}
              color={COLORS.warning}
              style={styles.modalIcon}
            />
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
    </View>
  );
}

const organicDialSize = width * 0.75;
const centerDisplaySize = width * 0.45;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },
  toggleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.lg,
  },
  // Web toggle styles
  webToggleButton: {
    width: organicDialSize,
    height: organicDialSize,
    borderRadius: organicDialSize / 2,
    backgroundColor: COLORS.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  webToggleStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    fontFamily: 'Nunito_400Regular',
  },
  mainButton: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: (width * 0.15) / 2,
    backgroundColor: COLORS.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
    ...Shadows.lg,
  },
  mainButtonPressed: {
    opacity: 0.9,
  },
  centerDashboard: {
    width: centerDisplaySize,
    height: centerDisplaySize,
    borderRadius: Radius.xl,
    backgroundColor: COLORS.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
    ...Shadows.md,
  },
  dashboardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase',
  },
  displayValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.sm,
  },
  secondaryInfo: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
  // Session info styles
  sessionInfo: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xxxl,
    width: '100%',
  },
  flexCard: {
    flex: 1,
    flexBasis: 0,
  },
  statusSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  statusCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    ...Shadows.sm,
  },
  statusCardWarning: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '15',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusCardIcon: {
    marginRight: Spacing.lg,
    width: 24,
    textAlign: 'center',
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
  },
  statusCardText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 34,
    fontFamily: 'Nunito_400Regular',
  },
  statusCardButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    marginLeft: 34,
    alignSelf: 'flex-start',
  },
  statusCardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  notificationBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Fraunces_700Bold',
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: Spacing.sm,
    fontFamily: 'Nunito_400Regular',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: 'Nunito_400Regular',
  },
  recentSessionsSection: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: Spacing.xxxl,
    ...Shadows.sm,
  },
  recentSessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: Spacing.lg,
    fontFamily: 'Nunito_400Regular',
  },
  recentSessionsPlaceholder: {
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  infoSection: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    ...Shadows.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: Spacing.xl,
    fontFamily: 'Nunito_400Regular',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  infoIcon: {
    marginRight: Spacing.lg,
    width: 28,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
    ...Shadows.lg,
  },
  modalIcon: {
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: 'Fraunces_700Bold',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxl,
    fontFamily: 'Nunito_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.lg,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.surface.base,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonDeactivate: {
    backgroundColor: COLORS.warning,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_400Regular',
  },
  // Mode Selection Styles
  modeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  modeOption: {
    flex: 1,
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  modeOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: Spacing.sm,
    fontFamily: 'Nunito_600SemiBold',
  },
  modeOptionTitleSelected: {
    color: COLORS.primary,
  },
  // Description Area Styles (shared space for description and timer)
  descriptionArea: {
    width: '100%',
    minHeight: 80,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  indefiniteDescription: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  timerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: 'Nunito_600SemiBold',
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  durationOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: COLORS.surface.base,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  durationOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
  },
  durationOptionTextSelected: {
    color: COLORS.text.onPrimary,
  },
});
