import { Platform } from 'react-native';

/**
 * Registers the background task for Landline reminder notification actions.
 * Wrapped in try/catch so an outdated dev client (missing native TaskManager / notifications)
 * does not prevent the JS bundle from loading.
 */
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TaskManager = require('expo-task-manager');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BackgroundNotificationTaskResult } = require('expo-notifications');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      LANDLINE_REMINDER_BG_TASK_NAME,
      handleLandlineReminderTaskPayload,
    } = require('@/services/landline-mode-reminder');

    TaskManager.defineTask(
      LANDLINE_REMINDER_BG_TASK_NAME,
      async ({ data, error }: { data: unknown; error: Error | null }) => {
        if (error) return BackgroundNotificationTaskResult.Failed;
        await handleLandlineReminderTaskPayload(data);
        return BackgroundNotificationTaskResult.NoData;
      },
    );
  } catch (e) {
    console.warn(
      '[Landline] Could not register landline reminder background task. Rebuild: pnpm android',
      e,
    );
  }
}
