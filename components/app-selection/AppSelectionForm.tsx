import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { AppSelectionBody, AppSelectionLoading } from '@/components/app-selection/AppSelectionBody';
import { useAppSelection } from '@/components/app-selection/use-app-selection';
import { LandlineColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AppSelectionForm() {
  const model = useAppSelection({
    onSaveSuccessDismiss: () => {
      router.back();
    },
  });

  const { loading, persist, saving, hasChanges } = model;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.unsupportedTitle}>Android only</Text>
          <Text style={styles.unsupportedText}>
            Notification permissions use Android notification access. They are not available on this
            platform.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppSelectionLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
      <AppSelectionBody model={model} />
    </SafeAreaView>
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
  unsupportedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
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
    color: LandlineColors.dark.textMuted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LandlineColors.dark.text,
  },
});
