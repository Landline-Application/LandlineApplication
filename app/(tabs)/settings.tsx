import React, { useState } from 'react';

import {
  Alert,
  Button,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { clearAcceptance } from '@/utils/acceptance-storage';
import { deleteAccountWithEmail } from '@/utils/firebase/auth';
import { deleteAccountWithGoogle } from '@/utils/firebase/google-auth';
import { StorageManager } from '@/utils/storage/storage-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [storageInfo, setStorageInfo] = useState<{
    totalKeys: number;
    landlineKeys: number;
    estimatedSize: string;
  } | null>(null);

  // Load storage info on mount
  React.useEffect(() => {
    loadStorageInfo();
  }, []);

  async function loadStorageInfo() {
    const info = await StorageManager.getStorageSummary();
    setStorageInfo(info);
  }

  async function handleExportData() {
    try {
      const exportedData = await StorageManager.exportUserData();

      if (Platform.OS === 'web') {
        // For web, create a download
        const blob = new Blob([exportedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `landline-data-${new Date().toISOString()}.json`;
        a.click();
      } else {
        // For mobile, use Share API
        await Share.share({
          message: exportedData,
          title: 'Landline Data Export',
        });
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      console.error('Export error:', error);
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
        // Close modal
        closeDeleteModal();

        // Show success message
        Alert.alert('Data Deleted', 'All your data has been permanently deleted from the app.', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to terms screen (fresh start)
              router.replace('/terms-and-privacy' as any);
            },
          },
        ]);
      } else {
        // Show error
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
          router.replace('/onboarding');
        },
      },
    ]);
  }

  function openDeleteAccountModal() {
    Alert.alert(
      'Delete Account',
      'This is permanent. Your account cannot be recovered once deleted. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete it',
          style: 'destructive',
          onPress: () => {
            setDeleteAccountModalVisible(true);
            setConfirmationText('');
            setDeletePassword('');
          },
        },
      ],
    );
  }

  function closeDeleteAccountModal() {
    setDeleteAccountModalVisible(false);
    setConfirmationText('');
    setDeletePassword('');
  }

  async function handleDeleteAccount() {
    if (!user) return;

    const providers = user.providerData?.map((p) => p.providerId) ?? [];
    const isEmailUser = providers.includes('password');
    const isGoogleUser = providers.includes('google.com');

    if (isEmailUser) {
      if (confirmationText !== 'DELETE') {
        Alert.alert('Incorrect Confirmation', 'Please type "DELETE" to confirm.');
        return;
      }
      if (!deletePassword) {
        Alert.alert('Password Required', 'Please enter your password to confirm deletion.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      if (isEmailUser) {
        await deleteAccountWithEmail(user, deletePassword);
      } else if (isGoogleUser) {
        await deleteAccountWithGoogle(user);
      } else {
        Alert.alert('Unsupported', 'Cannot delete this account type from the app.');
        setIsDeleting(false);
        return;
      }

      // Account deleted — sign out locally and navigate away.
      await signOut().catch(() => {});
      closeDeleteAccountModal();
      router.replace('/onboarding');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        Alert.alert('Wrong Password', 'The password you entered is incorrect.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Too many failed attempts. Please try again later.');
      } else {
        Alert.alert('Delete Failed', error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function resetTermsAcceptance() {
    try {
      await clearAcceptance();
      Alert.alert('Success', 'Terms acceptance cleared. App will now redirect to terms screen.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to terms screen to restart the flow
            router.replace('/terms-and-privacy' as any);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear acceptance. Please try again.');
      console.error('Error clearing acceptance:', error);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account</Text>

        {isAuthenticated ? (
          <>
            <View style={styles.accountCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(user?.email || user?.phoneNumber || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Signed in as</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {user?.email || user?.phoneNumber || 'Unknown'}
                </Text>
              </View>
            </View>

            {user?.email && !user.emailVerified && (
              <View style={styles.verifyBanner}>
                <MaterialIcons name="info-outline" size={14} color="#996600" />
                <Text style={styles.verifyBannerText}>
                  Please verify your email. Check your inbox for a verification link.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.outlineButton} onPress={handleSignOut}>
              <Text style={styles.outlineButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={openDeleteAccountModal}
            >
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Delete Account</Text>
              <Text style={styles.actionButtonSubtext}>Permanently remove your account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.unauthCard}>
              <Text style={styles.unauthTitle}>Join Landline</Text>
              <Text style={styles.unauthSubtitle}>
                Create an account to sync your settings and access features across devices.
              </Text>
              <TouchableOpacity
                style={styles.primaryAuthButton}
                onPress={() => router.push('/create-account')}
              >
                <Text style={styles.primaryAuthButtonText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryAuthButton}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.secondaryAuthButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Storage Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Storage Information</Text>
        {storageInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Landline Data:</Text>
              <Text style={styles.infoValue}>{storageInfo.landlineKeys} items</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Size:</Text>
              <Text style={styles.infoValue}>{storageInfo.estimatedSize}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Button
          title="Reset Terms Acceptance (Testing)"
          onPress={resetTermsAcceptance}
          color="#ff6b6b"
        />
      </View>

      {/* App Permissions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>App Permissions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/permissions' as any)}
        >
          <View style={styles.actionButtonRow}>
            <MaterialIcons name="lock" size={18} color="#fff" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Manage Permissions</Text>
          </View>
          <Text style={styles.actionButtonSubtext}>Review and grant app permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/app-selection' as any)}
        >
          <View style={styles.actionButtonRow}>
            <MaterialIcons name="apps" size={18} color="#fff" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>App Selection</Text>
          </View>
          <Text style={styles.actionButtonSubtext}>
            Choose which apps to include in Landline Mode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tools Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Tools</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/landline' as any)}
        >
          <View style={styles.actionButtonRow}>
            <MaterialIcons
              name="notifications-off"
              size={18}
              color="#fff"
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>Landline Mode</Text>
          </View>
          <Text style={styles.actionButtonSubtext}>Manage your Landline mode settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/debug-tools' as any)}
        >
          <View style={styles.actionButtonRow}>
            <MaterialIcons name="build" size={18} color="#fff" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Debug Tools</Text>
          </View>
          <Text style={styles.actionButtonSubtext}>System diagnostics and testing</Text>
        </TouchableOpacity>
      </View>

      {/* Data Management Section — only shown when signed in */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data Management</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <View style={styles.actionButtonRow}>
              <MaterialIcons name="upload" size={18} color="#fff" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Export My Data</Text>
            </View>
            <Text style={styles.actionButtonSubtext}>Download a copy of your data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={openDeleteModal}
          >
            <View style={styles.actionButtonRow}>
              <MaterialIcons
                name="delete-forever"
                size={18}
                color="#fff"
                style={styles.actionButtonIcon}
              />
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                Delete All My Data
              </Text>
            </View>
            <Text style={styles.actionButtonSubtext}>
              Permanently remove all your data from this app
            </Text>
          </TouchableOpacity>

          {/* Inline info about what gets deleted */}
          <View style={styles.deletionInfoBox}>
            <Text style={styles.deletionInfoTitle}>What gets deleted</Text>
            <Text style={styles.bulletPoint}>• Terms of Use acceptance record</Text>
            <Text style={styles.bulletPoint}>• All captured notification logs</Text>
            <Text style={styles.bulletPoint}>• Landline mode settings</Text>
            <Text style={styles.bulletPoint}>• All app preferences and settings</Text>
            <Text style={[styles.infoText, styles.warningText, { marginBottom: 0 }]}>
              This action cannot be undone. Export your data first.
            </Text>
          </View>
        </View>
      )}

      {/* Delete Account Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteAccountModalVisible}
        onRequestClose={closeDeleteAccountModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>

            <Text style={styles.modalText}>
              This will permanently delete your account. This action cannot be undone.
            </Text>

            {user?.providerData?.map((p) => p.providerId).includes('password') ? (
              <>
                <Text style={styles.modalLabel}>
                  Type <Text style={styles.modalHighlight}>DELETE</Text> to confirm:
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder="Type DELETE here"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
                <Text style={styles.modalLabel}>Enter your password:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
              </>
            ) : (
              <Text style={[styles.modalText, { marginTop: 8 }]}>
                You will be asked to sign in with Google to confirm.
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeDeleteAccountModal}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  isDeleting && styles.modalButtonDisabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonDeleteText]}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Data Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Data Deletion</Text>

            <Text style={styles.modalText}>
              This will permanently delete ALL your data from the Landline app, including:
            </Text>

            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Terms acceptance</Text>
              <Text style={styles.modalListItem}>• Notification logs</Text>
              <Text style={styles.modalListItem}>• App settings</Text>
            </View>

            <Text style={[styles.modalText, styles.modalWarning]}>
              This action cannot be undone!
            </Text>

            <Text style={styles.modalLabel}>
              Type <Text style={styles.modalHighlight}>DELETE</Text> to confirm:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Type DELETE here"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeDeleteModal}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  (confirmationText !== 'DELETE' || isDeleting) && styles.modalButtonDisabled,
                ]}
                onPress={handleDeleteAllData}
                disabled={confirmationText !== 'DELETE' || isDeleting}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonDeleteText]}>
                  {isDeleting ? 'Deleting...' : 'Delete All Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionButtonIcon: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
  },
  secondaryButtonSubtext: {
    color: '#555',
  },
  // Account card (authenticated)
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f5d87e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  verifyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#996600',
    lineHeight: 17,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Unauthenticated card
  unauthCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryAuthButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  primaryAuthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAuthButton: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    width: '100%',
  },
  secondaryAuthButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deletionInfoBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffd0cc',
    padding: 14,
    marginTop: 4,
  },
  deletionInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cc3b30',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValueEllipsis: {
    flex: 1,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 24,
    color: '#666',
    marginLeft: 10,
  },
  warningText: {
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  modalList: {
    marginLeft: 10,
    marginBottom: 12,
  },
  modalListItem: {
    fontSize: 14,
    lineHeight: 24,
    color: '#666',
  },
  modalWarning: {
    color: '#FF3B30',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  modalHighlight: {
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonDelete: {
    backgroundColor: '#FF3B30',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonDeleteText: {
    color: '#fff',
  },
});
