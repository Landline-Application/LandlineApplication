/**
 * Device-local Landline Mode usage: lifetime totals plus recent sessions
 * so the statistics page can filter by time range.
 */
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Recent sessions kept for the usage-style time ranges. Lifetime totals are separate. */
export const MAX_SESSION_HISTORY = 400;

export interface LandlineSessionRecord {
  endedAt: number;
  durationMs: number;
  notificationsBlocked: number;
}

export interface ActiveLandlineSession {
  startedAt: number;
  notificationsBlocked: number;
}

export type StatsWindow = '24h' | '7d' | '30d' | 'all';

export const STATS_WINDOWS: readonly { key: StatsWindow; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'All' },
] as const;

export interface SessionListItem {
  id: string;
  title: string;
  subtitle: string;
  /** Time from this session that falls inside the selected range. */
  durationMs: number;
  inProgress: boolean;
  at: number;
}

export interface WindowSummary {
  durationMs: number;
  sessionCount: number;
  notificationsBlocked: number;
  items: SessionListItem[];
  /** All-time list can be shorter than sessionCount once history is trimmed. */
  historyTruncated: boolean;
}

interface LandlineStatsState {
  totalDurationMs: number;
  sessionCount: number;
  sessions: LandlineSessionRecord[];
  recordSession: (input: LandlineSessionRecord) => void;
  reset: () => void;
}

function windowStartMs(window: StatsWindow, now: number): number | null {
  switch (window) {
    case '24h':
      return now - DAY_MS;
    case '7d':
      return now - 7 * DAY_MS;
    case '30d':
      return now - 30 * DAY_MS;
    case 'all':
      return null;
  }
}

function overlapMs(start: number, end: number, rangeStart: number | null, now: number): number {
  const from = rangeStart == null ? start : Math.max(start, rangeStart);
  const to = Math.min(end, now);
  return Math.max(0, to - from);
}

export function formatLandlineDuration(durationMs: number): string {
  const ms = Math.max(0, Math.floor(durationMs));
  if (ms <= 0) return '0m';
  if (ms < MINUTE_MS) return `${Math.floor(ms / 1000)}s`;

  const totalMinutes = Math.floor(ms / MINUTE_MS);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    if (hours === 0) return `${days}d`;
    return `${days}d ${hours}h`;
  }
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatCount(count: number): string {
  return Math.max(0, Math.floor(count)).toLocaleString();
}

export function pluralLabel(count: number, singular: string, pluralForm?: string): string {
  const n = Math.max(0, Math.floor(count));
  const word = n === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${n.toLocaleString()} ${word}`;
}

export function statsWindowPhrase(window: StatsWindow): string {
  switch (window) {
    case '24h':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case 'all':
      return 'All time';
  }
}

export function statisticsMenuSubtitle(
  durationMs: number,
  sessionCount: number,
  inProgress = false,
): string {
  if (sessionCount <= 0 && durationMs <= 0) {
    return inProgress ? 'Session in progress' : 'Time in Landline Mode, sessions, and your log';
  }
  const base = `${formatLandlineDuration(durationMs)} across ${pluralLabel(sessionCount, 'session')}`;
  return inProgress ? `${base} · in progress` : base;
}

function formatSessionWhen(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function listItemFromSession(
  session: LandlineSessionRecord,
  index: number,
  countedMs: number,
): SessionListItem {
  const blocked = Math.max(0, session.notificationsBlocked);
  return {
    id: `${session.endedAt}-${index}`,
    title: formatSessionWhen(session.endedAt),
    subtitle: pluralLabel(blocked, 'notification', 'notifications') + ' quieted',
    durationMs: countedMs,
    inProgress: false,
    at: session.endedAt,
  };
}

function listItemFromActive(
  active: ActiveLandlineSession,
  now: number,
  countedMs: number,
): SessionListItem {
  return {
    id: 'active',
    title: 'In progress',
    subtitle: `Started ${formatSessionWhen(active.startedAt)}`,
    durationMs: countedMs,
    inProgress: true,
    at: now,
  };
}

export function summarizeStatsWindow(params: {
  window: StatsWindow;
  totalDurationMs: number;
  sessionCount: number;
  sessions: readonly LandlineSessionRecord[];
  lifetimeNotificationsBlocked: number;
  active: ActiveLandlineSession | null;
  now?: number;
}): WindowSummary {
  const now = params.now ?? Date.now();
  const rangeStart = windowStartMs(params.window, now);
  const history = Array.isArray(params.sessions) ? params.sessions : [];
  const items: SessionListItem[] = [];
  let durationMs = 0;
  let sessionCount = 0;
  let notificationsBlocked = 0;

  if (params.active && params.active.startedAt <= now) {
    const activeDuration = overlapMs(params.active.startedAt, now, rangeStart, now);
    if (activeDuration > 0) {
      durationMs += activeDuration;
      sessionCount += 1;
      notificationsBlocked += Math.max(0, params.active.notificationsBlocked);
      items.push(listItemFromActive(params.active, now, activeDuration));
    }
  }

  history.forEach((session, index) => {
    if (session.durationMs <= 0) return;
    const start = session.endedAt - session.durationMs;
    const counted = overlapMs(start, session.endedAt, rangeStart, now);
    if (counted <= 0) return;
    durationMs += params.window === 'all' ? session.durationMs : counted;
    sessionCount += 1;
    notificationsBlocked += Math.max(0, session.notificationsBlocked);
    items.push(
      listItemFromSession(session, index, params.window === 'all' ? session.durationMs : counted),
    );
  });

  items.sort((a, b) => b.at - a.at);

  if (params.window === 'all') {
    const activeDuration =
      params.active && params.active.startedAt <= now
        ? Math.max(0, now - params.active.startedAt)
        : 0;
    return {
      durationMs: Math.max(0, params.totalDurationMs) + activeDuration,
      sessionCount: Math.max(0, params.sessionCount) + (activeDuration > 0 ? 1 : 0),
      notificationsBlocked:
        Math.max(0, params.lifetimeNotificationsBlocked) +
        (activeDuration > 0 ? Math.max(0, params.active?.notificationsBlocked ?? 0) : 0),
      items,
      historyTruncated: history.length < params.sessionCount,
    };
  }

  return {
    durationMs,
    sessionCount,
    notificationsBlocked,
    items,
    historyTruncated: false,
  };
}

export const useLandlineStatsStore = create<LandlineStatsState>()(
  persist(
    (set, get) => ({
      totalDurationMs: 0,
      sessionCount: 0,
      sessions: [],

      recordSession: ({ endedAt, durationMs, notificationsBlocked }) => {
        const duration = Math.floor(durationMs);
        if (!Number.isFinite(duration) || duration <= 0) return;
        const blocked = Number.isFinite(notificationsBlocked)
          ? Math.max(0, Math.floor(notificationsBlocked))
          : 0;
        const ended = Number.isFinite(endedAt) ? endedAt : Date.now();
        const state = get();
        const previous = Array.isArray(state.sessions) ? state.sessions : [];
        const sessions = [
          ...previous,
          { endedAt: ended, durationMs: duration, notificationsBlocked: blocked },
        ].slice(-MAX_SESSION_HISTORY);

        set({
          totalDurationMs: Math.max(0, state.totalDurationMs) + duration,
          sessionCount: Math.max(0, state.sessionCount) + 1,
          sessions,
        });
      },

      reset: () => {
        set({ totalDurationMs: 0, sessionCount: 0, sessions: [] });
      },
    }),
    {
      name: STORAGE_KEYS.LANDLINE_STATS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalDurationMs: state.totalDurationMs,
        sessionCount: state.sessionCount,
        sessions: state.sessions,
      }),
    },
  ),
);
