import { LandlineColors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationCategory {
  id: string;
  name: string;
  count: number;
  color: string;
  icon?: string;
}

export default function LandlineActiveScreen() {
  // Mock notification data - in real app this would come from state/context
  const [notifications, setNotifications] = useState({
    texts: 231,
    emails: 22,
    calls: 0,
    apps: 56,
    instagram: 32,
    messages: 14,
    missedCalls: 3,
    voicemail: 2,
    youtube: 15,
  });

  // Pagination state for scroll functionality
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2; // Mock: Page 1 = notifications, Page 2 = detailed view

  const handleViewPress = (category: string) => {
    // TODO: Navigate to detailed view for this category
    Alert.alert(
      `${category} Notifications`,
      `Would show detailed list of ${category.toLowerCase()} notifications`,
      [{ text: 'OK' }]
    );
  };

  const handleClearLog = () => {
    Alert.alert(
      'Clear Log',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setNotifications({
              texts: 0,
              emails: 0,
              calls: 0,
              apps: 0,
              instagram: 0,
              messages: 0,
              missedCalls: 0,
              voicemail: 0,
              youtube: 0,
            });
          },
        },
      ]
    );
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Landline Mode',
      'Are you sure you want to deactivate Landline mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            // TODO: UI ONLY - No actual deactivation logic
            router.replace('/landline');
          },
        },
      ]
    );
  };

  // Group notifications by category for display
  const notificationCategories: NotificationCategory[] = [
    {
      id: 'instagram',
      name: 'INSTAGRAM',
      count: notifications.instagram,
      color: LandlineColors.dark.instagram,
    },
    {
      id: 'messages',
      name: 'MESSAGES',
      count: notifications.messages,
      color: LandlineColors.dark.messages,
    },
    {
      id: 'missedCalls',
      name: 'MISSED CALLS',
      count: notifications.missedCalls,
      color: LandlineColors.dark.calls,
    },
    {
      id: 'voicemail',
      name: 'VOICEMAIL',
      count: notifications.voicemail,
      color: LandlineColors.dark.voicemail,
    },
    {
      id: 'youtube',
      name: 'YOUTUBE',
      count: notifications.youtube,
      color: LandlineColors.dark.youtube,
    },
  ];

  const totalNotifications = Object.values(notifications).reduce((sum, count) => sum + count, 0);

  // Bottom navigation handlers
  const handleAppProfile = () => {
    Alert.alert('App Profile', 'User profile and account settings would go here');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Help documentation and user guide would go here');
  };

  const handleWidgetDemo = () => {
    router.push('/widget-demo');
  };

  const handleScrollToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // In a real app, this would scroll to the next section
      Alert.alert('Next Page', `Navigated to page ${currentPage + 1}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Landline Active</Text>
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Notifications logged:</Text>
          <Text style={styles.statusCount}>{totalNotifications}</Text>
        </View>
      </View>

      {/* Notification Categories */}
      <ScrollView style={styles.notificationsSection} showsVerticalScrollIndicator={false}>
        {notificationCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.notificationItem, { borderLeftColor: category.color }]}
            onPress={() => handleViewPress(category.name)}
            disabled={category.count === 0}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationName}>{category.name}</Text>
                <Text style={styles.notificationCount}>({category.count})</Text>
              </View>
              <View style={styles.notificationRight}>
                <TouchableOpacity
                  style={[styles.viewButton, { opacity: category.count > 0 ? 1 : 0.5 }]}
                  onPress={() => handleViewPress(category.name)}
                  disabled={category.count === 0}
                >
                  <Text style={[styles.viewButtonText, { opacity: category.count > 0 ? 1 : 0.5 }]}>
                    View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Summary Categories */}
        <TouchableOpacity
          style={[styles.notificationItem, { borderLeftColor: LandlineColors.dark.apps }]}
          onPress={() => handleViewPress('All Apps')}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationLeft}>
              <Text style={styles.notificationName}>ALL APPS</Text>
              <Text style={styles.notificationCount}>({notifications.apps})</Text>
            </View>
            <View style={styles.notificationRight}>
              <TouchableOpacity
                style={[styles.viewButton, { opacity: notifications.apps > 0 ? 1 : 0.5 }]}
                onPress={() => handleViewPress('All Apps')}
                disabled={notifications.apps === 0}
              >
                <Text style={[styles.viewButtonText, { opacity: notifications.apps > 0 ? 1 : 0.5 }]}>
                  View
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Section */}
      <View style={styles.bottomNavigation}>
        {/* Top row: Clear Log and Deactivate */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearLog}>
            <Text style={styles.actionButtonText}>Clear Log</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivate}>
            <Text style={styles.deactivateButtonText}>Deactivate</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row: App Profile, Help, Widget */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.navButton} onPress={handleAppProfile}>
            <Text style={styles.navButtonText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={handleHelp}>
            <Text style={styles.navButtonText}>Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={handleWidgetDemo}>
            <Text style={styles.navButtonText}>Widget</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll indicator and next page button */}
        <View style={styles.scrollSection}>
          <Text style={styles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </Text>
          {currentPage < totalPages && (
            <TouchableOpacity style={styles.scrollButton} onPress={handleScrollToNext}>
              <Text style={styles.scrollButtonText}>Scroll Down</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LandlineColors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LandlineColors.dark.divider,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LandlineColors.dark.text,
    textAlign: 'center',
  },
  statusSection: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  statusLabel: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LandlineColors.dark.primary,
  },
  notificationsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationItem: {
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationName: {
    fontSize: 14,
    fontWeight: '600',
    color: LandlineColors.dark.text,
    letterSpacing: 0.5,
  },
  notificationCount: {
    fontSize: 14,
    color: LandlineColors.dark.textSecondary,
    marginLeft: 8,
  },
  notificationRight: {
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  bottomSection: {
    padding: 20,
    gap: 12,
  },
  bottomNavigation: {
    padding: 20,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  deactivateButton: {
    flex: 1,
    backgroundColor: LandlineColors.dark.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deactivateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: LandlineColors.dark.card,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
  scrollSection: {
    alignItems: 'center',
    gap: 8,
  },
  pageIndicator: {
    fontSize: 12,
    color: LandlineColors.dark.textMuted,
  },
  scrollButton: {
    backgroundColor: LandlineColors.dark.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: LandlineColors.dark.border,
  },
  scrollButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: LandlineColors.dark.textSecondary,
  },
});
