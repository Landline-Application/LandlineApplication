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

import { router, useRouter } from 'expo-router';

import { clearAcceptance } from '@/utils/acceptance-storage';
import { StorageManager } from '@/utils/storage/storage-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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

      {/* Auto-Reply Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Auto-Reply</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/auto-reply-settings')}
        >
          <Text style={styles.actionButtonText}>Configure Auto-Reply</Text>
          <Text style={styles.actionButtonSubtext}>
            Set up out-of-office message templates and reply preferences
          </Text>
        </TouchableOpacity>
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
          title="🔄 Reset Terms Acceptance (Testing)"
          onPress={resetTermsAcceptance}
          color="#ff6b6b"
        />
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data Management</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Text style={styles.actionButtonText}>📤 Export My Data</Text>
          <Text style={styles.actionButtonSubtext}>Download a copy of your data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={openDeleteModal}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            🗑️ Delete All My Data
          </Text>
          <Text style={styles.actionButtonSubtext}>
            Permanently remove all your data from this app
          </Text>
        </TouchableOpacity>
      </View>

      {/* Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>About Data Deletion</Text>
        <Text style={styles.infoText}>
          When you delete your data, the following will be permanently removed:
        </Text>
        <Text style={styles.bulletPoint}>• Terms of Use acceptance record</Text>
        <Text style={styles.bulletPoint}>• All captured notification logs</Text>
        <Text style={styles.bulletPoint}>• Landline mode settings</Text>
        <Text style={styles.bulletPoint}>• All app preferences and settings</Text>
        <Text style={[styles.infoText, styles.warningText]}>
          This action cannot be undone. Consider exporting your data first.
        </Text>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Confirm Data Deletion</Text>

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
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
