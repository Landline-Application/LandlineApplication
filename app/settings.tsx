import { LandlineColors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppPermission {
  id: string;
  name: string;
  packageName: string;
  icon?: string;
  isIncluded: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    visual: boolean;
  };
}

export default function SettingsScreen() {
  // Mock app permissions data - in real app this would come from system
  const [appPermissions, setAppPermissions] = useState<AppPermission[]>([
    {
      id: 'instagram',
      name: 'Instagram',
      packageName: 'com.instagram.android',
      isIncluded: true,
      notificationSettings: {
        sound: false,
        vibration: true,
        visual: false,
      },
    },
    {
      id: 'messages',
      name: 'Messages',
      packageName: 'com.google.android.apps.messaging',
      isIncluded: true,
      notificationSettings: {
        sound: false,
        vibration: true,
        visual: false,
      },
    },
    {
      id: 'youtube',
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      isIncluded: false,
      notificationSettings: {
        sound: true,
        vibration: true,
        visual: true,
      },
    },
    {
      id: 'twitter',
      name: 'Twitter',
      packageName: 'com.twitter.android',
      isIncluded: true,
      notificationSettings: {
        sound: false,
        vibration: false,
        visual: false,
      },
    },
    {
      id: 'facebook',
      name: 'Facebook',
      packageName: 'com.facebook.katana',
      isIncluded: false,
      notificationSettings: {
        sound: true,
        vibration: false,
        visual: true,
      },
    },
  ]);

  const handleAppToggle = (appId: string) => {
    setAppPermissions(prev =>
      prev.map(app =>
        app.id === appId
          ? { ...app, isIncluded: !app.isIncluded }
          : app
      )
    );
  };

  const handleNotificationSetting = (appId: string, setting: keyof AppPermission['notificationSettings']) => {
    setAppPermissions(prev =>
      prev.map(app =>
        app.id === appId
          ? {
              ...app,
              notificationSettings: {
                ...app.notificationSettings,
                [setting]: !app.notificationSettings[setting],
              },
            }
          : app
      )
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    Alert.alert(
      'Settings Saved',
      'Your notification permissions have been updated.',
      [{ text: 'OK', onPress: handleBack }]
    );
  };

  const includedApps = appPermissions.filter(app => app.isIncluded);
  const excludedApps = appPermissions.filter(app => !app.isIncluded);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Permissions</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Customize which apps can send notifications during Landline mode and how they're handled.
          </Text>
        </View>

        {/* Included Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Included in Landline Mode</Text>
          <Text style={styles.sectionSubtitle}>
            {includedApps.length} of {appPermissions.length} apps
          </Text>

          {includedApps.map((app) => (
            <View key={app.id} style={styles.appItem}>
              <View style={styles.appHeader}>
                <Text style={styles.appName}>{app.name}</Text>
                <Switch
                  value={app.isIncluded}
                  onValueChange={() => handleAppToggle(app.id)}
                  trackColor={{
                    false: LandlineColors.dark.border,
                    true: LandlineColors.dark.primary,
                  }}
                  thumbColor={app.isIncluded ? '#fff' : LandlineColors.dark.textSecondary}
                />
              </View>

              <View style={styles.notificationSettings}>
                <Text style={styles.settingsTitle}>Notification Settings:</Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Switch
                    value={app.notificationSettings.sound}
                    onValueChange={() => handleNotificationSetting(app.id, 'sound')}
                    trackColor={{
                      false: LandlineColors.dark.border,
                      true: LandlineColors.dark.success,
                    }}
                    thumbColor={app.notificationSettings.sound ? '#fff' : LandlineColors.dark.textSecondary}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Switch
                    value={app.notificationSettings.vibration}
                    onValueChange={() => handleNotificationSetting(app.id, 'vibration')}
                    trackColor={{
                      false: LandlineColors.dark.border,
                      true: LandlineColors.dark.warning,
                    }}
                    thumbColor={app.notificationSettings.vibration ? '#fff' : LandlineColors.dark.textSecondary}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Visual</Text>
                  <Switch
                    value={app.notificationSettings.visual}
                    onValueChange={() => handleNotificationSetting(app.id, 'visual')}
                    trackColor={{
                      false: LandlineColors.dark.border,
                      true: LandlineColors.dark.primary,
                    }}
                    thumbColor={app.notificationSettings.visual ? '#fff' : LandlineColors.dark.textSecondary}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Excluded Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Excluded from Landline Mode</Text>
          <Text style={styles.sectionSubtitle}>
            {excludedApps.length} apps will not show notifications
          </Text>

          {excludedApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.excludedAppItem}
              onPress={() => handleAppToggle(app.id)}
            >
              <Text style={styles.excludedAppName}>{app.name}</Text>
              <Text style={styles.includeText}>Tap to include</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Apps in "Included" will have their notifications logged during Landline mode{'\n'}
            • Notification settings control how alerts behave when Landline is active{'\n'}
            • Excluded apps won't appear in your notification log
          </Text>
        </View>
      </ScrollView>
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
    color: LandlineColors.dark.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  descriptionSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: LandlineColors.dark.textMuted,
    marginBottom: 16,
  },
  appItem: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
  },
  notificationSettings: {
    borderTopWidth: 1,
    borderTopColor: LandlineColors.dark.divider,
    paddingTop: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
  },
  excludedAppItem: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  excludedAppName: {
    fontSize: 16,
    color: LandlineColors.dark.textSecondary,
    marginBottom: 4,
  },
  includeText: {
    fontSize: 12,
    color: LandlineColors.dark.primary,
  },
  infoSection: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
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
    fontSize: 12,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 18,
  },
});



