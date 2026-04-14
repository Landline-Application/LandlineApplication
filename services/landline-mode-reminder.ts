import { Platform } from 'react-native';

import type { EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';

import * as DndManager from '@/modules/dnd-manager';
import NotificationApiManager from '@/modules/notification-api-manager';
import {
  getReminderIntervalHoursAsync,
  isValidReminderIntervalHours,
} from '@/utils/landline-reminder-interval';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANDLINE_REMINDER_BG_TASK_NAME = 'LANDLINE_REMINDER_BACKGROUND';

export const LANDLINE_REMINDER_NOTIFICATION_ID = 'landline-mode-session-reminder';

const LANDLINE_REMINDER_CATEGORY_ID = 'landline_mode_reminder';
const LANDLINE_REMINDER_CHANNEL_ID = 'landline_mode_reminder';

export const ACTION_LANDLINE_KEEP_ON = 'landline_reminder_keep_on';
export const ACTION_LANDLINE_TURN_OFF = 'landline_reminder_turn_off';

export const LANDLINE_REMINDER_DATA_TYPE = 'landline_reminder';

const SESSION_KEYS = [
  'landline_session_start_time',
  'landline_session_mode',
  'landline_session_end_time',
] as const;

let responseSubscription: EventSubscription | null = null;
let subsystemInitialized = false;

function isLandlineReminderData(data: Record<string, unknown> | undefined): boolean {
  return data?.type === LANDLINE_REMINDER_DATA_TYPE;
}

async function ensurePostNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const { status: next } = await Notifications.requestPermissionsAsync();
    return next === 'granted';
  } catch {
    return false;
  }
}

export async function cancelLandlineModeReminderScheduled(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(LANDLINE_REMINDER_NOTIFICATION_ID);
  } catch {
    /* id may not exist */
  }
}

function clampFutureTriggerDate(at: Date): Date {
  const min = Date.now() + 60_000;
  if (at.getTime() < min) {
    return new Date(min);
  }
  return at;
}

/**
 * Schedules exactly one local reminder; cancels any previous schedule with the same id first.
 */
export async function scheduleLandlineReminderAt(triggerAt: Date): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const ok = await ensurePostNotificationPermission();
    if (!ok) return;

    const when = clampFutureTriggerDate(triggerAt);

    await cancelLandlineModeReminderScheduled();

    await Notifications.scheduleNotificationAsync({
      identifier: LANDLINE_REMINDER_NOTIFICATION_ID,
      content: {
        title: 'Still in Landline Mode?',
        body: 'You may be missing notifications from non-emergency contacts.',
        data: { type: LANDLINE_REMINDER_DATA_TYPE },
        categoryIdentifier: LANDLINE_REMINDER_CATEGORY_ID,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: LANDLINE_REMINDER_CHANNEL_ID,
      },
    });
  } catch (e) {
    console.warn('scheduleLandlineReminderAt failed (non-fatal)', e);
  }
}

/** First reminder after `sessionStartMs + interval`. */
export async function scheduleLandlineReminderFromSessionStart(
  sessionStartMs: number,
): Promise<void> {
  const hours = await getReminderIntervalHoursAsync();
  const at = new Date(sessionStartMs + hours * 60 * 60 * 1000);
  await scheduleLandlineReminderAt(at);
}

async function snoozeLandlineReminder(): Promise<void> {
  const hours = await getReminderIntervalHoursAsync();
  const at = new Date(Date.now() + hours * 60 * 60 * 1000);
  await scheduleLandlineReminderAt(at);
}

/**
 * Turns off Landline Mode from a notification action (no Zustand; safe in headless JS).
 */
export async function turnOffLandlineModeFromReminder(): Promise<void> {
  try {
    NotificationApiManager.setLandlineMode(false);
    try {
      if (DndManager.hasPermission()) {
        await DndManager.setDNDEnabled(false);
      }
    } catch {
      /* optional */
    }
    await cancelLandlineModeReminderScheduled();
    await AsyncStorage.multiRemove([...SESSION_KEYS]);
  } catch (e) {
    console.warn('turnOffLandlineModeFromReminder failed', e);
  }
}

async function applyLandlineReminderAction(actionIdentifier: string): Promise<void> {
  if (actionIdentifier === ACTION_LANDLINE_TURN_OFF) {
    await turnOffLandlineModeFromReminder();
    return;
  }
  if (
    actionIdentifier === ACTION_LANDLINE_KEEP_ON ||
    actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
  ) {
    if (!NotificationApiManager.isLandlineModeActive()) {
      await cancelLandlineModeReminderScheduled();
      return;
    }
    await snoozeLandlineReminder();
  }
}

export function handleLandlineReminderResponse(response: NotificationResponse): void {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  if (!isLandlineReminderData(data)) return;
  void applyLandlineReminderAction(response.actionIdentifier);
}

export async function handleLandlineReminderTaskPayload(data: unknown): Promise<void> {
  if (!data || typeof data !== 'object') return;
  const d = data as Record<string, unknown>;
  if (!('actionIdentifier' in d)) return;

  const actionIdentifier = d.actionIdentifier as string;
  const notification = d.notification as NotificationResponse['notification'] | undefined;
  const payloadData = notification?.request?.content?.data as Record<string, unknown> | undefined;
  if (!isLandlineReminderData(payloadData)) return;

  await applyLandlineReminderAction(actionIdentifier);
}

export async function ensureLandlineReminderScheduledIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (!NotificationApiManager.isLandlineModeActive()) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.some((r) => r.identifier === LANDLINE_REMINDER_NOTIFICATION_ID);
    if (ours) return;

    const sessionStartRaw = await AsyncStorage.getItem('landline_session_start_time');
    const startMs = sessionStartRaw ? parseInt(sessionStartRaw, 10) : Date.now();
    const hours = await getReminderIntervalHoursAsync();
    const at = new Date(startMs + hours * 60 * 60 * 1000);
    await scheduleLandlineReminderAt(at);
  } catch (e) {
    console.warn('ensureLandlineReminderScheduledIfNeeded failed', e);
  }
}

/** When the user changes the interval while Landline Mode is on, count the next reminder from now. */
export async function rescheduleLandlineReminderAfterIntervalChange(
  intervalHoursOverride?: number,
): Promise<void> {
  if (Platform.OS !== 'android' || !NotificationApiManager.isLandlineModeActive()) return;
  const hours =
    intervalHoursOverride != null && isValidReminderIntervalHours(intervalHoursOverride)
      ? intervalHoursOverride
      : await getReminderIntervalHoursAsync();
  await scheduleLandlineReminderAt(new Date(Date.now() + hours * 60 * 60 * 1000));
}

async function configureCategoryAndChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(LANDLINE_REMINDER_CHANNEL_ID, {
    name: 'Landline Mode reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
  });

  await Notifications.setNotificationCategoryAsync(LANDLINE_REMINDER_CATEGORY_ID, [
    {
      identifier: ACTION_LANDLINE_KEEP_ON,
      buttonTitle: 'Keep on',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_LANDLINE_TURN_OFF,
      buttonTitle: 'Turn off',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function initLandlineReminderSubsystem(): Promise<void> {
  if (Platform.OS !== 'android' || subsystemInitialized) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        if (isLandlineReminderData(data)) {
          return {
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          };
        }
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });

    await configureCategoryAndChannel();

    try {
      await Notifications.registerTaskAsync(LANDLINE_REMINDER_BG_TASK_NAME);
    } catch (e) {
      console.warn(
        'Landline reminder: registerTaskAsync failed (actions may not work when app is killed)',
        e,
      );
    }

    responseSubscription?.remove();
    responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleLandlineReminderResponse,
    );

    subsystemInitialized = true;
  } catch (e) {
    console.warn('initLandlineReminderSubsystem failed (non-fatal)', e);
  }
}

export function teardownLandlineReminderListenersForTests(): void {
  responseSubscription?.remove();
  responseSubscription = null;
  subsystemInitialized = false;
}
