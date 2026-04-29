import { Platform } from 'react-native';

import { NotebookLogEntry } from '@/components/notifications/notebook-log-view';
import NotificationApiManager from '@/modules/notification-api-manager';
import {
  cancelLandlineModeReminderScheduled,
  ensureLandlineReminderScheduledIfNeeded,
  scheduleLandlineReminderFromSessionStart,
} from '@/services/landline-mode-reminder';
import { landlineSession } from '@/services/landline-session';
import { SessionClock, createSessionClock } from '@/services/session-clock';
import { SessionMode } from '@/services/session-journal';
import { create } from 'zustand';

export { SessionMode } from '@/services/session-journal';

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
  isAutoRefreshing: boolean;

  // Actions
  activateLandlineMode: (mode?: SessionMode, durationMinutes?: number) => Promise<void>;
  deactivateLandlineMode: () => Promise<void>;
  checkStatus: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestPermission: () => Promise<void>;
  clearError: () => void;
  clearRefreshError: () => void;
}

const clock: SessionClock = createSessionClock();

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
  isAutoRefreshing: false,

  // Action: Check current status from native
  checkStatus: async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    set({ isLoading: true });
    try {
      const perm = NotificationApiManager.hasNotificationListenerPermission();
      const postPerm = NotificationApiManager.hasPostPermission();
      const dndPerm = NotificationApiManager.isNotificationFilterEffective();

      const sessionState = await landlineSession.hydrate();
      const logs = await landlineSession.refreshNotifications();

      set({
        hasPermission: perm,
        hasPostPermission: postPerm,
        hasDndPermission: dndPerm,
        lastStatusUpdate: Date.now(),
        isActive: sessionState.isActive,
        notifications: logs,
        sessionStartTime: sessionState.startTime,
        sessionMode: sessionState.mode,
        sessionEndTime: sessionState.endTime,
        error: null,
      });

      // If active, manage auto-refresh and ensure reminder is scheduled
      if (sessionState.isActive) {
        if (get().isAutoRefreshing) {
          clock.pauseRefresh();
          clock.resumeRefresh();
          if (sessionState.endTime) {
            clock.pauseCountdown();
            clock.resumeCountdown();
          }
        } else {
          clock.startRefresh(30000, () => {
            get().refreshNotifications();
          });
          if (sessionState.endTime) {
            clock.startCountdown(5000, sessionState.endTime, () => {
              get().deactivateLandlineMode();
            });
          }
          set({ isAutoRefreshing: true });
        }
        void ensureLandlineReminderScheduledIfNeeded();
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
      const sessionState = await landlineSession.start(mode, durationMinutes);

      set({
        isActive: sessionState.isActive,
        sessionStartTime: sessionState.startTime,
        sessionMode: sessionState.mode,
        sessionEndTime: sessionState.endTime,
      });

      if (sessionState.isActive) {
        clock.startRefresh(30000, () => {
          get().refreshNotifications();
        });
        if (sessionState.endTime) {
          clock.startCountdown(5000, sessionState.endTime, () => {
            get().deactivateLandlineMode();
          });
        }
        set({ isAutoRefreshing: true });
        await get().refreshNotifications();
        void scheduleLandlineReminderFromSessionStart(sessionState.startTime!.getTime());
      } else {
        throw new Error('Failed to activate Landline Mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate';
      set({ error: errorMessage });
      console.error('activateLandlineMode error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Deactivate Landline Mode
  deactivateLandlineMode: async () => {
    set({ isLoading: true, error: null });
    try {
      clock.stopRefresh();
      clock.stopCountdown();

      const sessionState = await landlineSession.stop();

      set({
        isActive: sessionState.isActive,
        sessionStartTime: sessionState.startTime,
        sessionMode: sessionState.mode,
        sessionEndTime: sessionState.endTime,
        isAutoRefreshing: false,
      });

      if (!sessionState.isActive) {
        await cancelLandlineModeReminderScheduled();
      }

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
      const logs = await landlineSession.refreshNotifications();
      set({
        notifications: logs,
        refreshError: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';
      set({ refreshError: errorMessage });
      console.warn('Failed to refresh notifications:', err);
    }
  },

  // Action: Request notification permission
  requestPermission: async () => {
    try {
      await NotificationApiManager.requestNotificationListenerPermission();
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
