import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect } from 'expo-router';

import { useLandlineStore } from './use-landline-store';

/**
 * Custom hook that enables fast polling when screen is focused and condition is met.
 *
 * Coordinates with the store's auto-refresh to avoid duplicate polling. If the store
 * already has a refresh interval running, this hook will only do an initial refresh
 * on focus and skip setting up its own interval.
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
  const hasStoreAutoRefreshRef = useRef(false);

  // Detect if the store already started auto-refresh (e.g. via checkStatus or activateLandlineMode).
  // We check once on mount and whenever isActive changes.
  useEffect(() => {
    if (isActive) {
      try {
        const { refreshInterval } = useLandlineStore.getState();
        hasStoreAutoRefreshRef.current = refreshInterval != null;
      } catch {
        hasStoreAutoRefreshRef.current = false;
      }
    } else {
      hasStoreAutoRefreshRef.current = false;
    }
  }, [isActive]);

  useFocusEffect(
    useCallback(() => {
      // If the condition is met (e.g., Landline Mode is active), start fast polling
      // BUT only if the store is NOT already auto-refreshing to avoid duplicate polling.
      if (isActive && !hasStoreAutoRefreshRef.current) {
        // Refresh immediately when screen comes into focus
        refreshFn();

        // Then poll at the specified interval
        activeRefreshInterval.current = setInterval(() => {
          refreshFn();
        }, intervalMs);
      } else if (isActive && hasStoreAutoRefreshRef.current) {
        // Store is handling polling — just do one refresh on focus
        refreshFn();
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
