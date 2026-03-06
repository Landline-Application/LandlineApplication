import { Platform } from 'react-native';

import * as AutoReplyManager from '@/modules/auto-reply-manager';
import { create } from 'zustand';

interface AutoReplyState {
  // State
  isEnabled: boolean;
  hasPermission: boolean;
  isServiceRunning: boolean;
  message: string;
  allowedApps: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  checkStatus: () => void;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  setMessage: (message: string) => Promise<void>;
  setAllowedApps: (apps: string[]) => Promise<void>;
  requestPermission: () => Promise<void>;
  clearError: () => void;
}

export const useAutoReplyStore = create<AutoReplyState>((set, get) => ({
  // Initial State
  isEnabled: false,
  hasPermission: false,
  isServiceRunning: false,
  message: '',
  allowedApps: [],
  isLoading: false,
  error: null,

  // Action: Check current status from native
  checkStatus: () => {
    // Only run on Android
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const enabled = AutoReplyManager.isAutoReplyEnabled();
      const permission = AutoReplyManager.isListenerEnabled();
      const serviceRunning = AutoReplyManager.isServiceRunning();
      const msg = AutoReplyManager.getReplyMessage();
      const apps = AutoReplyManager.getAllowedApps();

      set({
        isEnabled: enabled,
        hasPermission: permission,
        isServiceRunning: serviceRunning,
        message: msg,
        allowedApps: apps,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({ error: errorMessage });
      console.error('checkStatus error:', err);
    }
  },

  // Action: Enable auto-reply
  enable: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await AutoReplyManager.setAutoReplyEnabled(true);

      if (result.success) {
        set({ isEnabled: true });
      } else {
        throw new Error(result.message || 'Failed to enable auto-reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable';
      set({ error: errorMessage });
      console.error('enable error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
      // Refresh status to get latest service state
      get().checkStatus();
    }
  },

  // Action: Disable auto-reply
  disable: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await AutoReplyManager.setAutoReplyEnabled(false);

      if (result.success) {
        set({ isEnabled: false });
      } else {
        throw new Error(result.message || 'Failed to disable auto-reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable';
      set({ error: errorMessage });
      console.error('disable error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
      // Refresh status to get latest service state
      get().checkStatus();
    }
  },

  // Action: Set reply message
  setMessage: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await AutoReplyManager.setReplyMessage(message);

      if (result.success) {
        set({ message });
      } else {
        throw new Error(result.message || 'Failed to set message');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set message';
      set({ error: errorMessage });
      console.error('setMessage error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Set allowed apps
  setAllowedApps: async (apps: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const result = await AutoReplyManager.setAllowedApps(apps);

      if (result.success) {
        set({ allowedApps: apps });
      } else {
        throw new Error(result.message || 'Failed to set allowed apps');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set allowed apps';
      set({ error: errorMessage });
      console.error('setAllowedApps error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Request notification listener permission
  requestPermission: async () => {
    try {
      await AutoReplyManager.requestListenerPermission();

      // Re-check permission status after user grants/denies
      setTimeout(() => {
        const permission = AutoReplyManager.isListenerEnabled();
        set({ hasPermission: permission, error: null });
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      set({ error: errorMessage });
      console.error('requestPermission error:', err);
      throw err;
    }
  },

  // Action: Clear errors
  clearError: () => set({ error: null }),
}));
