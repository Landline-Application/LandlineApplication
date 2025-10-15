import { LandlineColors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LandlineScreen() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleActivatePress = () => {
    setShowConfirmation(true);
  };

  const handleConfirmActivation = () => {
    // TODO: UI ONLY - No actual landline mode activation logic
    setShowConfirmation(false);
    router.push('/landline-active');
  };

  const handleCancelActivation = () => {
    setShowConfirmation(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Landline</Text>
        </View>

        {/* Main Activation Button */}
        <View style={styles.activationSection}>
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivatePress}
            activeOpacity={0.8}
          >
            <View style={styles.activateButtonContent}>
              <Text style={styles.activateButtonText}>Activate</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.tagline}>
            Disconnect from distractions.{'\n'}
            Only emergencies get through.
          </Text>
        </View>

        {/* Bottom Section - Future features */}
        <View style={styles.bottomSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <Text style={styles.placeholderText}>No recent sessions</Text>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={handleCancelActivation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Activate Landline Mode?</Text>
            <Text style={styles.confirmationText}>
              Notifications will be logged silently.{'\n'}
              Emergencies from selected contacts{'\n'}
              will break through.
            </Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelActivation}
              >
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmActivation}
              >
                <Text style={styles.confirmButtonText}>YES</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    textAlign: 'center',
  },
  activationSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateButton: {
    backgroundColor: LandlineColors.dark.primary,
    borderRadius: width * 0.25, // Makes it circular
    width: width * 0.5,
    height: width * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: LandlineColors.dark.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activateButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 16,
    color: LandlineColors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: LandlineColors.dark.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: LandlineColors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: LandlineColors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
