/**
 * Calendar-day and calendar-week math for per-app screen-time caps.
 * A day is local midnight to midnight. A week is Monday through Sunday.
 */

export const USAGE_TREND_DAYS = 14;
export const USAGE_WEEK_TREND_COUNT = 4;
/** History fetched so the 14-day chart and four Monday weeks are both covered. */
export const USAGE_HISTORY_DAYS = 35;

export const MIN_TARGET_MS = 15 * 60 * 1000;
export const MAX_DAILY_TARGET_MS = 24 * 60 * 60 * 1000;
export const MAX_WEEKLY_TARGET_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_DAILY_MS = 60 * 60 * 1000;
const DEFAULT_WEEKLY_MS = 7 * 60 * 60 * 1000;

export interface UsageTarget {
  packageName: string;
  appName: string;
  /** Null when the user has not set a daily cap. */
  dailyLimitMs: number | null;
  /** Null when the user has not set a weekly cap. */
  weeklyLimitMs: number | null;
  createdAt: number;
}

export interface DayUsage {
  date: string;
  label: string;
  totalTimeMs: number;
  isToday: boolean;
}

export interface WeekUsage {
  startDate: string;
  label: string;
  totalTimeMs: number;
  isCurrent: boolean;
}

export interface TargetProgress {
  todayMs: number;
  weekMs: number;
  days: DayUsage[];
  weeks: WeekUsage[];
}

export type LimitPace = 'under' | 'close' | 'over' | 'unset';

export interface UsageTargetDraft {
  packageName: string;
  appName: string;
  iconUri?: string;
  dailyLimitMs: number | null;
  weeklyLimitMs: number | null;
  createdAt?: number;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday 00:00 in the local timezone. */
export function startOfLocalWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const weekday = start.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  start.setDate(start.getDate() - daysFromMonday);
  return start;
}

export function formatUsageDuration(durationMs: number): string {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60000));
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  const date = new Date(year || 1970, (month || 1) - 1, day || 1);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function limitPace(usedMs: number, limitMs: number | null): LimitPace {
  if (limitMs == null || limitMs <= 0) return 'unset';
  if (usedMs > limitMs) return 'over';
  if (usedMs >= limitMs * 0.8) return 'close';
  return 'under';
}

export function limitRemainingLabel(usedMs: number, limitMs: number): string {
  const delta = limitMs - usedMs;
  if (delta >= 0) return `${formatUsageDuration(delta)} left`;
  return `${formatUsageDuration(-delta)} over`;
}

export function usageTargetsMenuSubtitle(count: number): string {
  if (count <= 0) return 'Stay under a daily or weekly cap';
  if (count === 1) return '1 app with a cap';
  return `${count} apps with a cap`;
}

export function sanitizeLimitMs(value: number | null, maxMs: number): number | null {
  return clampLimit(value, maxMs);
}

function clampLimit(value: unknown, maxMs: number): number | null {
  if (value == null) return null;
  const ms = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.min(maxMs, Math.max(MIN_TARGET_MS, Math.round(ms)));
}

export function clampTargetMinutes(ms: number, maxMs: number): number {
  const stepped = Math.round(ms / MIN_TARGET_MS) * MIN_TARGET_MS;
  return Math.min(maxMs, Math.max(MIN_TARGET_MS, stepped));
}

export function defaultDailyLimitMs(): number {
  return DEFAULT_DAILY_MS;
}

export function defaultWeeklyLimitMs(): number {
  return DEFAULT_WEEKLY_MS;
}

export function normalizeUsageTargets(value: unknown): UsageTarget[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const targets: UsageTarget[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<UsageTarget>;
    if (typeof row.packageName !== 'string' || row.packageName.trim().length === 0) continue;
    const packageName = row.packageName.trim();
    if (seen.has(packageName)) continue;
    const dailyLimitMs = clampLimit(row.dailyLimitMs, MAX_DAILY_TARGET_MS);
    const weeklyLimitMs = clampLimit(row.weeklyLimitMs, MAX_WEEKLY_TARGET_MS);
    if (dailyLimitMs == null && weeklyLimitMs == null) continue;
    seen.add(packageName);
    targets.push({
      packageName,
      appName:
        typeof row.appName === 'string' && row.appName.trim().length > 0
          ? row.appName.trim()
          : packageName,
      dailyLimitMs,
      weeklyLimitMs,
      createdAt: typeof row.createdAt === 'number' && Number.isFinite(row.createdAt) ? row.createdAt : 0,
    });
  }

  return targets;
}

export function buildTargetProgress(
  points: readonly { date: string; totalTimeMs: number }[],
  now: Date = new Date(),
  trendDays = USAGE_TREND_DAYS,
): TargetProgress {
  const byDate = new Map<string, number>();
  for (const point of points) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date)) continue;
    const ms = Number.isFinite(point.totalTimeMs) ? Math.max(0, point.totalTimeMs) : 0;
    byDate.set(point.date, (byDate.get(point.date) ?? 0) + ms);
  }

  const today = startOfLocalDay(now);
  const todayKey = localDateKey(today);
  const trendStart = addLocalDays(today, -(trendDays - 1));
  const days: DayUsage[] = [];
  for (let index = 0; index < trendDays; index += 1) {
    const date = addLocalDays(trendStart, index);
    const key = localDateKey(date);
    days.push({
      date: key,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      totalTimeMs: byDate.get(key) ?? 0,
      isToday: key === todayKey,
    });
  }

  const weekStart = startOfLocalWeek(today);
  let weekMs = 0;
  for (let index = 0; index < 7; index += 1) {
    const key = localDateKey(addLocalDays(weekStart, index));
    if (key > todayKey) break;
    weekMs += byDate.get(key) ?? 0;
  }

  const weeks: WeekUsage[] = [];
  for (let offset = USAGE_WEEK_TREND_COUNT - 1; offset >= 0; offset -= 1) {
    const start = addLocalDays(weekStart, -7 * offset);
    let totalTimeMs = 0;
    for (let index = 0; index < 7; index += 1) {
      const key = localDateKey(addLocalDays(start, index));
      if (key > todayKey) break;
      totalTimeMs += byDate.get(key) ?? 0;
    }
    const isCurrent = offset === 0;
    weeks.push({
      startDate: localDateKey(start),
      label: isCurrent ? 'Now' : offset === 1 ? 'Last' : formatDateKey(localDateKey(start)),
      totalTimeMs,
      isCurrent,
    });
  }

  return {
    todayMs: byDate.get(todayKey) ?? 0,
    weekMs,
    days,
    weeks,
  };
}

export function countTargetsOverCap(
  targets: readonly UsageTarget[],
  progressByPackage: ReadonlyMap<string, TargetProgress>,
): number {
  let over = 0;
  for (const target of targets) {
    const progress = progressByPackage.get(target.packageName);
    if (!progress) continue;
    const dailyOver = target.dailyLimitMs != null && progress.todayMs > target.dailyLimitMs;
    const weeklyOver = target.weeklyLimitMs != null && progress.weekMs > target.weeklyLimitMs;
    if (dailyOver || weeklyOver) over += 1;
  }
  return over;
}

export function usageTargetsHeaderSubtitle(
  targets: readonly UsageTarget[],
  progressByPackage: ReadonlyMap<string, TargetProgress>,
  hasUsage: boolean,
): string {
  if (targets.length === 0) return 'Daily and weekly caps';
  if (!hasUsage) return usageTargetsMenuSubtitle(targets.length);
  const over = countTargetsOverCap(targets, progressByPackage);
  if (over === 0) return targets.length === 1 ? 'On track' : 'All targets on track';
  if (over === 1) return '1 app over its cap';
  return `${over} apps over their cap`;
}
