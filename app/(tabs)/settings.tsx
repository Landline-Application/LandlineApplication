import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { AppAttentionCard } from '@/components/settings/app-attention-card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLandlineStore } from '@/hooks/use-landline-store';
import NotificationApiManager from '@/modules/notification-api-manager';
import { haptics } from '@/services/haptics';
import { clearAcceptance } from '@/utils/acceptance-storage';
import {
  type LoggedNotificationRow,
  type NotificationLogDateRangePreset,
  type NotificationLogPrivacyMode,
  type NotificationLogSortOrder,
  prepareNotificationLogsForExport,
  saveNotificationLogsCSVAndroid,
} from '@/utils/notification-logs-csv';
import { StorageManager } from '@/utils/storage/storage-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Deletion state
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Storage state
  const [storageInfo, setStorageInfo] = useState<{
    totalKeys: number;
    landlineKeys: number;
    estimatedSize: string;
  } | null>(null);

  const [exportLogModalVisible, setExportLogModalVisible] = useState(false);
  const [exportLogPreset, setExportLogPreset] = useState<NotificationLogDateRangePreset>('7d');
  const [exportLogSort, setExportLogSort] = useState<NotificationLogSortOrder>('newest');
  const [exportLogPrivacyMode, setExportLogPrivacyMode] =
    useState<NotificationLogPrivacyMode>('metadataOnly');
  const [exportLogAppName, setExportLogAppName] = useState('');
  const [exportLogRows, setExportLogRows] = useState<LoggedNotificationRow[] | null>(null);
  const [exportLogLoading, setExportLogLoading] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);

  const matchingExportCount = useMemo(() => {
    if (!exportLogRows) return 0;
    return prepareNotificationLogsForExport(exportLogRows, {
      datePreset: exportLogPreset,
      sortOrder: exportLogSort,
      appNameContains: exportLogAppName.trim() || undefined,
    }).length;
  }, [exportLogRows, exportLogPreset, exportLogSort, exportLogAppName]);

  // Load storage info on mount
  React.useEffect(() => {
    loadStorageInfo();
  }, []);

  async function loadStorageInfo() {
    const info = await StorageManager.getStorageSummary();
    setStorageInfo(info);
  }

  async function openExportLogModal() {
    setExportLogModalVisible(true);
    setExportLogLoading(true);
    setExportLogRows(null);
    try {
      const rows =
        (await NotificationApiManager.getLoggedNotifications()) as LoggedNotificationRow[];
      setExportLogRows(rows);
    } catch (error) {
      console.error('Notification log load error:', error);
      setExportLogRows([]);
      Alert.alert('Error', 'Could not load notification logs.');
    } finally {
      setExportLogLoading(false);
    }
  }

  function closeExportLogModal() {
    setExportLogModalVisible(false);
  }

  async function handleSaveNotificationLogsCSV() {
    setCsvExporting(true);
    try {
      const result = await saveNotificationLogsCSVAndroid({
        datePreset: exportLogPreset,
        sortOrder: exportLogSort,
        privacyMode: exportLogPrivacyMode,
        appNameContains: exportLogAppName.trim() || undefined,
      });
      if (!result.ok) {
        Alert.alert('Export', result.error ?? 'Could not save the file.');
      } else {
        Alert.alert(
          'Saved',
          `Saved ${result.rowCount} notification row(s) to the folder you chose.`,
        );
        closeExportLogModal();
      }
    } catch (error) {
      Alert.alert('Export', 'An unexpected error occurred.');
      console.error('CSV export error:', error);
    } finally {
      setCsvExporting(false);
    }
  }

  function openDeleteModal() {
    setDeleteModalVisible(true);
    setConfirmationText('');
  }

  function closeDeleteModal() {
    setDeleteModalVisible(false);
    setConfirmationText('');
  }

  async function handleDeleteAllData() {
    if (confirmationText !== 'DELETE') {
      Alert.alert('Incorrect Confirmation', 'Please type "DELETE" to confirm.');
      return;
    }

    setIsDeleting(true);

    try {
      const result = await StorageManager.deleteAllUserData();

      if (result.success) {
        closeDeleteModal();
        Alert.alert('Data Deleted', 'All your data has been permanently deleted from the app.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(onboarding)/onboarding');
            },
          },
        ]);
      } else {
        Alert.alert(
          'Deletion Failed',
          `Some data could not be deleted:\n${result.errors?.join('\n')}`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  async function resetTermsAcceptance() {
    try {
      const { resetOnboarding } = await import('@/utils/onboarding-storage');
      await clearAcceptance();
      await resetOnboarding();

      // Refresh global status
      await useLandlineStore.getState().checkStatus();

      Alert.alert('Success', 'Terms acceptance cleared. App will now redirect to terms screen.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/onboarding' as any);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear acceptance. Please try again.');
      console.error('Error clearing acceptance:', error);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and app data</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>

          {isAuthenticated ? (
            <Card variant="elevated" padding="lg" style={styles.card}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(user?.displayName?.trim()?.[0] ||
                      user?.email ||
                      user?.phoneNumber ||
                      '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  {user?.displayName ? (
                    <Text style={styles.accountDisplayName} numberOfLines={1}>
                      {user.displayName}
                    </Text>
                  ) : (
                    <Text style={styles.accountDisplayNameMuted} numberOfLines={1}>
                      Anonymous User
                    </Text>
                  )}
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {user?.email || user?.phoneNumber || 'No email associated'}
                  </Text>
                </View>
              </View>

              <View style={styles.accountActions}>
                <Button
                  label="Manage Account"
                  onPress={() => router.push('/(settings)/account')}
                  variant="secondary"
                  size="md"
                  fullWidth
                  style={{ marginBottom: Spacing.md }}
                />
                <Button
                  label="Sign Out"
                  onPress={handleSignOut}
                  variant="ghost"
                  size="md"
                  fullWidth
                />
              </View>
            </Card>
          ) : (
            <Card variant="elevated" padding="lg" style={styles.card}>
              <Text style={styles.unauthTitle}>Join Landline</Text>
              <Text style={styles.unauthSubtitle}>
                Create an account to sync your settings and access features across devices.
              </Text>
              <View style={styles.unauthButtons}>
                <Button
                  label="Create Account"
                  onPress={() => router.push('/(settings)/create-account')}
                  fullWidth
                  variant="primary"
                  style={{ marginBottom: Spacing.md }}
                />
                <Button
                  label="Sign In"
                  onPress={() => router.push('/(settings)/sign-in')}
                  fullWidth
                  variant="secondary"
                />
              </View>
            </Card>
          )}
        </View>

        {/* App Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>App Permissions</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/core-permissions' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItem, { paddingHorizontal: Spacing.md }]}>
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="lock" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Permissions</Text>
                  <Text style={styles.menuItemSubtitle}>Review and grant app access</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
              </View>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/app-selection' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItem, { paddingHorizontal: Spacing.md }]}>
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="apps" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Bypass List</Text>
                  <Text style={styles.menuItemSubtitle}>Choose apps that can ignore silencing</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Attention Section */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>App Attention</Text>
            <AppAttentionCard limit={5} showViewMore />
          </View>
        )}

        {/* Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tools & Diagnostics</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/(tabs)/landline' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItem, { paddingHorizontal: Spacing.md }]}>
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="notifications-off" size={22} color={COLORS.secondary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Landline Mode</Text>
                  <Text style={styles.menuItemSubtitle}>Configure silencing engine</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
              </View>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/(tabs)/debug-tools' as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItem, { paddingHorizontal: Spacing.md }]}>
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="build" size={22} color={COLORS.secondary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Debug Console</Text>
                  <Text style={styles.menuItemSubtitle}>System logs and developer tools</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data Management</Text>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <View style={styles.storageSummary}>
              <View style={styles.storageItem}>
                <Text style={styles.storageValue}>{storageInfo?.landlineKeys ?? 0}</Text>
                <Text style={styles.storageLabel}>Data Points</Text>
              </View>
              <View style={styles.storageDivider} />
              <View style={styles.storageItem}>
                <Text style={styles.storageValue}>{storageInfo?.estimatedSize ?? '0 KB'}</Text>
                <Text style={styles.storageLabel}>Total Size</Text>
              </View>
            </View>

            <View style={styles.dataActions}>
              {Platform.OS === 'android' && (
                <Button
                  label="Export notification logs"
                  onPress={openExportLogModal}
                  variant="secondary"
                  size="md"
                  fullWidth
                  style={{ marginBottom: Spacing.md }}
                />
              )}
              <Button
                label="Delete All Data"
                onPress={openDeleteModal}
                variant="danger"
                size="md"
                fullWidth
              />
            </View>

            <View style={styles.warningBox}>
              <MaterialIcons name="info-outline" size={18} color={COLORS.error} />
              <Text style={styles.warningText}>
                Deleting all data is permanent. Export first if you need a backup.
              </Text>
            </View>
          </Card>
        </View>

        {/* Developer Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Development</Text>
          <Button
            label="Reset Terms Acceptance"
            onPress={resetTermsAcceptance}
            variant="ghost"
            size="sm"
            fullWidth
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Landline v0.1.0 (Alpha)</Text>
          <Text style={styles.copyrightText}>© 2026 Landline Application</Text>
        </View>
      </ScrollView>

      {/* Delete Data Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalBody}>
              This will permanently delete ALL your data from the Landline app.
            </Text>

            <View style={styles.confirmBox}>
              <Text style={styles.confirmLabel}>
                Type <Text style={styles.confirmHighlight}>DELETE</Text> to confirm:
              </Text>
              <TextInput
                style={styles.modalInput}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="DELETE"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                onPress={closeDeleteModal}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                label="Delete"
                onPress={handleDeleteAllData}
                variant="danger"
                size="md"
                disabled={confirmationText !== 'DELETE' || isDeleting}
                loading={isDeleting}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Notification log CSV export (Android) */}
      <Modal
        animationType="fade"
        transparent
        visible={exportLogModalVisible}
        onRequestClose={closeExportLogModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.exportLogModalContent]}>
            <Text style={styles.modalTitle}>Export notification logs</Text>
            <Text style={[styles.modalText, { marginBottom: 16 }]}>
              Rows are filtered by logged time. Choose whether message titles and body text are
              included or redacted. The file is saved with Storage Access Framework to a folder you
              pick.
            </Text>

            <ScrollView
              style={styles.exportLogScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.exportLogSectionLabel}>Date range</Text>
              <View style={styles.exportLogChipRow}>
                {(
                  [
                    { key: '24h' as const, label: '24h' },
                    { key: '7d' as const, label: '7 days' },
                    { key: '30d' as const, label: '30 days' },
                    { key: 'all' as const, label: 'All' },
                  ] as const
                ).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.exportLogChip,
                      exportLogPreset === key && styles.exportLogChipSelected,
                    ]}
                    onPress={() => {
                      haptics.light();
                      setExportLogPreset(key);
                    }}
                  >
                    <Text
                      style={[
                        styles.exportLogChipText,
                        exportLogPreset === key && styles.exportLogChipTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.exportLogSectionLabel}>Sort by logged time</Text>
              <TouchableOpacity
                style={[
                  styles.exportLogSortRow,
                  exportLogSort === 'newest' && styles.exportLogSortRowSelected,
                ]}
                onPress={() => {
                  haptics.light();
                  setExportLogSort('newest');
                }}
              >
                <Text style={styles.exportLogSortText}>Newest first</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.exportLogSortRow,
                  exportLogSort === 'oldest' && styles.exportLogSortRowSelected,
                ]}
                onPress={() => {
                  haptics.light();
                  setExportLogSort('oldest');
                }}
              >
                <Text style={styles.exportLogSortText}>Oldest first</Text>
              </TouchableOpacity>

              <Text style={styles.exportLogSectionLabel}>Export content</Text>
              <TouchableOpacity
                style={[
                  styles.exportLogSortRow,
                  exportLogPrivacyMode === 'metadataOnly' && styles.exportLogSortRowSelected,
                ]}
                onPress={() => {
                  haptics.light();
                  setExportLogPrivacyMode('metadataOnly');
                }}
              >
                <Text style={styles.exportLogSortText}>Metadata only (recommended)</Text>
                <Text style={styles.exportLogSortSubtext}>
                  Times, package, app name, post time, id — title and text columns show [redacted]
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.exportLogSortRow,
                  exportLogPrivacyMode === 'full' && styles.exportLogSortRowSelected,
                ]}
                onPress={() => {
                  haptics.light();
                  setExportLogPrivacyMode('full');
                }}
              >
                <Text style={styles.exportLogSortText}>Full detail</Text>
                <Text style={styles.exportLogSortSubtext}>
                  Includes notification titles and message text as stored
                </Text>
              </TouchableOpacity>

              <Text style={styles.exportLogSectionLabel}>App name contains (optional)</Text>
              <TextInput
                style={styles.exportLogFilterInput}
                value={exportLogAppName}
                onChangeText={setExportLogAppName}
                placeholder="e.g. Messages"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {exportLogLoading ? (
                <View style={styles.exportLogPreviewRow}>
                  <ActivityIndicator color="#007AFF" />
                  <Text style={styles.exportLogPreviewText}>Loading logs…</Text>
                </View>
              ) : (
                <Text style={styles.exportLogPreviewText}>
                  {exportLogRows === null
                    ? ''
                    : matchingExportCount === 0
                      ? 'No notifications match these options.'
                      : `${matchingExportCount} notification${matchingExportCount === 1 ? '' : 's'} will be exported.`}
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeExportLogModal}
                disabled={csvExporting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (matchingExportCount === 0 || exportLogLoading || csvExporting) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleSaveNotificationLogsCSV}
                disabled={matchingExportCount === 0 || exportLogLoading || csvExporting}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {csvExporting ? 'Saving…' : 'Save CSV'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.jumbo,
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
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    ...Shadows.sm,
  },
  // Account section
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    color: COLORS.primary,
    fontSize: 28,
    fontFamily: 'Fraunces_700Bold',
  },
  accountInfo: {
    flex: 1,
  },
  accountDisplayName: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  accountDisplayNameMuted: {
    fontSize: 18,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    fontStyle: 'italic',
  },
  accountEmail: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  profileEditBlock: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: Spacing.xl,
    opacity: 0.5,
  },
  accountActions: {
    marginTop: Spacing.md,
  },
  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 112, 82, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.accent,
    marginLeft: 56,
    opacity: 0.3,
  },
  // Storage
  storageSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(93, 112, 82, 0.05)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  storageItem: {
    flex: 1,
    alignItems: 'center',
  },
  storageDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.accent,
  },
  storageValue: {
    fontSize: 22,
    color: COLORS.primary,
    fontFamily: 'Fraunces_700Bold',
  },
  storageLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  dataActions: {
    marginBottom: Spacing.lg,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'rgba(193, 140, 93, 0.08)',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  // Unauth
  unauthTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  unauthSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  unauthButtons: {
    width: '100%',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  exportLogModalContent: {
    maxHeight: '88%',
    maxWidth: 420,
  },
  exportLogScroll: {
    maxHeight: 320,
    marginBottom: 8,
  },
  exportLogSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  exportLogChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  exportLogChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface.elevated,
  },
  exportLogChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  exportLogChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  exportLogChipTextSelected: {
    color: COLORS.primary,
  },
  exportLogSortRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    marginBottom: 8,
    backgroundColor: COLORS.surface.base,
  },
  exportLogSortRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  exportLogSortText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  exportLogSortSubtext: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text.muted,
    marginTop: 4,
    fontWeight: '400',
  },
  exportLogFilterInput: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.foreground,
  },
  exportLogPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  exportLogPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.onPrimary,
  },
  modalTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  confirmBox: {
    marginBottom: Spacing.xl,
  },
  confirmLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.sm,
  },
  confirmHighlight: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.foreground,
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
  },
  modalTextExtra: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    opacity: 0.5,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
  copyrightText: {
    fontSize: 11,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
  },
});
