import { NotebookLogEntry } from '@/components/notifications/notebook-log-view';
import NotificationApiManager from '@/modules/notification-api-manager';

import { LandlinePolicy, landlinePolicy } from './landline-policy';
import * as SessionJournal from './session-journal';
import { SessionMode } from './session-journal';

export interface LandlineSessionState {
  isActive: boolean;
  mode: SessionMode | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface LandlineSession {
  hydrate(): Promise<LandlineSessionState>;
  start(mode: SessionMode, durationMinutes?: number): Promise<LandlineSessionState>;
  stop(): Promise<LandlineSessionState>;
  refreshNotifications(): Promise<NotebookLogEntry[]>;
}

export interface LandlineSessionDeps {
  api: {
    setLandlineMode: (active: boolean) => boolean;
    isLandlineModeActive: () => boolean;
    getLoggedNotifications: () => Promise<any[]>;
  };
  journal: typeof SessionJournal;
  policy: LandlinePolicy;
}

function deduplicateNotifications(logs: NotebookLogEntry[]): NotebookLogEntry[] {
  const seen = new Set<string>();
  return logs.filter((n) => {
    const key = `${n.packageName}-${n.postTime}-${n.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createLandlineSessionState(
  isActive: boolean,
  mode: SessionMode | null = null,
  startTime: Date | null = null,
  endTime: Date | null = null,
): LandlineSessionState {
  return { isActive, mode, startTime, endTime };
}

export function createLandlineSession(deps: Partial<LandlineSessionDeps> = {}): LandlineSession {
  const api = deps.api ?? {
    setLandlineMode: NotificationApiManager.setLandlineMode,
    isLandlineModeActive: NotificationApiManager.isLandlineModeActive,
    getLoggedNotifications: NotificationApiManager.getLoggedNotifications,
  };
  const journal = deps.journal ?? SessionJournal;
  const policy = deps.policy ?? landlinePolicy;

  return {
    async hydrate() {
      const active = api.isLandlineModeActive();
      if (!active) {
        return createLandlineSessionState(false);
      }

      let startMs = await journal.readSessionStartTime();
      if (!startMs) {
        startMs = Date.now();
        await journal.writeSessionStartTime(startMs);
      }
      const mode = (await journal.readSessionMode()) ?? 'indefinite';
      const endMs = await journal.readSessionEndTime();

      return createLandlineSessionState(
        true,
        mode,
        new Date(startMs),
        endMs ? new Date(endMs) : null,
      );
    },

    async start(mode, durationMinutes) {
      await policy.apply();
      api.setLandlineMode(true);
      const active = api.isLandlineModeActive();

      const now = Date.now();
      let endTime: number | null = null;
      if (active && mode === 'timer' && durationMinutes) {
        endTime = now + durationMinutes * 60 * 1000;
      }

      if (active) {
        await journal.writeSessionStartTime(now);
        await journal.writeSessionMode(mode);
        await journal.writeSessionEndTime(endTime);
      }

      return createLandlineSessionState(
        active,
        active ? mode : null,
        active ? new Date(now) : null,
        endTime ? new Date(endTime) : null,
      );
    },

    async stop() {
      api.setLandlineMode(false);

      try {
        await policy.restore();
      } catch (err) {
        console.warn('DND restore failed during session stop:', err);
      }

      const active = api.isLandlineModeActive();
      if (!active) {
        await journal.clearSession();
      }

      const newState = await this.hydrate();
      return newState;
    },

    async refreshNotifications() {
      const logs = await api.getLoggedNotifications();
      return Array.isArray(logs) ? deduplicateNotifications(logs) : [];
    },
  };
}

export const landlineSession = createLandlineSession();
