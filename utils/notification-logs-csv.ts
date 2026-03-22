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

