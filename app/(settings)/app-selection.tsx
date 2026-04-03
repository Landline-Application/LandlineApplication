import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { LandlineColors } from '@/constants/theme';
import * as DndManager from '@/modules/dnd-manager';
import type { AppInfo } from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/** Common messaging apps — notifications from these can bypass Landline Mode when selected. */
const BYPASS_PRESET_MESSAGING = [
  'com.google.android.apps.messaging',
  'com.whatsapp',
  'com.facebook.orca',
  'org.telegram.messenger',
  'com.snapchat.android',
] as const;

const BYPASS_PRESET_CALLS = [
  'com.google.android.dialer',
  'com.android.dialer',
  'com.samsung.android.dialer',
] as const;

export default function AppSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [allowedPackages, setAllowedPackages] = useState<Set<string>>(new Set());
  const [initialAllowed, setInitialAllowed] = useState<Set<string>>(new Set());
  const [initialFilterEnabled, setInitialFilterEnabled] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState<string[]>([]);
  const [initialEmergency, setInitialEmergency] = useState<string[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [contactList, setContactList] = useState<Contacts.Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const load = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [apps, enabled, packages, emergency] = await Promise.all([
        DndManager.getAllInstalledApps(false),
        Promise.resolve(NotificationApiManager.isNotificationFilterEnabled()),
        Promise.resolve(NotificationApiManager.getAllowedNotificationPackages()),
        Promise.resolve(NotificationApiManager.getEmergencyPhoneNumbers()),
      ]);
      setInstalledApps(apps);
      setFilterEnabled(enabled);
      setInitialFilterEnabled(enabled);
      const pkgSet = new Set(packages);
      setAllowedPackages(pkgSet);
      setInitialAllowed(new Set(packages));
      setEmergencyNumbers(emergency);
      setInitialEmergency([...emergency]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load notification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasChanges = useMemo(() => {
    if (filterEnabled !== initialFilterEnabled) return true;
    if (emergencyNumbers.length !== initialEmergency.length) return true;
    for (let i = 0; i < emergencyNumbers.length; i++) {
      if (emergencyNumbers[i] !== initialEmergency[i]) return true;
    }
    if (allowedPackages.size !== initialAllowed.size) return true;
    for (const p of allowedPackages) {
      if (!initialAllowed.has(p)) return true;
    }
    for (const p of initialAllowed) {
      if (!allowedPackages.has(p)) return true;
    }
    return false;
  }, [
    filterEnabled,
    initialFilterEnabled,
    allowedPackages,
    initialAllowed,
    emergencyNumbers,
    initialEmergency,
  ]);

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return installedApps;
    const q = searchQuery.toLowerCase();
    return installedApps.filter(
      (a) => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [installedApps, searchQuery]);

  const togglePackage = useCallback((packageName: string) => {
    setAllowedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageName)) next.delete(packageName);
      else next.add(packageName);
      return next;
    });
  }, []);

  const addEmergency = useCallback(() => {
    const digits = normalizeDigits(newPhone);
    if (digits.length < 7) {
      Alert.alert('Invalid number', 'Enter at least 7 digits for an emergency contact.');
      return;
    }
    if (emergencyNumbers.includes(digits)) {
      setNewPhone('');
      return;
    }
    setEmergencyNumbers((prev) => [...prev, digits].sort());
    setNewPhone('');
  }, [newPhone, emergencyNumbers]);

  const removeEmergency = useCallback((digits: string) => {
    setEmergencyNumbers((prev) => prev.filter((d) => d !== digits));
  }, []);

  const mergeEmergencyDigits = useCallback((newDigits: string[]) => {
    setEmergencyNumbers((prev) => {
      const next = new Set(prev);
      for (const d of newDigits) {
        if (d.length >= 7) next.add(d);
      }
      return [...next].sort();
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
      const digitsList =
        contact.phoneNumbers
          ?.map((p) => normalizeDigits(p.number ?? ''))
          .filter((d) => d.length >= 7) ?? [];
      if (digitsList.length === 0) {
        Alert.alert(
          'No valid numbers',
          'That contact has no phone numbers with at least 7 digits.',
        );
        return;
      }
      mergeEmergencyDigits(digitsList);
      setContactPickerVisible(false);
    },
    [mergeEmergencyDigits],
  );

  const addBypassPreset = useCallback(
    (packageNames: readonly string[]) => {
      setAllowedPackages((prev) => {
        const next = new Set(prev);
        for (const p of packageNames) {
          if (installedApps.some((a) => a.packageName === p)) {
            next.add(p);
          }
        }
        return next;
      });
    },
    [installedApps],
  );

  const filteredContacts = useMemo(
    () =>
      contactList.filter((c) => (c.name ?? '').toLowerCase().includes(contactSearch.toLowerCase())),
    [contactList, contactSearch],
  );

  const persist = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    if (filterEnabled && allowedPackages.size === 0 && emergencyNumbers.length === 0) {
      Alert.alert(
        'Nothing configured',
        'Add at least one app that bypasses Landline Mode, or an emergency number, or turn off notification permissions.',
      );
      return;
    }
    try {
      setSaving(true);
      NotificationApiManager.setNotificationFilterEnabled(filterEnabled);
      NotificationApiManager.setAllowedNotificationPackages([...allowedPackages]);
      NotificationApiManager.setEmergencyPhoneNumbers(emergencyNumbers);
      setInitialFilterEnabled(filterEnabled);
      setInitialAllowed(new Set(allowedPackages));
      setInitialEmergency([...emergencyNumbers]);
      Alert.alert(
        'Saved',
        filterEnabled
          ? 'Only selected apps and matching emergency numbers can keep notifications during Landline Mode.'
          : 'Notification permissions are off. Landline Mode can use full Do Not Disturb as before.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }, [filterEnabled, allowedPackages, emergencyNumbers]);

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
            Notification permissions use Android notification access. They are not available on this
            platform.
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
          <Text style={styles.loadingText}>Loading apps…</Text>
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
        <Text style={styles.headerTitle}>Notification permissions</Text>
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
        data={filteredApps}
        keyExtractor={(item) => item.packageName}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Landline Mode</Text>
              <Text style={styles.descriptionText}>
                When notification permissions are on and Landline Mode is active, only notifications
                from apps you allow below (bypass), or from senders whose number appears in the
                alert text (emergency contacts), stay in the shade. Other notifications are cleared
                automatically.
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelWrap}>
                <Text style={styles.toggleTitle}>Use notification permissions</Text>
                <Text style={styles.toggleSub}>
                  Restrict alerts during Landline Mode (requires notification access)
                </Text>
              </View>
              <Switch
                value={filterEnabled}
                onValueChange={setFilterEnabled}
                trackColor={{
                  false: LandlineColors.dark.border,
                  true: LandlineColors.dark.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <MaterialIcons
                name="phone-in-talk"
                size={18}
                color={LandlineColors.dark.text.secondary}
              />
              <Text style={styles.sectionHeader}>Emergency contacts</Text>
            </View>
            <Text style={styles.hint}>
              Numbers are matched against digits in notification text (e.g. SMS). Add manually or
              pick from contacts. Minimum 7 digits per entry.
            </Text>

            <TouchableOpacity
              style={styles.primaryOutlineButton}
              onPress={openContactPicker}
              activeOpacity={0.8}
            >
              <MaterialIcons name="contact-phone" size={20} color={LandlineColors.dark.primary} />
              <Text style={styles.primaryOutlineButtonText}>Add from contacts</Text>
            </TouchableOpacity>

            {emergencyNumbers.map((num) => (
              <View key={num} style={styles.emergencyRow}>
                <Text style={styles.emergencyDigits}>{num}</Text>
                <TouchableOpacity onPress={() => removeEmergency(num)} hitSlop={12}>
                  <MaterialIcons name="close" size={22} color={LandlineColors.dark.text.muted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Add number"
                placeholderTextColor={LandlineColors.dark.text.muted}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <TouchableOpacity style={styles.addButton} onPress={addEmergency}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeaderRow, styles.appsHeader]}>
              <MaterialIcons name="apps" size={18} color={LandlineColors.dark.text.secondary} />
              <Text style={styles.sectionHeader}>Apps that bypass Landline Mode</Text>
              <Text style={styles.appsCount}>{allowedPackages.size} selected</Text>
            </View>
            <Text style={styles.hint}>
              Selected apps can still show notifications while Landline Mode is on. Use quick add
              for common apps, then refine the list below.
            </Text>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => addBypassPreset(BYPASS_PRESET_MESSAGING)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>+ Messaging</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => addBypassPreset(BYPASS_PRESET_CALLS)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>+ Phone</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={16}
                color={LandlineColors.dark.text.muted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search installed apps…"
                placeholderTextColor={LandlineColors.dark.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.appItem}>
            <View style={styles.appIconContainer}>
              <Text style={styles.appIconText}>{item.appName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName} numberOfLines={1}>
                {item.appName}
              </Text>
              <Text style={styles.appPackage} numberOfLines={1}>
                {item.packageName}
              </Text>
            </View>
            <Switch
              value={allowedPackages.has(item.packageName)}
              onValueChange={() => togglePackage(item.packageName)}
              trackColor={{
                false: LandlineColors.dark.border,
                true: LandlineColors.dark.primary,
              }}
              thumbColor={
                allowedPackages.has(item.packageName) ? '#fff' : LandlineColors.dark.text.secondary
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No apps match your search.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={contactPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add emergency contact</Text>
              <TouchableOpacity onPress={() => setContactPickerVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchWrap}>
              <TextInput
                style={styles.modalSearch}
                placeholder="Search contacts…"
                placeholderTextColor={LandlineColors.dark.text.muted}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => `${item.name ?? 'c'}-${index}`}
              keyboardShouldPersistTaps="handled"
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onPickContact(item)}
                  activeOpacity={0.7}
                  style={styles.modalRow}
                >
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {(item.name ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalRowText}>
                    <Text style={styles.modalName} numberOfLines={1}>
                      {item.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.modalPhone} numberOfLines={1}>
                      {item.phoneNumbers?.[0]?.number ?? ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
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
    backgroundColor: LandlineColors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: LandlineColors.dark.text.secondary,
  },
  unsupportedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 14,
    color: LandlineColors.dark.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 72,
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.primary,
  },
  headerBtnTextActive: {
    color: LandlineColors.dark.primary,
  },
  headerBtnTextMuted: {
    color: LandlineColors.dark.text.muted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LandlineColors.dark.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  descriptionSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  descriptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: LandlineColors.dark.text.secondary,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  toggleLabelWrap: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  toggleSub: {
    fontSize: 12,
    color: LandlineColors.dark.text.muted,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    gap: 8,
  },
  appsHeader: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    flex: 1,
  },
  appsCount: {
    fontSize: 12,
    color: LandlineColors.dark.text.muted,
  },
  hint: {
    fontSize: 13,
    color: LandlineColors.dark.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  emergencyDigits: {
    fontSize: 16,
    color: LandlineColors.dark.text,
    letterSpacing: 0.5,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: LandlineColors.dark.text,
  },
  addButton: {
    backgroundColor: LandlineColors.dark.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: LandlineColors.dark.text,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: LandlineColors.dark.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: LandlineColors.dark.primary,
  },
  appInfo: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  appPackage: {
    fontSize: 11,
    color: LandlineColors.dark.text.muted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: LandlineColors.dark.text.muted,
  },
  primaryOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LandlineColors.dark.primary,
  },
  primaryOutlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.primary,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: LandlineColors.dark.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: LandlineColors.dark.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: LandlineColors.dark.text,
  },
  modalCancel: {
    fontSize: 15,
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  modalSearchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalSearch: {
    backgroundColor: LandlineColors.dark.card,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: LandlineColors.dark.text,
    fontSize: 14,
  },
  modalList: {
    maxHeight: 400,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LandlineColors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalRowText: {
    flex: 1,
    minWidth: 0,
  },
  modalName: {
    fontSize: 15,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  modalPhone: {
    fontSize: 12,
    color: LandlineColors.dark.text.secondary,
    marginTop: 2,
  },
  modalEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: LandlineColors.dark.text.muted,
    fontSize: 14,
  },
});
