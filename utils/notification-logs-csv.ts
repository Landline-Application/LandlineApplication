/**
 * Build a CSV export from native notification logs (Android).
 * Used for dev/debug export; production flows may add consent.
 */

import { Share } from 'react-native';

import notificationApiManager  from '@/modules/notification-api-manager';

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
export async function shareNotificationLogsCSVAndroid(): Promise<{
  ok: boolean;
  rowCount: number;
  error?: string;
}> {
  let rows: LoggedNotificationRow[];
  try {
    rows = (await notificationApiManager.getLoggedNotifications()) as LoggedNotificationRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, rowCount: 0, error: message };
  }

  if (!rows.length) {
    return { ok: false, rowCount: 0, error: 'No notifications found' };
  }

  const csv = notificationLogsToCSV(rows);
  const filename = `landline-notification-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

  try {
    await Share.share({
      title: filename,
      message: csv,
    });
    return { ok: true, rowCount: rows.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, rowCount: 0, error: message };
  }
}