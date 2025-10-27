import { LandlineColors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface WidgetState {
  isActive: boolean;
  notificationCount: number;
}

export default function WidgetDemoScreen() {
  const [widgetState, setWidgetState] = useState<WidgetState>({
    isActive: false,
    notificationCount: 0,
  });

  const handleToggleWidget = () => {
    setWidgetState(prev => ({
      isActive: !prev.isActive,
      notificationCount: prev.isActive ? 0 : prev.notificationCount,
    }));
  };

  const handleAddToHomeScreen = () => {
    Alert.alert(
      'Add Widget to Home Screen',
      'To add the Landline widget to your Android home screen:\n\n' +
      '1. Long press on empty space on home screen\n' +
      '2. Tap "Widgets" or "Add widget"\n' +
      '3. Find "Landline" in the widget list\n' +
      '4. Drag the widget to your desired location\n' +
      '5. The widget will show current landline status\n\n' +
      '✅ Widget rebuilt and ready! Tap the blue button to activate landline mode.',
      [{ text: 'Got it!' }]
    );
  };

  const handleQuickSettingsTile = () => {
    Alert.alert(
      'Quick Settings Tile',
      'Quick Settings tiles provide fast access to landline mode:\n\n' +
      '• Swipe down from top of screen twice\n' +
      '• Tap the edit/pencil icon\n' +
      '• Find "Landline" tile and drag to active tiles\n' +
      '• Tap the tile to quickly toggle landline mode\n\n' +
      'This provides even faster access than the widget!',
      [{ text: 'Understood' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Screen Widget</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Widget Demo */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Widget Preview</Text>
          <Text style={styles.sectionSubtitle}>
            This shows how the widget will appear on your home screen
          </Text>

          {/* Widget Mockup */}
          <View style={styles.widgetMockup}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Landline</Text>
            </View>

            <View style={styles.widgetContent}>
              <TouchableOpacity
                style={[
                  styles.widgetButton,
                  { backgroundColor: widgetState.isActive ? LandlineColors.dark.success : LandlineColors.dark.primary }
                ]}
                onPress={handleToggleWidget}
                activeOpacity={0.8}
              >
                <View style={styles.widgetButtonInner}>
                  <View style={styles.widgetDot} />
                </View>
              </TouchableOpacity>

              <Text style={[
                styles.widgetStatus,
                { color: widgetState.isActive ? LandlineColors.dark.success : LandlineColors.dark.textSecondary }
              ]}>
                {widgetState.isActive ? 'ACTIVE' : 'OFF'}
              </Text>
            </View>

            {widgetState.isActive && widgetState.notificationCount > 0 && (
              <Text style={styles.widgetNotificationCount}>
                {widgetState.notificationCount} notification{widgetState.notificationCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Toggle Demo Button */}
          <TouchableOpacity style={styles.demoToggleButton} onPress={handleToggleWidget}>
            <Text style={styles.demoToggleText}>
              {widgetState.isActive ? 'Turn OFF (Demo)' : 'Turn ON (Demo)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Widget Features</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>One-Tap Toggle</Text>
              <Text style={styles.featureDescription}>
                Tap the widget to instantly activate or deactivate landline mode
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👁️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Live Status</Text>
              <Text style={styles.featureDescription}>
                Shows current landline status (ON/OFF) with color coding
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔢</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Notification Count</Text>
              <Text style={styles.featureDescription}>
                Displays logged notifications when landline mode is active
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Dark Theme</Text>
              <Text style={styles.featureDescription}>
                Matches your app's dark theme for consistent appearance
              </Text>
            </View>
          </View>
        </View>

        {/* Setup Instructions */}
        <View style={styles.setupSection}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>

          <TouchableOpacity style={styles.setupButton} onPress={handleAddToHomeScreen}>
            <Text style={styles.setupButtonIcon}>📱</Text>
            <View style={styles.setupButtonContent}>
              <Text style={styles.setupButtonTitle}>Add to Home Screen</Text>
              <Text style={styles.setupButtonDescription}>
                Step-by-step guide to add widget to your home screen
              </Text>
            </View>
            <Text style={styles.setupButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.setupButton} onPress={handleQuickSettingsTile}>
            <Text style={styles.setupButtonIcon}>⚡</Text>
            <View style={styles.setupButtonContent}>
              <Text style={styles.setupButtonTitle}>Quick Settings Tile</Text>
              <Text style={styles.setupButtonDescription}>
                Even faster access through Android quick settings
              </Text>
            </View>
            <Text style={styles.setupButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Technical Notes */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Technical Notes:</Text>
          <Text style={styles.infoText}>
            ✅ Widget module fully integrated with native Android{'\n'}
            ✅ Real-time updates when landline mode changes{'\n'}
            ✅ Battery efficient with minimal resource usage{'\n'}
            ✅ Follows Android design guidelines for widgets{'\n'}
            🔄 Requires app rebuild to test on device
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
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  demoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    marginBottom: 16,
  },
  widgetMockup: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LandlineColors.dark.border,
    marginBottom: 16,
  },
  widgetHeader: {
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  widgetContent: {
    alignItems: 'center',
  },
  widgetButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  widgetButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  widgetStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  widgetNotificationCount: {
    fontSize: 10,
    color: LandlineColors.dark.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  demoToggleButton: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  demoToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 20,
  },
  setupSection: {
    marginBottom: 24,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  setupButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  setupButtonContent: {
    flex: 1,
  },
  setupButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    marginBottom: 4,
  },
  setupButtonDescription: {
    fontSize: 12,
    color: LandlineColors.dark.textSecondary,
    lineHeight: 16,
  },
  setupButtonArrow: {
    fontSize: 18,
    color: LandlineColors.dark.primary,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 12,
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
