import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

interface Notification {
  timestamp: number;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postTime: number;
  id: number;
}

export default function NotificationDetailScreen() {
  const params = useLocalSearchParams();
  const category = params.category as string;
  const notificationsData = params.notifications as string;

  const [notifications, setNotifications] = useState<Notification[]>(
    JSON.parse(notificationsData || '[]')
  );

  const getCategoryIcon = (cat: string): string => {
    switch (cat) {
      case 'Texts':
        return '💬';
      case 'Emails':
        return '📧';
      case 'Missed Calls':
        return '📞';
      case 'Voicemails':
        return '🎙️';
      case 'App Notifications':
        return '🔔';
      default:
        return '📬';
    }
  };

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'Texts':
        return '#4CAF50';
      case 'Emails':
        return '#2196F3';
      case 'Missed Calls':
        return '#F44336';
      case 'Voicemails':
        return '#FF9800';
      case 'App Notifications':
        return '#9C27B0';
      default:
        return '#667eea';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.toLocaleString();
  };

  const handleDismiss = (index: number) => {
    const newNotifications = [...notifications];
    newNotifications.splice(index, 1);
    setNotifications(newNotifications);

    if (newNotifications.length === 0) {
      router.back();
    }
  };

  const handleDismissAll = () => {
    Alert.alert(
      'Dismiss All',
      `Are you sure you want to dismiss all ${category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: getCategoryColor(category) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{getCategoryIcon(category)}</Text>
          <View>
            <Text style={styles.headerTitle}>{category}</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </Text>
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        ) : (
          <>
            {notifications.map((notif, index) => (
              <View key={`${notif.id}-${index}`} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationAppContainer}>
                    <View style={[styles.appIndicator, { backgroundColor: getCategoryColor(category) }]} />
                    <View style={styles.notificationInfo}>
                      <Text style={styles.appName}>{notif.appName}</Text>
                      <Text style={styles.timestamp}>{formatTimestamp(notif.postTime)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDismiss(index)}
                    style={styles.dismissButton}
                  >
                    <Text style={styles.dismissButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.notificationContent}>
                  {notif.title && (
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                  )}
                  {notif.text && (
                    <Text style={styles.notificationText}>{notif.text}</Text>
                  )}
                </View>

                <View style={styles.notificationFooter}>
                  <Text style={styles.packageName}>{notif.packageName}</Text>
                </View>
              </View>
            ))}

            {/* Dismiss All Button */}
            {notifications.length > 1 && (
              <TouchableOpacity style={styles.dismissAllButton} onPress={handleDismissAll}>
                <Text style={styles.dismissAllButtonText}>Dismiss All {category}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationAppContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dismissButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  notificationContent: {
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 24,
  },
  notificationText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  notificationFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  packageName: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  dismissAllButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
    marginTop: 8,
    marginBottom: 20,
  },
  dismissAllButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

