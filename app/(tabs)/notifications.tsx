import React, { useCallback, useState } from 'react';

import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import NotebookLogView from '@/components/notebook-log-view';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { useActiveRefresh } from '@/hooks/use-active-refresh';
import { useLandlineStore } from '@/hooks/use-landline-store';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    isLoading,
    refreshNotifications,
    removeNotification,
    removeNotifications,
    isActive,
  } = useLandlineStore();
  const [viewMode, setViewMode] = useState<'notebook' | 'classic'>('notebook');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTimestamps, setSelectedTimestamps] = useState<Set<number>>(new Set());

  // Enable fast refresh (3s) when viewing this screen and Landline Mode is active
  useActiveRefresh(refreshNotifications, isActive);

  const loadNotifications = useCallback(async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    }
  }, [refreshNotifications]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all logged notifications? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await NotificationApiManager.clearAllData();
              if (success) {
                await refreshNotifications();
                Alert.alert('Success', 'All notifications cleared');
              } else {
                Alert.alert('Error', 'Failed to clear notifications');
              }
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ],
    );
  }, [refreshNotifications]);

  const handleToggleSelect = useCallback((timestamp: number) => {
    setSelectedTimestamps((prev) => {
      const next = new Set(prev);
      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const timestamps = Array.from(selectedTimestamps);
    if (timestamps.length === 0) return;
    try {
      await removeNotifications(timestamps);
      setSelectedTimestamps(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      Alert.alert('Error', 'Failed to delete selected notifications');
    }
  }, [selectedTimestamps, removeNotifications]);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedTimestamps(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    const allTimestamps = notifications
      .map((n) => n.timestamp ?? n.postTime)
      .filter((t): t is number => t != null);
    setSelectedTimestamps(new Set(allTimestamps));
  }, [notifications]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B7355" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Controls */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Landline Log</Text>
        <View style={styles.headerControlsRow}>
          {selectionMode ? (
            <>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleExitSelectionMode}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Text style={styles.selectAllButtonText}>Select all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteSelectedButton,
                  selectedTimestamps.size === 0 && styles.deleteSelectedButtonDisabled,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedTimestamps.size === 0}
              >
                <MaterialIcons name="delete-outline" size={16} color="#fff" />
                <Text style={styles.deleteSelectedButtonText}>
                  Delete ({selectedTimestamps.size})
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setViewMode(viewMode === 'notebook' ? 'classic' : 'notebook')}
              >
                <MaterialIcons
                  name={viewMode === 'notebook' ? 'menu-book' : 'view-agenda'}
                  size={16}
                  color="#F4E4C1"
                  style={styles.viewToggleIcon}
                />
                <Text style={styles.viewToggleText}>
                  {viewMode === 'notebook' ? 'Notebook' : 'Modern'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setSelectionMode(true)}
              >
                <MaterialIcons name="checklist" size={16} color="#F4E4C1" />
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                <MaterialIcons
                  name="delete-outline"
                  size={16}
                  color="#fff"
                  style={styles.clearButtonIcon}
                />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Notebook View */}
      {viewMode === 'notebook' ? (
        <NotebookLogView
          notifications={notifications}
          onRefresh={loadNotifications}
          isActive={isActive}
          onDeleteNotification={removeNotification}
          selectionMode={selectionMode}
          selectedTimestamps={selectedTimestamps}
          onToggleSelect={handleToggleSelect}
          onDeleteNotifications={removeNotifications}
        />
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
  headerControls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewToggle: {
    backgroundColor: '#6B5A44',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewToggleIcon: {},
  viewToggleText: {
    color: '#F4E4C1',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#c0392b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearButtonIcon: {},
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#6B5A44',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectButtonText: {
    color: '#F4E4C1',
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#6B5A44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#F4E4C1',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteSelectedButton: {
    backgroundColor: '#c0392b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteSelectedButtonDisabled: {
    opacity: 0.5,
  },
  selectAllButton: {
    backgroundColor: '#6B5A44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectAllButtonText: {
    color: '#F4E4C1',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteSelectedButtonText: {
    color: '#fff',
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
