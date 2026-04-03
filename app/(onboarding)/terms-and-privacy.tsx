import React, { useState } from 'react';

import {
  Alert,
  GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Blob, Button, Card, Page } from '@/components/onboarding/onboarding-primitives';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@/constants/legal-content';
import { COLORS, Fonts } from '@/constants/theme';
import { markOnboardingComplete } from '@/utils/onboarding-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsAndPrivacyScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState<'terms' | 'privacy' | null>(null);
  const insets = useSafeAreaInsets();

  const handleAgree = async () => {
    if (!agreedToTerms) return;

    setIsLoading(true);
    try {
      await markOnboardingComplete();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Page
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Blob
          color={COLORS.primary}
          size={240}
          top={-60}
          right={-80}
          opacity={0.06}
          shapeIndex={3}
        />
        <Blob
          color={COLORS.accent}
          size={180}
          bottom={140}
          left={-60}
          opacity={0.1}
          shapeIndex={1}
        />

        <View style={styles.container}>
          <OnboardingProgress
            total={3}
            current={2}
            labels={['Permissions', 'Account', 'Privacy']}
          />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Almost there</Text>
            <Text style={styles.subtitle}>Review our privacy commitments before you begin.</Text>

            {/* Privacy summary card */}
            <Card shapeVariant={0} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>We respect your privacy</Text>

              {[
                {
                  icon: 'lock-outline' as const,
                  text: 'Notifications stored locally on your device',
                },
                { icon: 'block' as const, text: 'We never sell your data' },
                { icon: 'security' as const, text: 'Cloud backups use end-to-end encryption' },
                { icon: 'public' as const, text: 'Compliant with GDPR and CCPA' },
              ].map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <MaterialIcons name={item.icon} size={20} color={COLORS.primary} />
                  <Text style={styles.bulletText}>{item.text}</Text>
                </View>
              ))}
            </Card>

            {/* Agreement checkbox */}
            <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkboxRow}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <MaterialIcons name="check" size={20} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text
                  style={styles.link}
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation?.();
                    setShowModal('terms');
                  }}
                >
                  Terms of Service
                </Text>
                {' and '}
                <Text
                  style={styles.link}
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation?.();
                    setShowModal('privacy');
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>
          </ScrollView>

          {/* Enter button */}
          <View style={styles.bottomBar}>
            <Button
              label="Enter Landline"
              onPress={handleAgree}
              variant="primary"
              disabled={!agreedToTerms || isLoading}
              loading={isLoading}
              style={styles.enterButton}
            />
          </View>
        </View>
      </Page>

      {/* Full text modal */}
      <Modal
        visible={showModal !== null}
        onDismiss={() => setShowModal(null)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.modalTitle}>
              {showModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                {showModal === 'terms' ? TERMS_OF_USE : PRIVACY_POLICY}
              </Text>
            </ScrollView>

            <Button
              label="Close"
              onPress={() => setShowModal(null)}
              variant="outline"
              style={styles.closeButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    marginBottom: 28,
    lineHeight: 24,
  },

  // Summary card
  summaryCard: {
    marginBottom: 28,
  },
  summaryTitle: {
    fontFamily: Fonts?.serif ?? 'Fraunces_600SemiBold',
    fontSize: 20,
    color: COLORS.foreground,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  bulletText: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.accentForeground,
    flex: 1,
    lineHeight: 22,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.foreground,
    lineHeight: 22,
  },
  link: {
    fontFamily: Fonts?.sansBold ?? 'Nunito_700Bold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Bottom
  bottomBar: {
    paddingVertical: 16,
  },
  enterButton: {
    width: '100%',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 36, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalTitle: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 24,
    color: COLORS.foreground,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: '70%',
    marginBottom: 16,
  },
  modalBody: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    color: COLORS.accentForeground,
    fontSize: 14,
    lineHeight: 22,
  },
  closeButton: {
    width: '100%',
  },
});
