import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Contacts from 'expo-contacts';
import { router, useFocusEffect } from 'expo-router';

import { TutorialReturnHint } from '@/components/tutorial/tutorial-return-hint';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

type EmergencyEntry = { name: string; phone: string };

function parseStoredContacts(): EmergencyEntry[] {
  if (Platform.OS !== 'android') return [];
  try {
    const json = NotificationApiManager.getEmergencyContactsJson();
    if (json) {
      const parsed = JSON.parse(json) as { name?: string; phone?: string }[];
      const entries = parsed
        .map((e) => ({ name: e.name ?? '', phone: normalizeDigits(e.phone ?? '') }))
        .filter((e) => e.phone.length >= 7);
      if (entries.length > 0) return entries;
    }
  } catch {}
  // Fallback: legacy phone-number-only storage
  return NotificationApiManager.getEmergencyPhoneNumbers().map((p) => ({ name: '', phone: p }));
}

export default function EmergencyContactsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyEntry[]>(parseStoredContacts);
  // Flat list of digits for backward-compat APIs
  const emergencyNumbers = emergencyContacts.map((e) => e.phone);

  const [newPhone, setNewPhone] = useState('');
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [contactList, setContactList] = useState<Contacts.Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  // Load emergency numbers on every focus
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const current = parseStoredContacts();
        setEmergencyContacts(current);
      } finally {
        setLoading(false);
      }
    }, []),
  );

  const addEmergencyEntries = async (entries: EmergencyEntry[]) => {
    const existingPhones = new Set(emergencyContacts.map((e) => e.phone));
    const toAdd = entries.filter((e) => e.phone.length >= 7 && !existingPhones.has(e.phone));
    if (toAdd.length === 0) return;
    const newContacts = [...emergencyContacts, ...toAdd].sort((a, b) =>
      a.phone.localeCompare(b.phone),
    );
    setEmergencyContacts(newContacts);
    // Save immediately
    await saveContacts(newContacts);
  };

  const removeEmergencyContact = async (phone: string) => {
    const newContacts = emergencyContacts.filter((e) => e.phone !== phone);
    setEmergencyContacts(newContacts);
    // Save immediately
    await saveContacts(newContacts);
  };

  const addManualContact = async (phone: string) => {
    const digits = normalizeDigits(phone);
    if (digits.length < 7) return;
    if (emergencyNumbers.includes(digits)) return;
    const newContacts = [...emergencyContacts, { name: '', phone: digits }].sort((a, b) =>
      a.phone.localeCompare(b.phone),
    );
    setEmergencyContacts(newContacts);
    // Save immediately
    await saveContacts(newContacts);
  };

  const openContactPicker = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow contacts access to add numbers from your address book.',
      );
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });
    const withPhone = data
      .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (withPhone.length === 0) {
      Alert.alert('No contacts', 'No contacts with phone numbers were found.');
      return;
    }
    setContactList(withPhone);
    setContactSearch('');
    setContactPickerVisible(true);
  }, []);

  const onPickContact = async (contact: Contacts.Contact) => {
    const entries: EmergencyEntry[] =
      contact.phoneNumbers
        ?.map((p) => ({ name: contact.name ?? '', phone: normalizeDigits(p.number ?? '') }))
        .filter((e) => e.phone.length >= 7) ?? [];
    if (entries.length === 0) {
      Alert.alert('No valid numbers', 'That contact has no phone numbers with at least 7 digits.');
      return;
    }
    await addEmergencyEntries(entries);
    setContactPickerVisible(false);
  };

  const filteredContacts = useMemo(
    () =>
      contactList.filter((c) => (c.name ?? '').toLowerCase().includes(contactSearch.toLowerCase())),
    [contactList, contactSearch],
  );

  // Sync emergency contacts with Android starred contacts
  const syncEmergencyContactsWithStarred = useCallback(async (phoneNumbers: string[]) => {
    if (Platform.OS !== 'android') return;

    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Contacts permission not granted, cannot sync starred status');
        if (canAskAgain) {
          Alert.alert(
            'Contacts Permission Needed',
            'To automatically sync emergency contacts with starred contacts for call handling, please allow contacts access.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Grant Access', onPress: () => Contacts.requestPermissionsAsync() },
            ],
          );
        }
        return;
      }

      // Get all contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.IsFavorite],
      });

      let starredCount = 0;
      let unmatchedEmergencies: string[] = [];

      // For each contact, check if any of their numbers match emergency numbers
      for (const contact of data) {
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) continue;

        const contactDigits = contact.phoneNumbers
          .map((p) => normalizeDigits(p.number ?? ''))
          .filter((d) => d.length >= 7);

        // Check if this contact has any emergency number
        const matchedEmergency = phoneNumbers.find((emergency) =>
          contactDigits.some((digits) => {
            // Match last 10 digits for flexibility
            const emergencyLast10 = emergency.slice(-10);
            const contactLast10 = digits.slice(-10);
            return emergencyLast10 === contactLast10;
          }),
        );

        const isEmergencyContact = !!matchedEmergency;

        // Update starred status if needed
        if (isEmergencyContact && !contact.isFavorite) {
          try {
            await Contacts.updateContactAsync({
              id: contact.id,
              [Contacts.Fields.IsFavorite]: true,
            });
            starredCount++;
            console.log(`Starred contact: ${contact.name}`);
          } catch (updateErr) {
            console.error(`Failed to star contact ${contact.name}:`, updateErr);
          }
        } else if (!isEmergencyContact && contact.isFavorite) {
          // Unstar contacts that are no longer emergency contacts
          try {
            await Contacts.updateContactAsync({
              id: contact.id,
              [Contacts.Fields.IsFavorite]: false,
            });
            console.log(`Unstarred contact: ${contact.name}`);
          } catch (updateErr) {
            console.error(`Failed to unstar contact ${contact.name}:`, updateErr);
          }
        }
      }

      // Check for emergency numbers that didn't match any contact
      for (const emergency of phoneNumbers) {
        const hasMatch = data.some((contact) =>
          contact.phoneNumbers?.some((p) => {
            const digits = normalizeDigits(p.number ?? '');
            return digits.slice(-10) === emergency.slice(-10);
          }),
        );
        if (!hasMatch) {
          unmatchedEmergencies.push(emergency);
        }
      }

      if (starredCount > 0) {
        console.log(`Successfully starred ${starredCount} emergency contacts`);
      }
      if (unmatchedEmergencies.length > 0) {
        console.warn('Emergency numbers not found in contacts:', unmatchedEmergencies);
      }
    } catch (e) {
      console.error('Failed to sync emergency contacts with starred contacts:', e);
    }
  }, []);

  // Save contacts to native storage
  const saveContacts = async (contacts: EmergencyEntry[]) => {
    if (Platform.OS !== 'android') return;
    try {
      const phones = contacts.map((e) => e.phone);
      // Save emergency numbers to native storage
      NotificationApiManager.setEmergencyPhoneNumbers(phones);
      // Save with real contact names so Kotlin can match by name OR phone
      const emergencyContactsJson = JSON.stringify(
        contacts.map((e) => ({ name: e.name, phone: e.phone })),
      );
      NotificationApiManager.setEmergencyContactsJson(emergencyContactsJson);

      // Sync with Android starred contacts for DND call handling
      await syncEmergencyContactsWithStarred(phones);
    } catch (e) {
      console.error('Failed to save emergency contacts:', e);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Contacts</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="phone-android" size={48} color={COLORS.text.muted} />
          <Text style={styles.unsupportedTitle}>Android Only</Text>
          <Text style={styles.unsupportedText}>
            Emergency contacts are only available on Android.
          </Text>
          <TouchableOpacity style={styles.unsupportedButton} onPress={() => router.back()}>
            <Text style={styles.unsupportedButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Contacts</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <TutorialReturnHint />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Description Card ── */}
        <View style={styles.section}>
          <View style={styles.descriptionCard}>
            <MaterialIcons name="phone-in-talk" size={20} color={COLORS.primary} />
            <View style={styles.descriptionTextContainer}>
              <Text style={styles.descriptionTitle}>Emergency Contacts</Text>
              <Text style={styles.descriptionText}>
                When Landline Mode is active, these contacts can reach you with sound. All other
                notifications will be logged silently.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Contact List ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Emergency Numbers</Text>

          {/* Add from Contacts Button */}
          <TouchableOpacity
            style={styles.addFromContactsButton}
            onPress={openContactPicker}
            activeOpacity={0.8}
          >
            <MaterialIcons name="contact-phone" size={20} color={COLORS.primary} />
            <Text style={styles.addFromContactsText}>Add from contacts</Text>
          </TouchableOpacity>

          {/* Contact List */}
          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="contact-phone" size={32} color={COLORS.text.muted} />
              <Text style={styles.emptyTitle}>No emergency contacts</Text>
              <Text style={styles.emptyText}>
                Add phone numbers that can ring through when Landline Mode is on.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {emergencyContacts.map((entry, index) => (
                <View
                  key={entry.phone}
                  style={[
                    styles.contactRow,
                    index === emergencyContacts.length - 1 && styles.contactRowLast,
                  ]}
                >
                  <View style={styles.contactInfo}>
                    {entry.name ? <Text style={styles.contactName}>{entry.name}</Text> : null}
                    <Text style={styles.contactNumber}>{entry.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => void removeEmergencyContact(entry.phone)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Manual Add */}
          <View style={styles.manualAddSection}>
            <Text style={styles.cardSectionTitle}>Add Manually</Text>
            <View style={styles.manualAddRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Enter phone number (min 7 digits)"
                placeholderTextColor={COLORS.text.muted}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  normalizeDigits(newPhone).length < 7 && styles.addButtonDisabled,
                ]}
                onPress={() => {
                  void addManualContact(newPhone);
                  setNewPhone('');
                }}
                disabled={normalizeDigits(newPhone).length < 7}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color={COLORS.text.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Info Footer ── */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.text.muted} />
          <Text style={styles.infoText}>
            Calls from emergency contacts will ring if the contact is starred in your Android
            Contacts app. Text messages will ring based on number matching.
          </Text>
        </View>

        <View style={{ height: Spacing.jumbo }} />
      </ScrollView>

      {/* Contact Picker Modal */}
      <Modal
        visible={contactPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select contact</Text>
              <TouchableOpacity onPress={() => setContactPickerVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={COLORS.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts"
                placeholderTextColor={COLORS.text.muted}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => `${item.name ?? 'unknown'}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => onPickContact(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {(item.name ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactItemInfo}>
                    <Text style={styles.contactItemName}>{item.name ?? 'Unknown'}</Text>
                    <Text style={styles.contactItemNumber}>
                      {item.phoneNumbers?.[0]?.number ?? ''}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={COLORS.text.muted} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>No contacts found</Text>
                </View>
              }
            />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 14,
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_700Bold',
  },
  saveButtonTextMuted: {
    color: COLORS.text.muted,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Center container (loading/unsupported)
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  unsupportedText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  unsupportedButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
  },
  unsupportedButtonText: {
    color: COLORS.text.onPrimary,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },

  // Section
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },

  // Card container
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Shadows.sm,
  },
  cardSectionTitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  // Description card
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    padding: Spacing.lg,
  },
  descriptionTextContainer: {
    flex: 1,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
    fontFamily: 'Nunito_700Bold',
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },

  // Add from contacts button
  addFromContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: Radius.md,
    backgroundColor: `${COLORS.primary}08`,
  },
  addFromContactsText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Contact row
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    fontVariant: ['tabular-nums'],
  },
  removeButton: {
    padding: Spacing.xs,
  },

  // Manual add
  manualAddSection: {
    marginTop: Spacing.lg,
  },
  manualAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.surface.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: COLORS.foreground,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 17,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  modalCancel: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    color: COLORS.foreground,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: COLORS.text.onPrimary,
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  contactItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactItemName: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  contactItemNumber: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
  modalEmptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
});
