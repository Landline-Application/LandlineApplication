import { Platform } from 'react-native';

import { BackgroundNotificationTaskResult } from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import {
  LANDLINE_REMINDER_BG_TASK_NAME,
  handleLandlineReminderTaskPayload,
} from '@/services/landline-mode-reminder';

if (Platform.OS === 'android') {
  TaskManager.defineTask(LANDLINE_REMINDER_BG_TASK_NAME, async ({ data, error }) => {
    if (error) return BackgroundNotificationTaskResult.Failed;
    await handleLandlineReminderTaskPayload(data);
    return BackgroundNotificationTaskResult.NoData;
  });
}
