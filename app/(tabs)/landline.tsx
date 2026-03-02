import React, { useEffect, useState, useCallback } from 'react';

import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import NotificationApiManager from '@/modules/notification-api-manager';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandlineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [hasPermission, setHasPermission] = useState(false);
  const [isLandlineModeActive, setIsLandlineModeActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(() => {
    if (Platform.OS !== 'android') {
      setLoading(false);
      return;
    }

    const permission = NotificationApiManager.hasNotificationListenerPermission();
    const active = NotificationApiManager.isLandlineModeActive();

    setHasPermission(permission);
    setIsLandlineModeActive(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRequestPermission = useCallback(async () => {
    try {
      await NotificationApiManager.requestNotificationListenerPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for this app, then come back to confirm status.',
      );
    } finally {
      // Give the system a moment, then re-check
      setTimeout(loadStatus, 1000);
    }
  }, [loadStatus]);

  const handleToggleLandlineMode = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Landline Mode requires Notification Access permission. Please grant permission first.',
      );
      return;
    }

    const next = !isLandlineModeActive;
    const success = NotificationApiManager.setLandlineMode(next);

    if (!success) {
      Alert.alert('Error', 'Unable to update Landline Mode. Please try again.');
      return;
    }

    setIsLandlineModeActive(next);
    Alert.alert('Landline Mode', next ? 'Landline Mode is now ON.' : 'Landline Mode is now OFF.');
  }, [hasPermission, isLandlineModeActive]);

  const handleOpenDebug = useCallback(() => {
    router.push('/(tabs)/landline-mode-test');
  }, [router]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Landline Mode</Text>
        <Text style={styles.description}>
          Landline Mode is only available on Android devices.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Checking Landline status...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Landline Mode</Text>
          <Text style={styles.subtitle}>Focus like it&apos;s 1995.</Text>
        </View>

        <TouchableOpacity style={styles.debugButton} onPress={handleOpenDebug}>
          <Text style={styles.debugButtonText}>LANDLINE MODE TEST</Text>
        </TouchableOpacity>
      </View>

      {/* Explanation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What is Landline Mode?</Text>
        <Text style={styles.cardBody}>
          Landline Mode temporarily captures your notifications while you&apos;re on a call, so you
          can stay focused. Afterward, you can review everything that came in from the
          Notifications tab.
        </Text>
      </View>

      {/* Status */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Notification Access</Text>
          <View
            style={[
              styles.statusPill,
              hasPermission ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>
              {hasPermission ? 'Granted' : 'Not Granted'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Landline Mode</Text>
          <View
            style={[
              styles.statusPill,
              isLandlineModeActive ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>
              {isLandlineModeActive ? 'On' : 'Off'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {!hasPermission && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Enable Landline Mode</Text>
          <Text style={styles.cardBody}>
            To use Landline Mode, grant Notification Access permission. We only use this to log
            notifications while mode is active.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermission}>
            <Text style={styles.primaryButtonText}>Grant Notification Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasPermission && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Control</Text>
          <Text style={styles.cardBody}>
            Turn Landline Mode on at the start of a call, then turn it off when you&apos;re done.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isLandlineModeActive ? styles.buttonOn : styles.buttonOff,
            ]}
            onPress={handleToggleLandlineMode}
          >
            <Text style={styles.primaryButtonText}>
              {isLandlineModeActive ? 'Turn Landline Mode Off' : 'Turn Landline Mode On'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hint to Notifications tab */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          When Landline Mode is on, your notifications are quietly logged. Visit the Notifications
          tab any time to review what you missed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#3d3325',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#3d3325',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F4E4C1',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#D4AF7A',
  },
  loadingText: {
    fontSize: 16,
    color: '#F4E4C1',
  },
  debugButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF7A',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  debugButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#F4E4C1',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,228,193,0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#F4E4C1',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#F9F2DF',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#F4E4C1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 15,
    color: '#F9F2DF',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9F2DF',
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#D4AF7A',
  },
  buttonOn: {
    backgroundColor: '#c0392b',
  },
  buttonOff: {
    backgroundColor: '#27ae60',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3d3325',
  },
  footerNote: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  footerNoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#D4AF7A',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#F9F2DF',
    textAlign: 'center',
  },
})

