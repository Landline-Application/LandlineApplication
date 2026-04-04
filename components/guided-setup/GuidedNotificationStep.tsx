import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import {
  BYPASS_PRESET_CALLS,
  BYPASS_PRESET_MESSAGING,
  type AppSelectionModel,
} from '@/components/app-selection/use-app-selection';

type Props = {
  model: AppSelectionModel;
};

/**
 * Wizard-styled notification bypass step: apps + filter only (emergency numbers are a later step).
 */
export function GuidedNotificationStep({ model }: Props) {
  const {
    filterEnabled,
    setFilterEnabled,
    allowedPackages,
    searchQuery,
    setSearchQuery,
    filteredApps,
    togglePackage,
    addBypassPreset,
  } = model;

  return (
    <FlatList
      style={styles.list}
      data={filteredApps}
      keyExtractor={(item) => item.packageName}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabels}>
                <Text style={styles.labelStrong}>Filter notifications in Landline Mode</Text>
                <Text style={styles.labelMuted}>
                  When on, only apps you allow below can keep notifications in the shade during
                  Landline Mode.
                </Text>
              </View>
              <Switch
                value={filterEnabled}
                onValueChange={setFilterEnabled}
                trackColor={{ false: '#d1d1d6', true: '#34c759' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Apps that can bypass</Text>
          <Text style={styles.sectionHint}>Quick add common apps, then search and toggle below.</Text>
          <View style={styles.chipWrap}>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => addBypassPreset(BYPASS_PRESET_MESSAGING)}
              activeOpacity={0.85}
            >
              <Text style={styles.pillText}>+ Messaging</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => addBypassPreset(BYPASS_PRESET_CALLS)}
              activeOpacity={0.85}
            >
              <Text style={styles.pillText}>+ Phone</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps…"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.appRow}>
          <View style={styles.appAvatar}>
            <Text style={styles.appAvatarText}>{item.appName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.appMeta}>
            <Text style={styles.appName} numberOfLines={1}>
              {item.appName}
            </Text>
            <Text style={styles.appPkg} numberOfLines={1}>
              {item.packageName}
            </Text>
          </View>
          <Switch
            value={allowedPackages.has(item.packageName)}
            onValueChange={() => togglePackage(item.packageName)}
            trackColor={{ false: '#d1d1d6', true: '#34c759' }}
            thumbColor="#fff"
          />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No apps match your search.</Text>}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabels: {
    flex: 1,
    minWidth: 0,
  },
  labelStrong: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  labelMuted: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  appAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e3f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  appMeta: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  appPkg: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
    fontSize: 14,
  },
});
