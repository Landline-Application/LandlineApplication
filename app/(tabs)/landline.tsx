import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLandlineStore } from '@/hooks/useLandlineStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandlineScreen() {
  const insets = useSafeAreaInsets();

  const {
    hasPermission,
    isActive,
    isLoading,
    checkStatus,
    requestPermission,
    activateLandlineMode,
    deactivateLandlineMode,
  } = useLandlineStore();

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    checkStatus().finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for this app, then come back to confirm status.',
      );
    } catch {
      // Error is already set in store
      console.error('Permission request failed');
    } finally {
      // Give the system a moment, then re-check
      setTimeout(() => {
        checkStatus();
      }, 1000);
    }
  }, [requestPermission, checkStatus]);

  const handleToggleLandlineMode = useCallback(async () => {
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

    try {
      if (isActive) {
        await deactivateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now OFF.');
      } else {
        await activateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now ON.');
      }
    } catch {
      Alert.alert('Error', 'Unable to update Landline Mode. Please try again.');
    }
  }, [hasPermission, isActive, activateLandlineMode, deactivateLandlineMode]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Landline Mode</Text>
        <Text style={styles.description}>Landline Mode is only available on Android devices.</Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4AF7A" />
        <Text style={styles.loadingText}>Checking Landline status...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Landline Mode</Text>
      </View>

      {/* Explanation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What is Landline Mode?</Text>
        <Text style={styles.cardBody}>
          Landline Mode temporarily captures your notifications, so you can stay focused. Afterward,
          you can review everything that came in from the Notifications tab.
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
            <Text style={styles.statusPillText}>{hasPermission ? 'Granted' : 'Not Granted'}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Landline Mode</Text>
          <View
            style={[
              styles.statusPill,
              isActive ? styles.statusPillActive : styles.statusPillInactive,
            ]}
          >
            <Text style={styles.statusPillText}>{isActive ? 'On' : 'Off'}</Text>
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
            Turn Landline Mode on to capture notifications, then turn it off when you&apos;re done.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isActive ? styles.buttonOn : styles.buttonOff,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleToggleLandlineMode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#3d3325" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isActive ? 'Turn Landline Mode Off' : 'Turn Landline Mode On'}
              </Text>
            )}
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
  buttonDisabled: {
    opacity: 0.6,
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
});
