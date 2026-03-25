/**
 * Build a CSV export from native notification logs (Android).
 * Used for dev/debug export; production flows may add consent.
 * Saves the CSV to a user-selected on-device folder (no immediate app sharing).
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

// Helper function to quote fields if needed
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

// Convert parsed notification rows to CSV string
export function notificationLogsToCSV(rows: LoggedNotificationRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map(rowToCSVLine);
  const body = [header, ...lines].join('\r\n');
  return `\ufeff${body}`;
}

// Fetch logs from native storage and export as CSV via system share sheet
export type NotificationLogDateRangePreset = '24h' | '7d' | '30d' | 'all';
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

function getPresetLabel(preset: NotificationLogDateRangePreset): string {
  switch (preset) {
    case '24h':
      return 'last-24-hours';
    case '7d':
      return 'last-7-days';
    case '30d':
      return 'last-30-days';
    case 'all':
      return 'all-time';
    default:
      return 'all-time';
  }
}


export async function saveNotificationLogsCSVAndroid(preset: NotificationLogDateRangePreset = '7d'): Promise<{
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

  const nowMs = Date.now();
  const cutOffTimeMs = getCutoffTimeMs(preset, nowMs);

  const filteredRows =
    cutOffTimeMs == null
      ? rows
      : rows.filter((row) => typeof row.timestamp === 'number' && row.timestamp >= cutOffTimeMs);

  if (!filteredRows.length) {
    return {
      ok: false,
      rowCount: 0,
      error: `No notifications found for preset "${preset}".`,
    };
  }

  const csv = notificationLogsToCSV(filteredRows);
  const filename = `landline-notification-logs-${getPresetLabel(preset)}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.csv`;

  if (directoryPermissionRequestInFlight) {
    return {
      ok: false,
      rowCount: filteredRows.length,
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
        rowCount: filteredRows.length,
        error: 'Storage permission was not granted.',
      };
    }

    // SAF createFileAsync expects the filename without extension.
    const fileNameWithoutExt = filename.replace(/\.csv$/i, '');
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      fileNameWithoutExt,
      'text/csv',
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csv, {
      encoding: 'utf8',
    });

    return { ok: true, rowCount: filteredRows.length, fileUri };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, rowCount: filteredRows.length, error: message };
  } finally {
    directoryPermissionRequestInFlight = false;
  }
}
