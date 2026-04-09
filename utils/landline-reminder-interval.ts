import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_LANDLINE_REMINDER_INTERVAL_HOURS = 2;

export const LANDLINE_REMINDER_INTERVAL_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

export type LandlineReminderIntervalHours = (typeof LANDLINE_REMINDER_INTERVAL_OPTIONS)[number];

export const LANDLINE_REMINDER_INTERVAL_STORAGE_KEY = '@landline_reminder_interval_hours';

export function isValidReminderIntervalHours(n: number): n is LandlineReminderIntervalHours {
  return (LANDLINE_REMINDER_INTERVAL_OPTIONS as readonly number[]).includes(n);
}

export async function getReminderIntervalHoursAsync(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LANDLINE_REMINDER_INTERVAL_STORAGE_KEY);
    if (raw == null) return DEFAULT_LANDLINE_REMINDER_INTERVAL_HOURS;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || !isValidReminderIntervalHours(n)) {
      return DEFAULT_LANDLINE_REMINDER_INTERVAL_HOURS;
    }
    return n;
  } catch {
    return DEFAULT_LANDLINE_REMINDER_INTERVAL_HOURS;
  }
}

export async function persistReminderIntervalHours(hours: number): Promise<void> {
  if (!isValidReminderIntervalHours(hours)) return;
  try {
    await AsyncStorage.setItem(LANDLINE_REMINDER_INTERVAL_STORAGE_KEY, String(hours));
  } catch {
    /* ignore */
  }
}
