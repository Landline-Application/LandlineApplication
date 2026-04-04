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

import { MaterialIcons } from '@/components/ui/icon-symbol';
import type { AppSelectionModel } from '@/components/app-selection/use-app-selection';

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
          <MaterialIcons name="contact-phone" size={20} color="#007AFF" />
          <Text style={styles.outlineBtnText}>Add from contacts</Text>
        </TouchableOpacity>

        {emergencyNumbers.map((num) => (
          <View key={num} style={styles.chipRow}>
            <Text style={styles.chipText}>{num}</Text>
            <TouchableOpacity onPress={() => removeEmergency(num)} hitSlop={12} accessibilityLabel="Remove">
              <MaterialIcons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addInline}>
          <TextInput
            style={styles.input}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="Phone number"
            placeholderTextColor="#aaa"
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
              placeholderTextColor="#aaa"
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
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: '#666',
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
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  chipText: {
    fontSize: 16,
    color: '#111',
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
  },
  smallPrimary: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  smallPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '78%',
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
    color: '#111',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalSearch: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
    color: '#111',
  },
  modalList: {
    maxHeight: 360,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAvatarTxt: {
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
    color: '#111',
  },
  modalPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
