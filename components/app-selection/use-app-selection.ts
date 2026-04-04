import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';

import * as Contacts from 'expo-contacts';

import * as DndManager from '@/modules/dnd-manager';
import type { AppInfo } from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';

export function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/** Common messaging apps — notifications from these can bypass Landline Mode when selected. */
export const BYPASS_PRESET_MESSAGING = [
  'com.google.android.apps.messaging',
  'com.whatsapp',
  'com.facebook.orca',
  'org.telegram.messenger',
  'com.snapchat.android',
] as const;

export const BYPASS_PRESET_CALLS = [
  'com.google.android.dialer',
  'com.android.dialer',
  'com.samsung.android.dialer',
] as const;

export type UseAppSelectionOptions = {
  /** Called when the user dismisses the “Saved” success alert. Default: no-op. */
  onSaveSuccessDismiss?: () => void;
};

export function useAppSelection(options: UseAppSelectionOptions = {}) {
  const { onSaveSuccessDismiss = () => {} } = options;

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
      (a) =>
        a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
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
      Alert.alert('Permission needed', 'Allow contacts access to add numbers from your address book.');
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
        contact.phoneNumbers?.map((p) => normalizeDigits(p.number ?? '')).filter((d) => d.length >= 7) ??
        [];
      if (digitsList.length === 0) {
        Alert.alert('No valid numbers', 'That contact has no phone numbers with at least 7 digits.');
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
      contactList.filter((c) =>
        (c.name ?? '').toLowerCase().includes(contactSearch.toLowerCase()),
      ),
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
        [
          {
            text: 'OK',
            onPress: onSaveSuccessDismiss,
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }, [filterEnabled, allowedPackages, emergencyNumbers, onSaveSuccessDismiss]);

  return {
    loading,
    saving,
    installedApps,
    filterEnabled,
    setFilterEnabled,
    allowedPackages,
    emergencyNumbers,
    newPhone,
    setNewPhone,
    searchQuery,
    setSearchQuery,
    contactPickerVisible,
    setContactPickerVisible,
    contactSearch,
    setContactSearch,
    hasChanges,
    filteredApps,
    filteredContacts,
    contactList,
    togglePackage,
    addEmergency,
    removeEmergency,
    openContactPicker,
    onPickContact,
    addBypassPreset,
    persist,
    load,
  };
}

export type AppSelectionModel = ReturnType<typeof useAppSelection>;
