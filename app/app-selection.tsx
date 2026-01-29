import React, { useCallback, useMemo, useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { LandlineColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppItem {
  id: string;
  name: string;
  packageName: string;
  category: 'social' | 'messaging' | 'entertainment' | 'productivity' | 'other';
  isIncluded: boolean;
  notificationCount?: number;
}

// Mock data - in production, this would come from NotificationListenerService
const INITIAL_APPS: AppItem[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    category: 'social',
    isIncluded: true,
    notificationCount: 45,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    category: 'social',
    isIncluded: true,
    notificationCount: 23,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    packageName: 'com.twitter.android',
    category: 'social',
    isIncluded: true,
    notificationCount: 67,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    category: 'social',
    isIncluded: false,
    notificationCount: 89,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    packageName: 'com.snapchat.android',
    category: 'social',
    isIncluded: true,
    notificationCount: 34,
  },
  {
    id: 'messages',
    name: 'Messages',
    packageName: 'com.google.android.apps.messaging',
    category: 'messaging',
    isIncluded: true,
    notificationCount: 156,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'messaging',
    isIncluded: true,
    notificationCount: 203,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    packageName: 'org.telegram.messenger',
    category: 'messaging',
    isIncluded: false,
    notificationCount: 78,
  },
  {
    id: 'slack',
    name: 'Slack',
    packageName: 'com.Slack',
    category: 'productivity',
    isIncluded: true,
    notificationCount: 45,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    packageName: 'com.google.android.gm',
    category: 'productivity',
    isIncluded: true,
    notificationCount: 89,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    packageName: 'com.microsoft.office.outlook',
    category: 'productivity',
    isIncluded: false,
    notificationCount: 34,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'entertainment',
    isIncluded: false,
    notificationCount: 12,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    packageName: 'com.netflix.mediaclient',
    category: 'entertainment',
    isIncluded: false,
    notificationCount: 5,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    packageName: 'com.spotify.music',
    category: 'entertainment',
    isIncluded: false,
    notificationCount: 8,
  },
];

const CATEGORY_LABELS: Record<AppItem['category'], string> = {
  social: 'Social Media',
  messaging: 'Messaging',
  entertainment: 'Entertainment',
  productivity: 'Productivity',
  other: 'Other Apps',
};

const CATEGORY_ICONS: Record<AppItem['category'], string> = {
  social: '👥',
  messaging: '💬',
  entertainment: '🎬',
  productivity: '💼',
  other: '📱',
};

export default function AppSelectionScreen() {
  const [apps, setApps] = useState<AppItem[]>(INITIAL_APPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const query = searchQuery.toLowerCase();
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query),
    );
  }, [apps, searchQuery]);

  // Group apps by category
  const groupedApps = useMemo(() => {
    const groups: Record<AppItem['category'], AppItem[]> = {
      messaging: [],
      social: [],
      productivity: [],
      entertainment: [],
      other: [],
    };

    filteredApps.forEach((app) => {
      groups[app.category].push(app);
    });

    // Remove empty categories
    return Object.entries(groups).filter(([_, items]) => items.length > 0) as [
      AppItem['category'],
      AppItem[],
    ][];
  }, [filteredApps]);

  // Stats
  const includedCount = apps.filter((app) => app.isIncluded).length;
  const totalCount = apps.length;

  const handleToggleApp = useCallback((appId: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, isIncluded: !app.isIncluded } : app)),
    );
    setHasChanges(true);
  }, []);

  const handleSelectAll = useCallback(() => {
    setApps((prev) => prev.map((app) => ({ ...app, isIncluded: true })));
    setHasChanges(true);
  }, []);

  const handleDeselectAll = useCallback(() => {
    setApps((prev) => prev.map((app) => ({ ...app, isIncluded: false })));
    setHasChanges(true);
  }, []);

  const handleSelectCategory = useCallback((category: AppItem['category']) => {
    setApps((prev) =>
      prev.map((app) => (app.category === category ? { ...app, isIncluded: true } : app)),
    );
    setHasChanges(true);
  }, []);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave },
        ],
      );
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    // TODO: Save to storage/state management
    Alert.alert(
      'Settings Saved',
      `${includedCount} apps will have their notifications captured during Landline Mode.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Selection</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, hasChanges && styles.saveButtonTextActive]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Choose Apps for Landline Mode</Text>
          <Text style={styles.descriptionText}>
            Select which apps should have their notifications captured and logged when Landline Mode
            is active. Excluded apps will still send notifications normally.
          </Text>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statsLeft}>
            <Text style={styles.statsNumber}>{includedCount}</Text>
            <Text style={styles.statsLabel}>of {totalCount} apps included</Text>
          </View>
          <View style={styles.statsActions}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.statsButton}>
              <Text style={styles.statsButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeselectAll} style={styles.statsButton}>
              <Text style={styles.statsButtonText}>None</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            placeholderTextColor={LandlineColors.dark.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App List by Category */}
        {groupedApps.map(([category, categoryApps]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleRow}>
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
                <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
                <Text style={styles.categoryCount}>
                  {categoryApps.filter((a) => a.isIncluded).length}/{categoryApps.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleSelectCategory(category)}
                style={styles.selectCategoryButton}
              >
                <Text style={styles.selectCategoryText}>Select All</Text>
              </TouchableOpacity>
            </View>

            {categoryApps.map((app) => (
              <View key={app.id} style={styles.appItem}>
                <View style={styles.appIconContainer}>
                  <Text style={styles.appIconText}>{app.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  {app.notificationCount !== undefined && (
                    <Text style={styles.appNotificationCount}>
                      {app.notificationCount} notifications received
                    </Text>
                  )}
                </View>
                <Switch
                  value={app.isIncluded}
                  onValueChange={() => handleToggleApp(app.id)}
                  trackColor={{
                    false: LandlineColors.dark.border,
                    true: LandlineColors.dark.primary,
                  }}
                  thumbColor={app.isIncluded ? '#fff' : LandlineColors.dark.textSecondary}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No apps found</Text>
            <Text style={styles.emptyStateText}>Try a different search term</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>Included apps</Text> will have their notifications
            silently captured and logged when Landline Mode is ON{'\n'}•{' '}
            <Text style={styles.infoBold}>Excluded apps</Text> will continue to show notifications
            normally{'\n'}• You can review all captured notifications later in the Notifications tab
            {'\n'}• Apps are detected automatically when they send notifications
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Action */}
      {hasChanges && (
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
            <Text style={styles.saveFullButtonText}>
              Save Changes ({includedCount} apps included)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LandlineColors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    color: LandlineColors.dark.textMuted,
    fontWeight: '600',
  },
  saveButtonTextActive: {
    color: LandlineColors.dark.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  descriptionSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LandlineColors.dark.primary,
    marginRight: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
  },
  statsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsButton: {
    backgroundColor: LandlineColors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  statsButtonText: {
    fontSize: 14,
    color: LandlineColors.dark.text,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: LandlineColors.dark.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: LandlineColors.dark.textMuted,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginRight: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: LandlineColors.dark.textMuted,
    backgroundColor: LandlineColors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectCategoryButton: {
    padding: 8,
  },
  selectCategoryText: {
    fontSize: 12,
    color: LandlineColors.dark.primary,
    fontWeight: '500',
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  appIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: LandlineColors.dark.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LandlineColors.dark.primary,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: LandlineColors.dark.text,
    marginBottom: 2,
  },
  appNotificationCount: {
    fontSize: 12,
    color: LandlineColors.dark.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
  },
  infoSection: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  bottomAction: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LandlineColors.dark.divider,
    backgroundColor: LandlineColors.dark.background,
  },
  saveFullButton: {
    backgroundColor: LandlineColors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveFullButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
