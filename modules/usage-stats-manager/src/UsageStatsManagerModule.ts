import { requireNativeModule } from 'expo-modules-core';

export type UsageWindow = '24h' | '7d' | '30d';

export type AppUsageSummary = {
  packageName: string;
  appName: string;
  totalTimeMs: number;
};

type UsageStatsNativeModule = {
  hasUsageStatsPermission(): boolean;
  openUsageStatsSettings(): Promise<boolean>;
  getTopUsageApps(days: number, limit: number): Promise<AppUsageSummary[]>;
};

let cachedNativeModule: UsageStatsNativeModule | null = null;

function getNative(): UsageStatsNativeModule | null {
  if (cachedNativeModule) {
    return cachedNativeModule;
  }

  try {
    cachedNativeModule = requireNativeModule<UsageStatsNativeModule>('UsageStatsManager');
    return cachedNativeModule;
  } catch {
    return null;
  }
}

export function hasUsageStatsPermission(): boolean {
  const native = getNative();
  if (!native) return false;
  return native.hasUsageStatsPermission();
}

export function openUsageStatsSettings(): Promise<boolean> {
  const native = getNative();
  if (!native) return Promise.resolve(false);
  return native.openUsageStatsSettings();
}

export function getTopUsageApps(window: UsageWindow, limit = 5): Promise<AppUsageSummary[]> {
  const native = getNative();
  if (!native) return Promise.resolve([]);
  const days =
    window === '7d' ? 7 : window === '30d' ? 30 : 1;
  return native.getTopUsageApps(days, limit);
}

export default {
  hasUsageStatsPermission,
  openUsageStatsSettings,
  getTopUsageApps,
};
