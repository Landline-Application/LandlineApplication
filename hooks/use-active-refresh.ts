import { useCallback, useRef } from 'react';

import { useFocusEffect } from 'expo-router';

/**
 * Custom hook that enables fast polling when screen is focused and condition is met.
 *
 * @param refreshFn - Function to call for refreshing data
 * @param isActive - Condition that must be true for active refresh to run (e.g., Landline Mode is on)
 * @param intervalMs - Polling interval in milliseconds (default: 3000ms = 3 seconds)
 *
 * @example
 * ```tsx
 * const { refreshNotifications, isActive } = useLandlineStore();
 * useActiveRefresh(refreshNotifications, isActive);
 * ```
 */
export function useActiveRefresh(
  refreshFn: () => void | Promise<void>,
  isActive: boolean,
  intervalMs: number = 3000,
) {
  const activeRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      // If the condition is met (e.g., Landline Mode is active), start fast polling
      if (isActive) {
        // Refresh immediately when screen comes into focus
        refreshFn();

        // Then poll at the specified interval
        activeRefreshInterval.current = setInterval(() => {
          refreshFn();
        }, intervalMs);
      }

      // Cleanup: stop fast polling when leaving the screen
      return () => {
        if (activeRefreshInterval.current) {
          clearInterval(activeRefreshInterval.current);
          activeRefreshInterval.current = null;
        }
      };
    }, [isActive, refreshFn, intervalMs]),
  );
}
