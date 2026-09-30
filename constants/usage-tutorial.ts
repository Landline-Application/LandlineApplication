import { Platform } from 'react-native';

/** Tab route names from `app/(tabs)`. */
export type TutorialTab = 'index' | 'notifications' | 'settings';

export interface UsageTutorialStep {
  id: string;
  /** Which tab must be showing for this step. */
  screen: TutorialTab;
  /** `TourAnchor` id on the control this step points at. */
  target: string;
  /** Omit on iOS and web. */
  androidOnly?: boolean;
  title: string;
  body: string;
}

const STEPS: UsageTutorialStep[] = [
  {
    id: 'landline-tab',
    screen: 'index',
    target: 'tab-landline',
    title: 'The Landline tab',
    body: 'This is home. You start and stop a quiet session here. Log is where those alerts are saved, and Settings is where you decide what can still reach you.',
  },
  {
    id: 'dial',
    screen: 'index',
    target: 'landline-dial',
    title: 'Tap the dial',
    body: 'This turns Landline Mode on. Choose Indefinite to stay quiet until you tap again, or Focus Timer for 15 minutes, 30 minutes, 1 hour, or 2 hours. Tap the dial during a session to end it. Time and a notification count appear underneath.',
  },
  {
    id: 'how-it-works',
    screen: 'index',
    target: 'landline-how',
    title: 'What a session does',
    body: 'Notifications are captured instead of buzzing, and the phone stays silent. Emergency contacts can still get through. You read everything later, on your schedule.',
  },
  {
    id: 'log-tab',
    screen: 'notifications',
    target: 'tab-log',
    title: 'The Log tab',
    body: 'Open this during a session or after it ends. Everything Landline captured is waiting here.',
  },
  {
    id: 'log-header',
    screen: 'notifications',
    target: 'log-header',
    title: 'Saved alerts',
    body: 'The log groups what came in by app. While a session is still capturing, a Live marker shows next to the title.',
  },
  {
    id: 'log-clear',
    screen: 'notifications',
    target: 'log-clear',
    title: 'Clear the log',
    body: 'This deletes every saved notification, and it cannot be undone. To remove a single one, swipe that row.',
  },
  {
    id: 'log-feed',
    screen: 'notifications',
    target: 'log-feed',
    title: 'Reading the log',
    body: 'Each app gets its own group. Pull down to refresh. When more than one app has written in, chips along the top filter the list down to one app.',
  },
  {
    id: 'settings-tab',
    screen: 'settings',
    target: 'tab-settings',
    title: 'The Settings tab',
    body: 'This is where you shape Landline. None of it is required before your first session.',
  },
  {
    id: 'account',
    screen: 'settings',
    target: 'settings-account',
    title: 'Your account',
    body: 'Sign in to keep your name and preferences with you. Landline still works if you skip an account.',
  },
  {
    id: 'achievements',
    screen: 'settings',
    target: 'settings-achievements',
    title: 'Achievements',
    body: 'Badges you unlock by using Landline. Open this to see what you have earned and what is still locked.',
  },
  {
    id: 'general',
    screen: 'settings',
    target: 'settings-general',
    title: 'General settings',
    body: 'Set how long the log keeps notifications, and how often Landline asks whether you still want a session running.',
  },
  {
    id: 'auto-reply',
    screen: 'settings',
    target: 'settings-auto-reply',
    title: 'Auto-reply',
    body: 'While Landline Mode is on, Landline can answer a message for you. You write the reply and choose which apps it responds to.',
  },
  {
    id: 'emergency',
    screen: 'settings',
    target: 'settings-emergency',
    title: 'Emergency contacts',
    body: 'Calls from these numbers can ring through while Landline Mode is on. Everyone else stays quiet.',
  },
  {
    id: 'repeat-call',
    screen: 'settings',
    target: 'settings-repeat-call',
    androidOnly: true,
    title: 'Repeat-call bypass',
    body: 'The first call from a number can stay quiet. A second call within a short window rings through, so someone who really needs you can still get in.',
  },
  {
    id: 'design',
    screen: 'settings',
    target: 'settings-design',
    title: 'Design',
    body: 'Switch the app between light and dark.',
  },
  {
    id: 'feedback',
    screen: 'settings',
    target: 'settings-feedback',
    title: 'Feedback',
    body: 'Send a bug, a request, or a note. Sign in first so a reply can reach you.',
  },
  {
    id: 'permissions',
    screen: 'settings',
    target: 'settings-permissions',
    title: 'Permissions',
    body: 'Landline needs notification access to capture alerts. This screen shows what is already allowed and what is still missing.',
  },
  {
    id: 'app-attention',
    screen: 'settings',
    target: 'settings-app-attention',
    androidOnly: true,
    title: 'App attention',
    body: 'See which apps you spend time in, and which ones send the most notifications.',
  },
  {
    id: 'data',
    screen: 'settings',
    target: 'settings-data',
    title: 'Your data',
    body: 'See how much is stored on this phone, export the log, or delete all of it. Deleting is permanent.',
  },
];

export function getUsageTutorialSteps(): UsageTutorialStep[] {
  return STEPS.filter((step) => !step.androidOnly || Platform.OS === 'android');
}
