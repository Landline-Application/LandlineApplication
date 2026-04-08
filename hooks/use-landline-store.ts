import { Platform } from 'react-native';

import { NotebookLogEntry } from '@/components/notifications/notebook-log-view';
import * as DndManager from '@/modules/dnd-manager';
import NotificationApiManager, {
  isNotificationFilterEffective,
} from '@/modules/notification-api-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SESSION_START_KEY = 'landline_session_start_time';

function deduplicateNotifications(logs: NotebookLogEntry[]): NotebookLogEntry[] {
  const seen = new Set<string>();
  return logs.filter((n) => {
    const key = `${n.packageName}-${n.postTime}-${n.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const SESSION_MODE_KEY = 'landline_session_mode';
const SESSION_END_TIME_KEY = 'landline_session_end_time';

export type SessionMode = 'indefinite' | 'timer';

interface LandlineModeState {
  // State
  isActive: boolean;
  hasPermission: boolean;
  hasPostPermission: boolean;
  hasDndPermission: boolean;
  lastStatusUpdate: number;
  notifications: NotebookLogEntry[];
  sessionStartTime: Date | null;
  sessionMode: SessionMode | null;
  sessionEndTime: Date | null;
  isLoading: boolean;
  error: string | null;
  refreshError: string | null;

  // Internal state (not exposed to UI)
  refreshInterval: ReturnType<typeof setInterval> | null;
  countdownInterval: ReturnType<typeof setInterval> | null;

  // Actions
  activateLandlineMode: (mode?: SessionMode, durationMinutes?: number) => Promise<void>;
  deactivateLandlineMode: () => Promise<void>;
  checkStatus: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestPermission: () => Promise<void>;
  clearError: () => void;
  clearRefreshError: () => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  checkTimerCompletion: () => boolean;
}

export const useLandlineStore = create<LandlineModeState>((set, get) => ({
  // Initial State
  isActive: false,
  hasPermission: false,
  hasPostPermission: false,
  hasDndPermission: false,
  lastStatusUpdate: 0,
  notifications: [],
  sessionStartTime: null,
  sessionMode: null,
  sessionEndTime: null,
  isLoading: false,
  error: null,
  refreshError: null,
  refreshInterval: null,
  countdownInterval: null,

  // Action: Check current status from native
  checkStatus: async () => {
    // Only run on Android
    if (Platform.OS !== 'android') {
      return;
    }

    set({ isLoading: true });
    try {
      const perm = NotificationApiManager.hasNotificationListenerPermission();
      const postPerm = NotificationApiManager.hasPostPermission();
      const dndPerm = DndManager.hasPermission();
      const active = NotificationApiManager.isLandlineModeActive();
      const logs = await NotificationApiManager.getLoggedNotifications();

      let sessionStart: Date | null = null;
      let sessionMode: SessionMode | null = null;
      let sessionEnd: Date | null = null;
      if (active) {
        try {
          const stored = await AsyncStorage.getItem(SESSION_START_KEY);
          const fallbackTs = Date.now();
          sessionStart = stored ? new Date(parseInt(stored, 10)) : new Date(fallbackTs);
          if (!stored) {
            await AsyncStorage.setItem(SESSION_START_KEY, fallbackTs.toString());
          }
          const storedMode = (await AsyncStorage.getItem(SESSION_MODE_KEY)) as SessionMode | null;
          sessionMode = storedMode || 'indefinite';
          const storedEnd = await AsyncStorage.getItem(SESSION_END_TIME_KEY);
          sessionEnd = storedEnd ? new Date(parseInt(storedEnd, 10)) : null;
        } catch (storageErr) {
          console.warn('Failed to read session data:', storageErr);
          sessionStart = new Date();
          sessionMode = 'indefinite';
        }
      }

      set({
        hasPermission: perm,
        hasPostPermission: postPerm,
        hasDndPermission: dndPerm,
        lastStatusUpdate: Date.now(),
        isActive: active,
        notifications: Array.isArray(logs) ? deduplicateNotifications(logs) : [],
        sessionStartTime: sessionStart,
        sessionMode,
        sessionEndTime: sessionEnd,
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
  activateLandlineMode: async (mode: SessionMode = 'indefinite', durationMinutes?: number) => {
    set({ isLoading: true, error: null });
    try {
      // Set DND policy and mode BEFORE activating Landline Mode so that the policy
      // is in place when the first notification arrives. If we set landline mode first,
      // a notification could arrive before DND is configured and be mishandled.
      try {
        if (DndManager.hasPermission()) {
          const constants = DndManager.getInterruptionFilterConstants();
          DndManager.setLandlineNotificationPolicy();
          await DndManager.setInterruptionFilter(constants.PRIORITY);
        }
      } catch (dndErr) {
        console.warn('DND not available:', dndErr);
      }

      // Activate Landline Mode after DND is configured
      NotificationApiManager.setLandlineMode(true);

      // Verify it actually activated
      const actualActive = NotificationApiManager.isLandlineModeActive();

      const now = new Date();
      let endTime: Date | null = null;
      if (actualActive) {
        try {
          await AsyncStorage.setItem(SESSION_START_KEY, now.getTime().toString());
          await AsyncStorage.setItem(SESSION_MODE_KEY, mode);
          if (mode === 'timer' && durationMinutes) {
            endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
            await AsyncStorage.setItem(SESSION_END_TIME_KEY, endTime.getTime().toString());
          }
        } catch (storageErr) {
          console.warn('Failed to persist session data:', storageErr);
        }
      }

      set({
        isActive: actualActive,
        sessionStartTime: actualActive ? now : null,
        sessionMode: actualActive ? mode : null,
        sessionEndTime: actualActive ? endTime : null,
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

      // Restore DND to normal and reset the notification policy
      try {
        if (DndManager.hasPermission()) {
          DndManager.restoreNotificationPolicy();
          await DndManager.setDNDEnabled(false);
        }
      } catch (dndErr) {
        console.warn('DND disable failed:', dndErr);
        // Continue anyway
      }

      // Verify it actually deactivated
      const actualActive = NotificationApiManager.isLandlineModeActive();

      if (!actualActive) {
        try {
          await AsyncStorage.removeItem(SESSION_START_KEY);
          await AsyncStorage.removeItem(SESSION_MODE_KEY);
          await AsyncStorage.removeItem(SESSION_END_TIME_KEY);
        } catch (storageErr) {
          console.warn('Failed to clear session data:', storageErr);
        }
      }

      // Clear countdown interval if exists
      const { countdownInterval } = get();
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      set({
        isActive: actualActive,
        sessionStartTime: actualActive ? get().sessionStartTime : null,
        sessionMode: actualActive ? get().sessionMode : null,
        sessionEndTime: actualActive ? get().sessionEndTime : null,
        countdownInterval: null,
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
        notifications: Array.isArray(logs) ? deduplicateNotifications(logs) : [],
        refreshError: null, // Clear refresh errors on success
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';
      // Don't throw, just track the error
      set({ refreshError: errorMessage });
      console.warn('Failed to refresh notifications:', err);
    }
  },

  // Action: Start 30-second auto-refresh and timer check
  startAutoRefresh: () => {
    const { refreshInterval, countdownInterval } = get();

    // 1. Manage Refresh Interval (Notifications)
    if (!refreshInterval) {
      // Refresh immediately
      get().refreshNotifications();

      const interval = setInterval(() => {
        get().refreshNotifications();
      }, 30000);

      set({ refreshInterval: interval });
    }

    // 2. Manage Countdown/Timer Interval
    if (!countdownInterval) {
      const interval = setInterval(() => {
        const { sessionMode, sessionEndTime, isActive } = get();

        if (!isActive) {
          get().stopAutoRefresh();
          return;
        }

        // Auto-deactivate if timer mode is complete
        if (sessionMode === 'timer' && sessionEndTime) {
          const now = new Date();
          if (now.getTime() >= sessionEndTime.getTime()) {
            console.log('Session timer expired, deactivating...');
            get().deactivateLandlineMode();
          }
        }
      }, 5000); // Check every 5s for timer completion

      set({ countdownInterval: interval });
    }
  },

  // Action: Stop all intervals
  stopAutoRefresh: () => {
    const { refreshInterval, countdownInterval } = get();
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    set({ refreshInterval: null, countdownInterval: null });
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

  // Action: Check if timer has completed
  checkTimerCompletion: () => {
    const { sessionMode, sessionEndTime, isActive } = get();
    if (!isActive || sessionMode !== 'timer' || !sessionEndTime) {
      return false;
    }
    const now = new Date();
    const isComplete = now.getTime() >= sessionEndTime.getTime();
    return isComplete;
  },
}));
