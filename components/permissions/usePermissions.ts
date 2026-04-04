import { useCallback, useEffect, useState } from 'react';

import { AppState } from 'react-native';

import { useFocusEffect } from 'expo-router';

import { useLandlineStore } from '@/hooks/use-landline-store';
import * as DndManager from '@/modules/dnd-manager';
import {
  hasNotificationListenerPermission,
  hasPostPermission,
  hasSmsPermission,
  requestNotificationListenerPermission,
  requestPostPermission,
  requestSmsNotificationPermission,
} from '@/modules/notification-api-manager';
import UsageStatsManager from '@/modules/usage-stats-manager';

export interface Permission {
  id: string;
  name: string;
  description: string;
  whyNeeded: string;
  icon: string;
  status: 'granted' | 'denied' | 'unknown';
  isRequired: boolean;
  checkPermission: () => boolean | Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

interface UsePermissionsOptions {
  onPermissionsChanged?: (
    allRequiredGranted: boolean,
    requiredGranted: number,
    requiredCount: number,
  ) => void;
}

export function usePermissions(options?: UsePermissionsOptions) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { checkStatus } = useLandlineStore();
  const { onPermissionsChanged } = options || {};

  const getPermissionDefinitions = useCallback(
    (): Permission[] => [
      {
        id: 'notification_listener',
        name: 'Notification Access',
        description: 'Read and log notifications from other apps',
        whyNeeded:
          'This is the core permission that allows Landline to capture and log notifications while in Landline Mode.',
        icon: 'notifications-active',
        status: 'unknown',
        isRequired: true,
        checkPermission: () => {
          try {
            return hasNotificationListenerPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await requestNotificationListenerPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'notification_post',
        name: 'Post Notifications',
        description: 'Show notifications from Landline app',
        whyNeeded:
          'Allows Landline to alert you when someone on your emergency contact list tries to reach you.',
        icon: 'message',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return hasPostPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await requestPostPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'sms_notification_content',
        name: 'SMS Notification Content',
        description: 'View text message content in your device settings',
        whyNeeded:
          'To display the actual text of incoming messages, your SMS app must be set to show content on notifications. Without this, Landline will only see "Sensitive notification content hidden". Auto-reply may also not work without this setting.',
        icon: 'sms',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return hasSmsPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            await requestSmsNotificationPermission();
            return false;
          } catch {
            return false;
          }
        },
      },
      {
        id: 'dnd',
        name: 'Do Not Disturb',
        description: 'Control Do Not Disturb mode',
        whyNeeded:
          "Enables automatic phone silencing when Landline Mode is active. We'll fall back to ringer controls if denied.",
        icon: 'do-not-disturb-on',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return DndManager.hasPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            return await DndManager.requestPermission();
          } catch {
            return false;
          }
        },
      },
      {
        id: 'app_attention',
        name: 'App Attention',
        description: 'See which apps you use most alongside your notifications',
        whyNeeded:
          'Lets Landline show you screen-time data next to your notification history so you can spot which apps demand the most of your attention.',
        icon: 'bar-chart',
        status: 'unknown',
        isRequired: false,
        checkPermission: () => {
          try {
            return UsageStatsManager.hasUsageStatsPermission();
          } catch {
            return false;
          }
        },
        requestPermission: async () => {
          try {
            await UsageStatsManager.openUsageStatsSettings();
            // The settings screen is opened; actual grant is confirmed on next
            // focus/foreground check. Return false here so the card stays
            // actionable until the user comes back and we re-check.
            return false;
          } catch {
            return false;
          }
        },
      },
    ],
    [],
  );

  const checkAllPermissions = useCallback(
    async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      const definitions = getPermissionDefinitions();

      const updatedPermissions = await Promise.all(
        definitions.map(async (perm) => {
          try {
            const result = await perm.checkPermission();
            return {
              ...perm,
              status: result ? 'granted' : 'denied',
            } as Permission;
          } catch {
            return {
              ...perm,
              status: 'unknown',
            } as Permission;
          }
        }),
      );

      setPermissions(updatedPermissions);

      const reqCount = updatedPermissions.filter((p) => p.isRequired).length;
      const reqGranted = updatedPermissions.filter(
        (p) => p.isRequired && p.status === 'granted',
      ).length;
      const allRequiredGranted = reqGranted === reqCount;

      onPermissionsChanged?.(allRequiredGranted, reqGranted, reqCount);

      if (isInitial) setIsLoading(false);
    },
    [getPermissionDefinitions, onPermissionsChanged],
  );

  // Initial check
  useEffect(() => {
    checkAllPermissions(true);
  }, [checkAllPermissions]);

  // Check when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkAllPermissions();
    }, [checkAllPermissions]),
  );

  // Check when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setTimeout(() => checkAllPermissions(), 500);
        setTimeout(() => checkAllPermissions(), 1200);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAllPermissions]);

  return {
    permissions,
    isLoading,
    checkAllPermissions,
    checkStatus,
  };
}
