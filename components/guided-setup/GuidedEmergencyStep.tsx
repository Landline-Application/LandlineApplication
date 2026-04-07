import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AppSelectionModel } from '@/components/app-selection/use-app-selection';
import { G } from '@/components/guided-setup/theme';
import { MaterialIcons } from '@/components/ui/icon-symbol';

type Props = {
  model: AppSelectionModel;
};

/**
 * Wizard step for emergency phone numbers (notification text digit matching). Android only at runtime.
 */
export function GuidedEmergencyStep({ model }: Props) {
  const {
    emergencyNumbers,
    newPhone,
    setNewPhone,
    contactPickerVisible,
    setContactPickerVisible,
    contactSearch,
    setContactSearch,
    filteredContacts,
    addEmergency,
    removeEmergency,
    openContactPicker,
    onPickContact,
  } = model;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How this works</Text>
          <Text style={styles.cardBody}>
            If you use notification filtering in Landline Mode, numbers you add here are matched
            against digits in notification text (for example SMS). If a notification includes one of
            these numbers, it can stay in the shade like an allowed app.
          </Text>
        </View>

        <Text style={styles.hint}>Each entry needs at least 7 digits. Duplicates are ignored.</Text>

        <TouchableOpacity style={styles.outlineBtn} onPress={openContactPicker} activeOpacity={0.85}>
          <MaterialIcons name="contact-phone" size={20} color={G.primary} />
          <Text style={styles.outlineBtnText}>Add from contacts</Text>
        </TouchableOpacity>

        {emergencyNumbers.map((num) => (
          <View key={num} style={styles.chipRow}>
            <Text style={styles.chipText}>{num}</Text>
            <TouchableOpacity onPress={() => removeEmergency(num)} hitSlop={12} accessibilityLabel="Remove">
              <MaterialIcons name="close" size={20} color={G.muted} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addInline}>
          <TextInput
            style={styles.input}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="Phone number"
            placeholderTextColor={G.muted}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <TouchableOpacity style={styles.smallPrimary} onPress={addEmergency} activeOpacity={0.85}>
            <Text style={styles.smallPrimaryText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={contactPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a contact</Text>
              <TouchableOpacity onPress={() => setContactPickerVisible(false)} hitSlop={12}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Search…"
              placeholderTextColor={G.muted}
              value={contactSearch}
              onChangeText={setContactSearch}
              autoCorrect={false}
            />
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, i) => `${item.name ?? 'c'}-${i}`}
              keyboardShouldPersistTaps="handled"
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => onPickContact(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarTxt}>{(item.name ?? '?')[0].toUpperCase()}</Text>
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
              ListEmptyComponent={<Text style={styles.empty}>No contacts found.</Text>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: G.well,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: G.wellBorder,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: G.text,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: G.muted,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: G.muted,
    lineHeight: 18,
    marginBottom: 14,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: G.primary,
    marginBottom: 12,
    backgroundColor: G.well,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: G.primary,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: G.well,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: G.wellBorder,
  },
  chipText: {
    fontSize: 16,
    color: G.text,
    letterSpacing: 0.3,
  },
  addInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: G.wellBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: G.text,
    backgroundColor: G.well,
  },
  smallPrimary: {
    backgroundColor: G.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  smallPrimaryText: {
    color: G.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    color: G.muted,
    paddingVertical: 20,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: G.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: G.modalSheet,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '78%',
    borderTopWidth: 1,
    borderColor: G.panelBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.text,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: G.primary,
  },
  modalSearch: {
    borderWidth: 1,
    borderColor: G.wellBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
    color: G.text,
    backgroundColor: G.well,
  },
  modalList: {
    maxHeight: 360,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: G.wellBorder,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: G.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAvatarTxt: {
    color: G.onPrimary,
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
    color: G.text,
  },
  modalPhone: {
    fontSize: 13,
    color: G.muted,
    marginTop: 2,
  },
});
