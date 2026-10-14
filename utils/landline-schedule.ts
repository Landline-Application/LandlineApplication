export type LandlineSchedule = {
  id: string;
  enabled: boolean;
  /** Minutes from local midnight, 0–1439. */
  startMinutes: number;
  /** Minutes from local midnight, 0–1439. Earlier than start means the window crosses midnight. */
  endMinutes: number;
  /** 0 = Sunday … 6 = Saturday. For overnight windows, these are the days the start time falls on. */
  days: number[];
  name: string;
};

export const SCHEDULE_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const SCHEDULE_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MAX_SCHEDULES = 20;

export function createScheduleId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatScheduleMinutes(minutes: number): string {
  const clamped = Math.min(1439, Math.max(0, minutes));
  const hour24 = Math.floor(clamped / 60);
  const minute = clamped % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

export function formatScheduleDays(days: number[]): string {
  const ordered = [...new Set(days)].filter((day) => day >= 0 && day <= 6).sort((a, b) => a - b);
  const key = ordered.join(',');
  if (key === '1,2,3,4,5') return 'Weekdays';
  if (key === '0,6') return 'Weekends';
  if (key === '0,1,2,3,4,5,6') return 'Every day';
  if (key === '0,1,2,3,4') return 'Sun–Thu';
  if (ordered.length === 0) return 'No days';
  return ordered.map((day) => SCHEDULE_DAY_LABELS[day]).join(', ');
}

export function formatScheduleRange(schedule: Pick<LandlineSchedule, 'startMinutes' | 'endMinutes'>): string {
  const start = formatScheduleMinutes(schedule.startMinutes);
  const end = formatScheduleMinutes(schedule.endMinutes);
  if (schedule.endMinutes < schedule.startMinutes) {
    return `${start} – ${end} next morning`;
  }
  return `${start} – ${end}`;
}

export function scheduleCrossesMidnight(schedule: Pick<LandlineSchedule, 'startMinutes' | 'endMinutes'>): boolean {
  return schedule.endMinutes < schedule.startMinutes;
}

export function validateLandlineSchedule(
  schedule: LandlineSchedule,
  existingCount: number,
  isNew: boolean,
): string | null {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(schedule.id)) {
    return 'This schedule could not be saved.';
  }
  if (schedule.name.length > 40) {
    return 'Name must be 40 characters or fewer.';
  }
  if (schedule.days.length === 0) {
    return 'Select at least one day.';
  }
  if (schedule.days.some((day) => day < 0 || day > 6)) {
    return 'Select valid days.';
  }
  if (
    schedule.startMinutes < 0 ||
    schedule.startMinutes > 1439 ||
    schedule.endMinutes < 0 ||
    schedule.endMinutes > 1439
  ) {
    return 'Choose a valid start and end time.';
  }
  if (schedule.startMinutes === schedule.endMinutes) {
    return 'Start and end time need to be different.';
  }
  if (isNew && existingCount >= MAX_SCHEDULES) {
    return `You can save up to ${MAX_SCHEDULES} schedules.`;
  }
  return null;
}

export function parseLandlineSchedules(json: string): LandlineSchedule[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const record = entry as Record<string, unknown>;
      if (typeof record.id !== 'string') return [];
      if (typeof record.startMinutes !== 'number' || typeof record.endMinutes !== 'number') {
        return [];
      }
      if (!Array.isArray(record.days)) return [];
      const days = record.days.filter((day): day is number => typeof day === 'number');
      return [
        {
          id: record.id,
          enabled: record.enabled !== false,
          startMinutes: record.startMinutes,
          endMinutes: record.endMinutes,
          days,
          name: typeof record.name === 'string' ? record.name : '',
        },
      ];
    });
  } catch {
    return [];
  }
}

export const SCHEDULE_TEMPLATES: { name: string; startMinutes: number; endMinutes: number; days: number[] }[] =
  [
    { name: 'Weeknights', startMinutes: 21 * 60, endMinutes: 7 * 60, days: [0, 1, 2, 3, 4] },
    { name: 'Work hours', startMinutes: 9 * 60, endMinutes: 17 * 60, days: [1, 2, 3, 4, 5] },
  ];
