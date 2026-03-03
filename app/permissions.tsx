import React, { useCallback, useEffect, useState } from 'react';

import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { LandlineColors } from '@/constants/theme';
// Import native modules for permission checks
import * as BackgroundServiceManager from '@/modules/background-service-manager';
import * as DndManager from '@/modules/dnd-manager';
import {
  hasNotificationListenerPermission,
  hasPostPermission,
  requestNotificationListenerPermission,
  requestPostPermission,
} from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Permission {
  id: string;
  name: string;
  description: string;
  whyNeeded: string;
  icon: string;
  status: 'granted' | 'denied' | 'unknown';
  isRequired: boolean;
  checkPermission: () => boolean | Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

export default function PermissionsScreen() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Define all required permissions
  const getPermissionDefinitions = useCallback(
    (): Permission[] => [
      {
        id: 'notification_listener',
        name: 'Notification Access',
        description: 'Read and log notifications from other apps',
        whyNeeded:
          'This is the core permission that allows Landline to capture and log notifications while in Landline Mode. Without this, we cannot track which notifications you received.',
        icon: '🔔',
        status: 'unknown',
        isRequired: true,
        checkPermission: () => {
          try {
            return hasNotificationListenerPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await requestNotificationListenerPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'notification_post',
        name: 'Post Notifications',
        description: 'Show notifications from Landline app',
        whyNeeded:
          'Allows Landline to show you important alerts, like when someone on your emergency contact list tries to reach you.',
        icon: '📬',
        status: 'unknown',
        isRequired: true,
        checkPermission: () => {
          try {
            return hasPostPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await requestPostPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'dnd',
        name: 'Do Not Disturb',
        description: 'Control Do Not Disturb mode',
        whyNeeded:
          "Enables Landline to silence your phone automatically when Landline Mode is active. If denied, we'll try to use ringer controls as a fallback.",
        icon: '🔕',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return DndManager.hasPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await DndManager.requestPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'battery_optimization',
        name: 'Battery Optimization',
        description: 'Run reliably in the background',
        whyNeeded:
          "Prevents Android from stopping Landline while it's running in the background. This ensures notifications are captured even when you're not using the app.",
        icon: '🔋',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return BackgroundServiceManager.isIgnoringBatteryOptimizations();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await BackgroundServiceManager.requestIgnoreBatteryOptimizations();
          } catch {
            return false;
          }
        },
      },
    ],
    [],
  );

  // Check all permission statuses
  const checkAllPermissions = useCallback(async () => {
    setIsLoading(true);
    const definitions = getPermissionDefinitions();

    const updatedPermissions = await Promise.all(
      definitions.map(async (perm) => {
        try {
          const result = await perm.checkPermission();
          return {
            ...perm,
            status: result ? 'granted' : 'denied',
          } as Permission;
        } catch {
          return {
            ...perm,
            status: 'unknown',
          } as Permission;
        }
      }),
    );

    setPermissions(updatedPermissions);
    setIsLoading(false);
  }, [getPermissionDefinitions]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions, refreshKey]);

  const handleRequestPermission = async (permission: Permission) => {
    try {
      const granted = await permission.requestPermission();

      if (granted) {
        // Refresh permission status
        setRefreshKey((prev) => prev + 1);
      } else {
        Alert.alert(
          'Permission Required',
          `${permission.name} was not granted. Some features may not work correctly.\n\nYou can grant this permission later in your device settings.`,
          [
            { text: 'OK' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Could not request ${permission.name}. Please try again or grant it manually in settings.`,
        [
          { text: 'OK' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const requiredPermissions = permissions.filter((p) => p.isRequired);
    const allRequiredGranted = requiredPermissions.every((p) => p.status === 'granted');

    if (!allRequiredGranted) {
      Alert.alert(
        'Required Permissions',
        'Some required permissions have not been granted. The app may not function correctly without them.',
        [
          { text: 'Grant Permissions', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => router.replace('/(tabs)') },
        ],
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  const grantedCount = permissions.filter((p) => p.status === 'granted').length;
  const totalCount = permissions.length;

  const getStatusColor = (status: Permission['status']) => {
    switch (status) {
      case 'granted':
        return LandlineColors.dark.success;
      case 'denied':
        return LandlineColors.dark.warning;
      default:
        return LandlineColors.dark.textMuted;
    }
  };

  const getStatusText = (status: Permission['status']) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Not Granted';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: Permission['status']) => {
    switch (status) {
      case 'granted':
        return '✓';
      case 'denied':
        return '!';
      default:
        return '?';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Permission Status</Text>
            <Text style={styles.progressCount}>
              {grantedCount} of {totalCount} granted
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(grantedCount / totalCount) * 100}%` }]}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Why We Need Permissions</Text>
          <Text style={styles.descriptionText}>
            Landline needs certain permissions to work properly. We only request what&apos;s
            necessary and never share your data. Tap each permission to learn more and grant access.
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
          ) : (
            permissions.map((permission) => (
              <View key={permission.id} style={styles.permissionCard}>
                <View style={styles.permissionHeader}>
                  <View style={styles.permissionIconContainer}>
                    <Text style={styles.permissionIcon}>{permission.icon}</Text>
                  </View>
                  <View style={styles.permissionInfo}>
                    <View style={styles.permissionTitleRow}>
                      <Text style={styles.permissionName}>{permission.name}</Text>
                      {permission.isRequired && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.permissionDescription}>{permission.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(permission.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusIcon, { color: getStatusColor(permission.status) }]}>
                      {getStatusIcon(permission.status)}
                    </Text>
                  </View>
                </View>

                {/* Why Needed Section */}
                <View style={styles.whyNeededSection}>
                  <Text style={styles.whyNeededLabel}>Why we need this:</Text>
                  <Text style={styles.whyNeededText}>{permission.whyNeeded}</Text>
                </View>

                {/* Status and Action */}
                <View style={styles.permissionFooter}>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(permission.status) },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(permission.status) }]}>
                      {getStatusText(permission.status)}
                    </Text>
                  </View>

                  {permission.status !== 'granted' && (
                    <TouchableOpacity
                      style={styles.grantButton}
                      onPress={() => handleRequestPermission(permission)}
                    >
                      <Text style={styles.grantButtonText}>Grant Access</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Next Step - App Selection */}
        <TouchableOpacity style={styles.nextStepCard} onPress={() => router.push('/app-selection')}>
          <View style={styles.nextStepContent}>
            <Text style={styles.nextStepIcon}>📱</Text>
            <View style={styles.nextStepText}>
              <Text style={styles.nextStepTitle}>Next: Choose Your Apps</Text>
              <Text style={styles.nextStepDescription}>
                Select which apps to include in Landline Mode
              </Text>
            </View>
          </View>
          <Text style={styles.nextStepArrow}>→</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Privacy Note</Text>
          <Text style={styles.infoText}>
            • All notification data is stored locally on your device{'\n'}• We never send your
            notifications to external servers{'\n'}• You can revoke permissions anytime in device
            settings{'\n'}• Some features require specific permissions to function
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => setRefreshKey((prev) => prev + 1)}
        >
          <Text style={styles.refreshButtonText}>↻ Refresh Status</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.continueButton, grantedCount === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {grantedCount === totalCount ? 'Continue to App' : 'Continue Anyway'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LandlineColors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  progressCount: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LandlineColors.dark.success,
    borderRadius: 4,
  },
  descriptionSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 20,
  },
  permissionsList: {
    paddingVertical: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: LandlineColors.dark.textSecondary,
  },
  permissionCard: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LandlineColors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionIcon: {
    fontSize: 22,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: LandlineColors.dark.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: LandlineColors.dark.primary,
    textTransform: 'uppercase',
  },
  permissionDescription: {
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  whyNeededSection: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  whyNeededLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LandlineColors.dark.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  whyNeededText: {
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 18,
  },
  permissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  grantButton: {
    backgroundColor: LandlineColors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  nextStepCard: {
    backgroundColor: LandlineColors.dark.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.primary + '40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nextStepIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  nextStepText: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 2,
  },
  nextStepDescription: {
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
  },
  nextStepArrow: {
    fontSize: 20,
    color: LandlineColors.dark.primary,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 18,
  },
  refreshButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    color: LandlineColors.dark.primary,
    fontWeight: '500',
  },
  bottomAction: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LandlineColors.dark.divider,
    backgroundColor: LandlineColors.dark.background,
  },
  continueButton: {
    backgroundColor: LandlineColors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: LandlineColors.dark.buttonDisabled,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
