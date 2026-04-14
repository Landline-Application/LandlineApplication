import React, { useEffect, useState } from 'react';

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
import { type LegalDocKey, PRIVACY_POLICY, TERMS_OF_USE } from '@/constants/legal-content';
import { COLORS, Fonts } from '@/constants/theme';
import { changedLegalDocs, markLegalAccepted } from '@/utils/onboarding-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DOC_LABELS: Record<LegalDocKey, string> = {
  tos: 'Terms of Service',
  privacy: 'Privacy Policy',
  riskAck: 'Acknowledgment of Risk',
};

export default function LegalUpdateScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState<'terms' | 'privacy' | null>(null);
  const [changed, setChanged] = useState<LegalDocKey[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    changedLegalDocs().then(setChanged);
  }, []);

  const needsTos = changed.includes('tos') || changed.includes('privacy');
  const needsRisk = changed.includes('riskAck');

  const handleAgree = async () => {
    if (needsTos && !agreedToTerms) return;
    if (needsRisk && !acknowledgedRisk) return;

    setIsLoading(true);
    try {
      await markLegalAccepted();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = (!needsTos || agreedToTerms) && (!needsRisk || acknowledgedRisk);

  return (
    <>
      <Page style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
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
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>We&apos;ve updated our policies</Text>
            <Text style={styles.subtitle}>
              Please review and accept the updated documents to continue using Landline.
            </Text>

            <Card shapeVariant={0} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>What changed</Text>
              {changed.length === 0 ? (
                <Text style={styles.bulletText}>Loading…</Text>
              ) : (
                changed.map((k) => (
                  <View key={k} style={styles.bulletRow}>
                    <MaterialIcons name="fiber-new" size={20} color={COLORS.primary} />
                    <Text style={styles.bulletText}>{DOC_LABELS[k]}</Text>
                  </View>
                ))
              )}
            </Card>

            {needsTos && (
              <Pressable
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                style={styles.checkboxRow}
              >
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
            )}

            {needsRisk && (
              <Pressable
                onPress={() => setAcknowledgedRisk(!acknowledgedRisk)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, acknowledgedRisk && styles.checkboxChecked]}>
                  {acknowledgedRisk && <MaterialIcons name="check" size={20} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I understand and agree that by using this App, notifications, calls, and messages
                  may be delayed, diverted, or not shown to me in real time. I accept full
                  responsibility for any missed or delayed communications, including emergencies,
                  and I agree that Landline is not liable for any resulting consequences.
                </Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={styles.bottomBar}>
            <Button
              label="Continue"
              onPress={handleAgree}
              variant="primary"
              disabled={!canContinue || isLoading}
              loading={isLoading}
              style={styles.enterButton}
            />
          </View>
        </View>
      </Page>

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
  container: { flex: 1, paddingHorizontal: 24, zIndex: 2 },
  content: { flex: 1 },
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
  summaryCard: { marginBottom: 28 },
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
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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
  bottomBar: { paddingVertical: 16 },
  enterButton: { width: '100%' },
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
  modalScroll: { maxHeight: '70%', marginBottom: 16 },
  modalBody: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    color: COLORS.accentForeground,
    fontSize: 14,
    lineHeight: 22,
  },
  closeButton: { width: '100%' },
});
