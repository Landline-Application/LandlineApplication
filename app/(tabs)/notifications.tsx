import React, { useCallback } from 'react';

import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import NotebookLogView from '@/components/notifications/notebook-log-view';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing, TouchTargets } from '@/constants/theme';
import { useActiveRefresh } from '@/hooks/use-active-refresh';
import { useLandlineStore } from '@/hooks/use-landline-store';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, refreshNotifications, removeNotification, isActive } =
    useLandlineStore();

  // Fast refresh (3s) while this screen is focused and Landline Mode is active
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await NotificationApiManager.clearLoggedNotifications();
              if (success) {
                await refreshNotifications();
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

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Log</Text>
          {isActive && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live</Text>
            </View>
          )}
        </View>

        {/* M3 Standard icon button — clear (destructive, lowest emphasis) */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleClearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all notifications"
          disabled={isLoading || notifications.length === 0}
        >
          <MaterialIcons
            name="delete-outline"
            size={22}
            color={notifications.length === 0 ? COLORS.text.muted : COLORS.error}
          />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : (
        <NotebookLogView
          notifications={notifications}
          onRefresh={loadNotifications}
          onDelete={removeNotification}
          isActive={isActive}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    lineHeight: 32,
    color: COLORS.text.primary,
  },
  // Subtle live indicator pill — visible only when Landline Mode is capturing
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: `${COLORS.primary}18`,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  livePillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  // M3 Standard icon button — 48dp touch target, no container
  iconButton: {
    width: TouchTargets.md,
    height: TouchTargets.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Loading state ─────────────────────────────────────────────────────────
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.text.secondary,
  },
});
