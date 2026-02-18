import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import NotebookLogView from '@/components/notebook-log-view';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Notification {
  timestamp: number;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postTime: number;
  id: number;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'notebook' | 'classic'>('notebook');

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await NotificationApiManager.getLoggedNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B7355" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Landline Log</Text>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'notebook' ? 'classic' : 'notebook')}
        >
          <Text style={styles.viewToggleText}>
            {viewMode === 'notebook' ? '📔 Notebook' : '📱 Modern'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notebook View */}
      {viewMode === 'notebook' ? (
        <NotebookLogView notifications={notifications} onRefresh={loadNotifications} />
      ) : (
        <View style={styles.modernPlaceholder}>
          <Text style={styles.placeholderText}>Classic view - To be implemented</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d3325',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3d3325',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#D4AF7A',
  },
  header: {
    backgroundColor: 'rgba(61, 51, 37, 0.95)',
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#6B5A44',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4E4C1',
  },
  viewToggle: {
    backgroundColor: '#6B5A44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewToggleText: {
    color: '#F4E4C1',
    fontSize: 14,
    fontWeight: '600',
  },
  modernPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#D4AF7A',
    fontSize: 16,
  },
});
