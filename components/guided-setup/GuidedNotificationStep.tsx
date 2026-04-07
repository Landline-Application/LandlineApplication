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
import { G } from '@/components/guided-setup/theme';

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
                trackColor={{ false: G.switchTrackOff, true: G.switchTrackOn }}
                thumbColor={G.well}
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
            <MaterialIcons name="search" size={18} color={G.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps…"
              placeholderTextColor={G.muted}
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
            trackColor={{ false: G.switchTrackOff, true: G.switchTrackOn }}
            thumbColor={G.well}
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
    backgroundColor: G.well,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: G.wellBorder,
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
    color: G.text,
    marginBottom: 4,
  },
  labelMuted: {
    fontSize: 13,
    color: G.muted,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: G.text,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    color: G.muted,
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
    backgroundColor: G.secondarySurface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.secondaryBorder,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: G.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.well,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: G.wellBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: G.text,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.well,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: G.wellBorder,
  },
  appAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: G.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: G.secondaryBorder,
  },
  appAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: G.primary,
  },
  appMeta: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
  },
  appPkg: {
    fontSize: 11,
    color: G.muted,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: G.muted,
    paddingVertical: 20,
    fontSize: 14,
  },
});
