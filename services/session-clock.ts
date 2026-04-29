export interface SessionClock {
  startRefresh(intervalMs: number, onTick: () => void): void;
  pauseRefresh(): void;
  resumeRefresh(): void;
  stopRefresh(): void;
  startCountdown(checkIntervalMs: number, targetTime: Date | null, onExpire: () => void): void;
  pauseCountdown(): void;
  resumeCountdown(): void;
  stopCountdown(): void;
}

export function createSessionClock(): SessionClock {
  // Refresh interval state
  let refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let refreshOnTick: (() => void) | null = null;
  let refreshIntervalMs = 0;
  let refreshStartTime = 0;
  let refreshPausedElapsed = 0;

  // Countdown interval state
  let countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  let countdownTargetTime: Date | null = null;
  let countdownOnExpire: (() => void) | null = null;
  let countdownCheckIntervalMs = 0;

  return {
    startRefresh(intervalMs, onTick) {
      this.stopRefresh();
      onTick();
      refreshStartTime = Date.now();
      refreshIntervalMs = intervalMs;
      refreshOnTick = onTick;
      refreshIntervalId = setInterval(onTick, intervalMs);
    },

    pauseRefresh() {
      if (refreshIntervalId == null && refreshTimeoutId == null) return;
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshPausedElapsed = Date.now() - refreshStartTime;
        refreshIntervalId = null;
      }
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
    },

    resumeRefresh() {
      if (refreshOnTick == null) return;
      // If already running, do nothing
      if (refreshIntervalId != null || refreshTimeoutId != null) return;

      const remaining = Math.max(0, refreshIntervalMs - refreshPausedElapsed);
      refreshTimeoutId = setTimeout(() => {
        refreshOnTick!();
        refreshStartTime = Date.now();
        refreshIntervalId = setInterval(refreshOnTick!, refreshIntervalMs);
        refreshTimeoutId = null;
        refreshPausedElapsed = 0;
      }, remaining);
    },

    stopRefresh() {
      if (refreshIntervalId) clearInterval(refreshIntervalId);
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      refreshIntervalId = null;
      refreshTimeoutId = null;
      refreshOnTick = null;
      refreshIntervalMs = 0;
      refreshStartTime = 0;
      refreshPausedElapsed = 0;
    },

    startCountdown(checkIntervalMs, targetTime, onExpire) {
      this.stopCountdown();
      if (!targetTime) return;
      countdownCheckIntervalMs = checkIntervalMs;
      countdownTargetTime = targetTime;
      countdownOnExpire = onExpire;
      countdownIntervalId = setInterval(() => {
        if (Date.now() >= targetTime.getTime()) {
          onExpire();
        }
      }, checkIntervalMs);
    },

    pauseCountdown() {
      if (countdownIntervalId == null) return;
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    },

    resumeCountdown() {
      if (countdownOnExpire == null || countdownTargetTime == null) return;
      if (countdownIntervalId != null) return;

      if (Date.now() >= countdownTargetTime.getTime()) {
        countdownOnExpire();
        this.stopCountdown();
        return;
      }

      countdownIntervalId = setInterval(() => {
        if (Date.now() >= countdownTargetTime!.getTime()) {
          countdownOnExpire!();
        }
      }, countdownCheckIntervalMs);
    },

    stopCountdown() {
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      countdownIntervalId = null;
      countdownTargetTime = null;
      countdownOnExpire = null;
      countdownCheckIntervalMs = 0;
    },
  };
}
