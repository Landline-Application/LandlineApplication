import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Contacts from 'expo-contacts';
import { router, useFocusEffect } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { LandlineColors } from '@/constants/theme';
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
  const [saving, setSaving] = useState(false);

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyEntry[]>(parseStoredContacts);
  const [initialEmergency, setInitialEmergency] = useState<EmergencyEntry[]>(parseStoredContacts);
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
        setInitialEmergency([...current]);
      } finally {
        setLoading(false);
      }
    }, []),
  );

  const mergeEmergencyEntries = useCallback((entries: EmergencyEntry[]) => {
    setEmergencyContacts((prev) => {
      const existingPhones = new Set(prev.map((e) => e.phone));
      const toAdd = entries.filter((e) => e.phone.length >= 7 && !existingPhones.has(e.phone));
      return [...prev, ...toAdd].sort((a, b) => a.phone.localeCompare(b.phone));
    });
  }, []);

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

  const onPickContact = useCallback(
    (contact: Contacts.Contact) => {
      const entries: EmergencyEntry[] =
        contact.phoneNumbers
          ?.map((p) => ({ name: contact.name ?? '', phone: normalizeDigits(p.number ?? '') }))
          .filter((e) => e.phone.length >= 7) ?? [];
      if (entries.length === 0) {
        Alert.alert(
          'No valid numbers',
          'That contact has no phone numbers with at least 7 digits.',
        );
        return;
      }
      mergeEmergencyEntries(entries);
      setContactPickerVisible(false);
    },
    [mergeEmergencyEntries],
  );

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

  const hasChanges = useMemo(() => {
    const currentSorted = [...emergencyNumbers].sort().join(',');
    const initialSorted = [...initialEmergency]
      .map((e) => e.phone)
      .sort()
      .join(',');
    return currentSorted !== initialSorted;
  }, [emergencyNumbers, initialEmergency]);

  const persist = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      setSaving(true);
      // Save emergency numbers to native storage
      NotificationApiManager.setEmergencyPhoneNumbers(emergencyNumbers);
      // Save with real contact names so Kotlin can match by name OR phone
      const emergencyContactsJson = JSON.stringify(
        emergencyContacts.map((e) => ({ name: e.name, phone: e.phone })),
      );
      NotificationApiManager.setEmergencyContactsJson(emergencyContactsJson);

      // Sync with Android starred contacts for DND call handling
      await syncEmergencyContactsWithStarred(emergencyNumbers);

      setInitialEmergency([...emergencyContacts]);
      Alert.alert(
        'Saved',
        'Emergency contacts saved. When Landline Mode is active:\n\n' +
          '• Text messages from emergency contacts will ring normally\n' +
          '• Calls from emergency contacts will ring (if starred in contacts)\n' +
          '• All other notifications will be logged silently',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save emergency contacts.');
    } finally {
      setSaving(false);
    }
  }, [emergencyContacts, emergencyNumbers, syncEmergencyContactsWithStarred]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved changes', 'Save before leaving?', [
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => void persist() },
      ]);
    } else {
      router.back();
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
          <Text style={styles.unsupportedTitle}>Android only</Text>
          <Text style={styles.unsupportedText}>
            Emergency contacts are only available on Android.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={LandlineColors.dark.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity
          onPress={() => void persist()}
          style={styles.headerBtn}
          disabled={saving || !hasChanges}
        >
          <Text
            style={[
              styles.headerBtnText,
              hasChanges && !saving ? styles.headerBtnTextActive : styles.headerBtnTextMuted,
            ]}
          >
            {saving ? '…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'static'}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Emergency Contacts</Text>
              <Text style={styles.descriptionText}>
                When Landline Mode is active, these contacts can reach you with sound. All other
                notifications will be logged silently.
              </Text>
            </View>

            <View style={styles.sectionHeaderRow}>
              <MaterialIcons
                name="phone-in-talk"
                size={18}
                color={LandlineColors.dark.text.secondary}
              />
              <Text style={styles.sectionHeader}>Emergency contact numbers</Text>
            </View>
            <Text style={styles.hint}>
              Add phone numbers that can ring through when Landline Mode is on. Minimum 7 digits per
              entry.
            </Text>

            <TouchableOpacity
              style={styles.primaryOutlineButton}
              onPress={openContactPicker}
              activeOpacity={0.8}
            >
              <MaterialIcons name="contact-phone" size={20} color={LandlineColors.dark.primary} />
              <Text style={styles.primaryOutlineButtonText}>Add from contacts</Text>
            </TouchableOpacity>

            {emergencyContacts.map((entry) => (
              <View key={entry.phone} style={styles.emergencyRow}>
                <View>
                  {entry.name ? <Text style={styles.emergencyName}>{entry.name}</Text> : null}
                  <Text style={styles.emergencyDigits}>{entry.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.emergencyRemoveBtn}
                  onPress={() =>
                    setEmergencyContacts((prev) => prev.filter((e) => e.phone !== entry.phone))
                  }
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={20} color={LandlineColors.dark.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addManualRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Enter phone number"
                placeholderTextColor={LandlineColors.dark.text.muted}
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
                  const digits = normalizeDigits(newPhone);
                  if (digits.length >= 7) {
                    if (!emergencyNumbers.includes(digits)) {
                      setEmergencyContacts((prev) =>
                        [...prev, { name: '', phone: digits }].sort((a, b) =>
                          a.phone.localeCompare(b.phone),
                        ),
                      );
                    }
                    setNewPhone('');
                  }
                }}
                disabled={normalizeDigits(newPhone).length < 7}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <MaterialIcons name="info" size={16} color={LandlineColors.dark.text.secondary} />
              <Text style={styles.infoText}>
                Calls from emergency contacts will ring if the contact is starred in your Android
                Contacts app. Text messages will ring based on number matching.
              </Text>
            </View>
          </>
        }
        renderItem={() => null}
      />

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
              <MaterialIcons name="search" size={20} color={LandlineColors.dark.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts"
                placeholderTextColor={LandlineColors.dark.text.muted}
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
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name ?? 'Unknown'}</Text>
                    <Text style={styles.contactNumber}>{item.phoneNumbers?.[0]?.number ?? ''}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={LandlineColors.dark.text.muted}
                  />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No contacts found</Text>
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
    backgroundColor: LandlineColors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.border,
  },
  headerBtn: {
    paddingVertical: 8,
    minWidth: 60,
  },
  headerBtnText: {
    color: LandlineColors.dark.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  headerBtnTextActive: {
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  headerBtnTextMuted: {
    color: LandlineColors.dark.text.muted,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: LandlineColors.dark.text.primary,
  },
  descriptionSection: {
    padding: 20,
    backgroundColor: LandlineColors.dark.card,
    margin: 16,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LandlineColors.dark.text.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: LandlineColors.dark.text.secondary,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: LandlineColors.dark.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    color: LandlineColors.dark.text.muted,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: LandlineColors.dark.primary,
    borderRadius: 8,
  },
  primaryOutlineButtonText: {
    color: LandlineColors.dark.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LandlineColors.dark.card,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  emergencyName: {
    fontSize: 15,
    fontWeight: '600',
    color: LandlineColors.dark.text.primary,
    marginBottom: 2,
  },
  emergencyDigits: {
    fontSize: 14,
    color: LandlineColors.dark.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  emergencyRemoveBtn: {
    padding: 4,
  },
  addManualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  addInput: {
    flex: 1,
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: LandlineColors.dark.text.primary,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: LandlineColors.dark.primary,
    borderRadius: 8,
    padding: 12,
  },
  addButtonDisabled: {
    backgroundColor: LandlineColors.dark.border,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: LandlineColors.dark.text.secondary,
    lineHeight: 18,
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LandlineColors.dark.text.primary,
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 15,
    color: LandlineColors.dark.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: LandlineColors.dark.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: LandlineColors.dark.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LandlineColors.dark.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: LandlineColors.dark.text.primary,
  },
  modalCancel: {
    fontSize: 15,
    color: LandlineColors.dark.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: LandlineColors.dark.text.primary,
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LandlineColors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    color: LandlineColors.dark.text.primary,
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 14,
    color: LandlineColors.dark.text.secondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: LandlineColors.dark.border,
    marginLeft: 68,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: LandlineColors.dark.text.muted,
  },
});
