import { requireNativeModule } from 'expo-modules-core';

export type UsageWindow = '24h' | '7d' | '30d';

export type AppUsageSummary = {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  /** File URI of the app icon, if available */
  iconUri?: string;
};

export type DailyUsagePoint = {
  /** Local calendar day, YYYY-MM-DD */
  date: string;
  totalTimeMs: number;
};

export type AppDailyUsage = {
  packageName: string;
  appName: string;
  iconUri?: string;
  days: DailyUsagePoint[];
};

type UsageStatsNativeModule = {
  hasUsageStatsPermission(): boolean;
  openUsageStatsSettings(): Promise<boolean>;
  getTopUsageApps(days: number, limit: number): Promise<AppUsageSummary[]>;
  getDailyAppUsage(packageNames: string[], days: number): Promise<AppDailyUsage[]>;
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
  const days = window === '7d' ? 7 : window === '30d' ? 30 : 1;
  return native.getTopUsageApps(days, limit);
}

function readUsageMs(value: unknown): number {
  const ms = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms;
}

/** Daily screen time for the given packages. Days with no use are omitted. */
export async function getDailyAppUsage(
  packageNames: string[],
  days: number,
): Promise<AppDailyUsage[]> {
  const native = getNative();
  if (!native) return [];
  const unique = [...new Set(packageNames.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  const raw = await native.getDailyAppUsage(unique, safeDays);
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    if (!entry || typeof entry.packageName !== 'string' || entry.packageName.length === 0) {
      return [];
    }
    const points = Array.isArray(entry.days)
      ? entry.days.flatMap((point) => {
          if (!point || typeof point.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(point.date)) {
            return [];
          }
          return [{ date: point.date, totalTimeMs: readUsageMs(point.totalTimeMs) }];
        })
      : [];
    const row: AppDailyUsage = {
      packageName: entry.packageName,
      appName:
        typeof entry.appName === 'string' && entry.appName.trim().length > 0
          ? entry.appName
          : entry.packageName,
      days: points,
    };
    if (typeof entry.iconUri === 'string' && entry.iconUri.length > 0) {
      row.iconUri = entry.iconUri;
    }
    return [row];
  });
}

export default {
  hasUsageStatsPermission,
  openUsageStatsSettings,
  getTopUsageApps,
  getDailyAppUsage,
};
