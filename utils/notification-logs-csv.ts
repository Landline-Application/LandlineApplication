/**
 * Build a CSV export from native notification logs (Android).
 * Saves the CSV to a user-selected on-device folder (Storage Access Framework).
 */
import * as FileSystem from 'expo-file-system/legacy';

import NotificationApiManager from '@/modules/notification-api-manager';

// Shape returned by NotificationApiManager.getLoggedNotifications()
export type LoggedNotificationRow = {
  timestamp?: number | null;
  packageName?: string;
  appName?: string;
  title?: string;
  text?: string;
  postTime?: number | null;
  id?: number | null;
};

const CSV_COLUMNS = [
  'loggedAt',
  'packageName',
  'appName',
  'title',
  'text',
  'postTime',
  'notificationId',
] as const;

export type NotificationLogDateRangePreset = '24h' | '7d' | '30d' | 'all';
export type NotificationLogSortOrder = 'newest' | 'oldest';

/** full: real title & text. metadataOnly: those columns replaced (message content not exported). */
export type NotificationLogPrivacyMode = 'full' | 'metadataOnly';

export type NotificationLogExportOptions = {
  datePreset: NotificationLogDateRangePreset;
  sortOrder: NotificationLogSortOrder;
  privacyMode: NotificationLogPrivacyMode;
  /** Case-insensitive substring match on app name (optional) */
  appNameContains?: string;
};

let directoryPermissionRequestInFlight = false;

function getCutoffTimeMs(preset: NotificationLogDateRangePreset, nowMs: number): number | null {
  if (preset === 'all') return null;

  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  switch (preset) {
    case '24h':
      return nowMs - 24 * hourMs;
    case '7d':
      return nowMs - 7 * dayMs;
    case '30d':
      return nowMs - 30 * dayMs;
    default:
      return null;
  }
}

function getPresetSlug(preset: NotificationLogDateRangePreset): string {
  switch (preset) {
    case '24h':
      return 'last-24-hours';
    case '7d':
      return 'last-7-days';
    case '30d':
      return 'last-30-days';
    case 'all':
    default:
      return 'all-time';
  }
}

function getSortSlug(order: NotificationLogSortOrder): string {
  return order === 'newest' ? 'newest-first' : 'oldest-first';
}

function getPrivacySlug(mode: NotificationLogPrivacyMode): string {
  return mode === 'full' ? 'full-detail' : 'metadata-only';
}

const REDACTED_PLACEHOLDER = '[redacted]';

/** Apply privacy mode for CSV cells (row count and filter order unchanged). */
export function applyPrivacyModeToExportRows(
  rows: LoggedNotificationRow[],
  mode: NotificationLogPrivacyMode,
): LoggedNotificationRow[] {
  if (mode === 'full') {
    return rows.map((r) => ({ ...r }));
  }
  return rows.map((r) => ({
    ...r,
    title: REDACTED_PLACEHOLDER,
    text: REDACTED_PLACEHOLDER,
  }));
}

export type NotificationLogFilterOptions = Pick<
  NotificationLogExportOptions,
  'datePreset' | 'appNameContains'
>;

export function filterNotificationLogsForExport(
  rows: LoggedNotificationRow[],
  options: NotificationLogFilterOptions,
  nowMs: number = Date.now(),
): LoggedNotificationRow[] {
  const cutoff = getCutoffTimeMs(options.datePreset, nowMs);
  let out =
    cutoff == null
      ? [...rows]
      : rows.filter((row) => typeof row.timestamp === 'number' && row.timestamp >= cutoff);

  const q = options.appNameContains?.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => (r.appName ?? '').toLowerCase().includes(q));
  }

  return out;
}


export function sortNotificationLogsByLoggedAt(
  rows: LoggedNotificationRow[],
  order: NotificationLogSortOrder,
): LoggedNotificationRow[] {
  return [...rows].sort((a, b) => {
    const ta = typeof a.timestamp === 'number' ? a.timestamp : 0;
    const tb = typeof b.timestamp === 'number' ? b.timestamp : 0;
    return order === 'newest' ? tb - ta : ta - tb;
  });
}

export type NotificationLogPrepareExportOptions = Pick<
  NotificationLogExportOptions,
  'datePreset' | 'sortOrder' | 'appNameContains'
>;

export function prepareNotificationLogsForExport(
  rows: LoggedNotificationRow[],
  options: NotificationLogPrepareExportOptions,
  nowMs: number = Date.now(),
): LoggedNotificationRow[] {
  const filtered = filterNotificationLogsForExport(
    rows,
    { datePreset: options.datePreset, appNameContains: options.appNameContains },
    nowMs,
  );
  return sortNotificationLogsByLoggedAt(filtered, options.sortOrder);
}

export function escapeCSVField(value: string): string {
  const needsQuotes =
    value.includes(',') || value.includes('"') || value.includes('\r') || value.includes('\n');
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function rowToCSVLine(row: LoggedNotificationRow): string {
  const cells = [
    row.timestamp != null ? String(row.timestamp) : '',
    row.packageName ?? '',
    row.appName ?? '',
    row.title ?? '',
    row.text ?? '',
    row.postTime != null ? String(row.postTime) : '',
    row.id != null ? String(row.id) : '',
  ];
  return cells.map((c) => escapeCSVField(c)).join(',');
}

export function notificationLogsToCSV(rows: LoggedNotificationRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map(rowToCSVLine);
  const body = [header, ...lines].join('\r\n');
  return `\ufeff${body}`;
}

export async function saveNotificationLogsCSVAndroid(
  options: NotificationLogExportOptions,
): Promise<{
  ok: boolean;
  rowCount: number;
  fileUri?: string;
  error?: string;
}> {
  let rows: LoggedNotificationRow[];
  try {
    rows = (await NotificationApiManager.getLoggedNotifications()) as LoggedNotificationRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, rowCount: 0, error: message };
  }

  if (!rows.length) {
    return { ok: false, rowCount: 0, error: 'No notifications found' };
  }

  const prepared = prepareNotificationLogsForExport(rows, options);

  if (!prepared.length) {
    return {
      ok: false,
      rowCount: 0,
      error: `No notifications match the selected filters.`,
    };
  }

  const forCsv = applyPrivacyModeToExportRows(prepared, options.privacyMode);
  const csv = notificationLogsToCSV(forCsv);
  const filename = `landline-notification-logs-${getPresetSlug(options.datePreset)}-${getSortSlug(options.sortOrder)}-${getPrivacySlug(options.privacyMode)}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.csv`;

  if (directoryPermissionRequestInFlight) {
    return {
      ok: false,
      rowCount: prepared.length,
      error: 'Export already in progress. Please finish the current folder selection first.',
    };
  }

  try {
    directoryPermissionRequestInFlight = true;
    const initialDirectory = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permission =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialDirectory);
    if (!permission.granted) {
      return {
        ok: false,
        rowCount: prepared.length,
        error: 'Storage permission was not granted.',
      };
    }

    const fileNameWithoutExt = filename.replace(/\.csv$/i, '');
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      fileNameWithoutExt,
      'text/csv',
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csv, {
      encoding: 'utf8',
    });

    return { ok: true, rowCount: prepared.length, fileUri };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, rowCount: prepared.length, error: message };
  } finally {
    directoryPermissionRequestInFlight = false;
  }
}
