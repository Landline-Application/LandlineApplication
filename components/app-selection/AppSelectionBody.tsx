import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { LandlineColors } from '@/constants/theme';

import {
  BYPASS_PRESET_CALLS,
  BYPASS_PRESET_MESSAGING,
  type AppSelectionModel,
} from '@/components/app-selection/use-app-selection';

export function AppSelectionBody({ model }: { model: AppSelectionModel }) {
  const {
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
    filteredApps,
    filteredContacts,
    togglePackage,
    addEmergency,
    removeEmergency,
    openContactPicker,
    onPickContact,
    addBypassPreset,
  } = model;

  return (
    <>
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
                from apps you allow below (bypass), or from senders whose number appears in the alert
                text (emergency contacts), stay in the shade. Other notifications are cleared
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
              <MaterialIcons name="phone-in-talk" size={18} color={LandlineColors.dark.textSecondary} />
              <Text style={styles.sectionHeader}>Emergency contacts</Text>
            </View>
            <Text style={styles.hint}>
              Numbers are matched against digits in notification text (e.g. SMS). Add manually or pick
              from contacts. Minimum 7 digits per entry.
            </Text>

            <TouchableOpacity style={styles.primaryOutlineButton} onPress={openContactPicker} activeOpacity={0.8}>
              <MaterialIcons name="contact-phone" size={20} color={LandlineColors.dark.primary} />
              <Text style={styles.primaryOutlineButtonText}>Add from contacts</Text>
            </TouchableOpacity>

            {emergencyNumbers.map((num) => (
              <View key={num} style={styles.emergencyRow}>
                <Text style={styles.emergencyDigits}>{num}</Text>
                <TouchableOpacity onPress={() => removeEmergency(num)} hitSlop={12}>
                  <MaterialIcons name="close" size={22} color={LandlineColors.dark.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Add number"
                placeholderTextColor={LandlineColors.dark.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <TouchableOpacity style={styles.addButton} onPress={addEmergency}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeaderRow, styles.appsHeader]}>
              <MaterialIcons name="apps" size={18} color={LandlineColors.dark.textSecondary} />
              <Text style={styles.sectionHeader}>Apps that bypass Landline Mode</Text>
              <Text style={styles.appsCount}>{allowedPackages.size} selected</Text>
            </View>
            <Text style={styles.hint}>
              Selected apps can still show notifications while Landline Mode is on. Use quick add for
              common apps, then refine the list below.
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
                color={LandlineColors.dark.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search installed apps…"
                placeholderTextColor={LandlineColors.dark.textMuted}
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
              thumbColor={allowedPackages.has(item.packageName) ? '#fff' : LandlineColors.dark.textSecondary}
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
                placeholderTextColor={LandlineColors.dark.textMuted}
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
    </>
  );
}

/** Loading / empty state for the app list area (shared styling). */
export function AppSelectionLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={LandlineColors.dark.primary} />
      <Text style={styles.loadingText}>Loading apps…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: LandlineColors.dark.textSecondary,
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
    color: LandlineColors.dark.textSecondary,
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
    color: LandlineColors.dark.textMuted,
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
    color: LandlineColors.dark.textMuted,
  },
  hint: {
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
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
    color: LandlineColors.dark.textMuted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: LandlineColors.dark.textMuted,
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
    color: LandlineColors.dark.textSecondary,
    marginTop: 2,
  },
  modalEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: LandlineColors.dark.textMuted,
    fontSize: 14,
  },
});
