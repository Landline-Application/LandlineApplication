import { Platform } from 'react-native';

import { usePreferencesStore } from '@/hooks/use-preferences-store';
import * as AutoReplyManager from '@/modules/auto-reply-manager';
import * as NotificationApiManager from '@/modules/notification-api-manager';
import { create } from 'zustand';

interface AutoReplyState {
  // State
  isEnabled: boolean;
  hasPermission: boolean;
  isServiceRunning: boolean;
  message: string;
  allowedApps: string[];
  isLoading: boolean; // toggle enable/disable only
  isSaving: boolean; // message / allowedApps writes
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
  isSaving: false,
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
      // Use NotificationApiManager for service status (no API 35 gate, reflects actual listener service)
      const serviceRunning = NotificationApiManager.isServiceRunning();
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
        usePreferencesStore.getState().setAutoReplyEnabled(true);
      } else {
        throw new Error(result.message || 'Failed to enable auto-reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable';
      set({ error: errorMessage, isEnabled: false });
      console.error('enable error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Disable auto-reply
  disable: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await AutoReplyManager.setAutoReplyEnabled(false);

      if (result.success) {
        set({ isEnabled: false });
        usePreferencesStore.getState().setAutoReplyEnabled(false);
      } else {
        throw new Error(result.message || 'Failed to disable auto-reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable';
      set({ error: errorMessage, isEnabled: true });
      console.error('disable error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Set reply message
  setMessage: async (message: string) => {
    set({ isSaving: true, error: null });
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
      set({ isSaving: false });
    }
  },

  // Action: Set allowed apps
  setAllowedApps: async (apps: string[]) => {
    set({ isSaving: true, error: null });
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
      set({ isSaving: false });
    }
  },

  // Action: Request notification listener permission
  requestPermission: async () => {
    try {
      await AutoReplyManager.requestListenerPermission();
      // Note: _layout.tsx calls checkStatus() when app returns to foreground,
      // so permission state will be refreshed automatically.
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

// ---------------------------------------------------------------------------
// Preference sync subscription
//
// When onAuthReady() in use-preferences-store applies a remote autoReplyEnabled
// value, this subscription detects the change and reconciles the native layer.
// This keeps use-preferences-store free of any knowledge of this store — the
// data flows one way: preferences → auto-reply, never the reverse at module level.
// ---------------------------------------------------------------------------
let _lastKnownPrefEnabled = usePreferencesStore.getState().autoReplyEnabled;

usePreferencesStore.subscribe((state) => {
  if (state.autoReplyEnabled === _lastKnownPrefEnabled) return;
  _lastKnownPrefEnabled = state.autoReplyEnabled;

  if (Platform.OS !== 'android') return;

  const { isEnabled, enable, disable } = useAutoReplyStore.getState();
  if (state.autoReplyEnabled && !isEnabled) {
    enable().catch((e: unknown) => console.warn('autoReplyStore subscription: enable failed', e));
  } else if (!state.autoReplyEnabled && isEnabled) {
    disable().catch((e: unknown) => console.warn('autoReplyStore subscription: disable failed', e));
  }
});
