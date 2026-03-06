import { Platform } from 'react-native';

import * as BackgroundServiceManager from '@/modules/background-service-manager';
import * as DndManager from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import { create } from 'zustand';

interface LandlineModeState {
  // State
  isActive: boolean;
  hasPermission: boolean;
  notifications: any[];
  sessionStartTime: Date | null;
  isLoading: boolean;
  error: string | null;
  refreshError: string | null;

  // Internal state (not exposed to UI)
  refreshInterval: ReturnType<typeof setInterval> | null;

  // Actions
  activateLandlineMode: () => Promise<void>;
  deactivateLandlineMode: () => Promise<void>;
  checkStatus: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestPermission: () => Promise<void>;
  clearError: () => void;
  clearRefreshError: () => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export const useLandlineStore = create<LandlineModeState>((set, get) => ({
  // Initial State
  isActive: false,
  hasPermission: false,
  notifications: [],
  sessionStartTime: null,
  isLoading: false,
  error: null,
  refreshError: null,
  refreshInterval: null,

  // Action: Check current status from native
  checkStatus: async () => {
    // Only run on Android
    if (Platform.OS !== 'android') {
      return;
    }

    set({ isLoading: true });
    try {
      const perm = NotificationApiManager.hasNotificationListenerPermission();
      const active = NotificationApiManager.isLandlineModeActive();
      const logs = await NotificationApiManager.getLoggedNotifications();

      set({
        hasPermission: perm,
        isActive: active,
        notifications: Array.isArray(logs) ? logs : [],
        sessionStartTime: active ? new Date() : null,
        error: null,
      });

      // If active, start auto-refresh
      if (active) {
        get().startAutoRefresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({ error: errorMessage });
      console.error('checkStatus error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Activate Landline Mode
  activateLandlineMode: async () => {
    set({ isLoading: true, error: null });
    try {
      // Call native API to set landline mode
      NotificationApiManager.setLandlineMode(true);

      // Try to enable DND (optional)
      try {
        if (DndManager.hasPermission()) {
          await DndManager.setDNDEnabled(true);
        }
      } catch (dndErr) {
        console.warn('DND not available:', dndErr);
        // Continue anyway - DND is optional
      }

      // Start foreground service for reliability
      try {
        BackgroundServiceManager.startForegroundService(
          'Landline Mode Active',
          'Your notifications are being captured',
        );
      } catch (serviceErr) {
        console.warn('Background service not available:', serviceErr);
        // Continue anyway - service is optional
      }

      // Verify it actually activated
      const actualActive = NotificationApiManager.isLandlineModeActive();

      set({
        isActive: actualActive,
        sessionStartTime: actualActive ? new Date() : null,
      });

      // Start auto-refresh if successful
      if (actualActive) {
        get().startAutoRefresh();
        await get().refreshNotifications();
      } else {
        throw new Error('Failed to activate Landline Mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate';
      set({ error: errorMessage });
      console.error('activateLandlineMode error:', err);
      throw err; // Re-throw so UI can handle if needed
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Deactivate Landline Mode
  deactivateLandlineMode: async () => {
    set({ isLoading: true, error: null });
    try {
      // Stop auto-refresh first
      get().stopAutoRefresh();

      // Call native API to deactivate
      NotificationApiManager.setLandlineMode(false);

      // Disable DND (optional)
      try {
        if (DndManager.hasPermission()) {
          await DndManager.setDNDEnabled(false);
        }
      } catch (dndErr) {
        console.warn('DND disable failed:', dndErr);
        // Continue anyway
      }

      // Stop foreground service
      try {
        BackgroundServiceManager.stopForegroundService();
      } catch (serviceErr) {
        console.warn('Service stop failed:', serviceErr);
        // Continue anyway
      }

      // Verify it actually deactivated
      const actualActive = NotificationApiManager.isLandlineModeActive();

      set({
        isActive: actualActive,
        sessionStartTime: null,
      });

      // Final refresh to get latest notifications
      await get().refreshNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate';
      set({ error: errorMessage });
      console.error('deactivateLandlineMode error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Refresh notifications periodically
  refreshNotifications: async () => {
    try {
      const logs = await NotificationApiManager.getLoggedNotifications();
      set({
        notifications: Array.isArray(logs) ? logs : [],
        refreshError: null, // Clear refresh errors on success
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';
      // Don't throw, just track the error
      set({ refreshError: errorMessage });
      console.warn('Failed to refresh notifications:', err);
    }
  },

  // Action: Start 30-second auto-refresh
  startAutoRefresh: () => {
    const { refreshInterval } = get();

    // Don't start if already running
    if (refreshInterval) {
      return;
    }

    // Refresh immediately
    get().refreshNotifications();

    // Then every 30 seconds
    const interval = setInterval(() => {
      get().refreshNotifications();
    }, 30000);

    set({ refreshInterval: interval });
  },

  // Action: Stop auto-refresh
  stopAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      set({ refreshInterval: null });
    }
  },

  // Action: Request notification permission
  requestPermission: async () => {
    try {
      await NotificationApiManager.requestNotificationListenerPermission();
      // Re-check permission status after user grants/denies
      const perm = NotificationApiManager.hasNotificationListenerPermission();
      set({ hasPermission: perm, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      set({ error: errorMessage });
      console.error('requestPermission error:', err);
      throw err;
    }
  },

  // Action: Clear errors (for UI to call)
  clearError: () => set({ error: null }),
  clearRefreshError: () => set({ refreshError: null }),
}));
