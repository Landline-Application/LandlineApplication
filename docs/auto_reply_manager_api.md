# Auto Reply Manager Native Module

Native Android module for automatic notification reply using NotificationListenerService.

## Requirements

- Android API 35+ (Android 15)
- Permissions:
  - `BIND_NOTIFICATION_LISTENER_SERVICE` - Required for notification access

## Architecture

The module implements a **NotificationListenerService** that:
1. Listens for incoming notifications from allowed apps
2. Detects notifications with reply actions (RemoteInput)
3. Automatically sends configured reply message
4. Runs as a background service when enabled

## Features

### 1. Notification Listener Permission

**`isListenerEnabled(): boolean`**
- Check if notification listener permission is granted

**`requestListenerPermission(): Promise<AutoReplyResult>`**
- Opens system settings to enable notification listener
- Returns `success: true` if already enabled

### 2. Auto-Reply Control

**`isAutoReplyEnabled(): boolean`**
- Check if auto-reply is currently enabled

**`setAutoReplyEnabled(enabled: boolean): Promise<AutoReplyResult>`**
- Enable/disable automatic replies
- Service must be running and listener permission granted

**`isServiceRunning(): boolean`**
- Check if NotificationListenerService is active

### 3. Reply Configuration

**`setReplyMessage(message: string): Promise<AutoReplyResult>`**
- Set custom auto-reply message
- Default: "Auto-reply: I'll get back to you soon."

**`getReplyMessage(): string`**
- Get current auto-reply message

### 4. App Filtering

**`setAllowedApps(packageNames: string[]): Promise<AutoReplyResult>`**
- Set which apps can receive auto-replies
- Empty array = allow all apps

**`getAllowedApps(): string[]`**
- Get list of allowed app package names

### 5. Notification Monitoring

**`getActiveNotifications(): Promise<NotificationInfo[]>`**
- Get all active notifications visible to the service
- Returns: `packageName`, `title`, `text`, `timestamp`, `hasReplyAction`

### 6. Reply History

**`getReplyHistory(): ReplyHistoryItem[]`**
- Get history of sent auto-replies
- Returns up to 50 most recent replies
- Each item contains: `message`, `timestamp`

**`clearReplyHistory(): Promise<AutoReplyResult>`**
- Clear all reply history
- Permanently deletes stored history

## Types

```typescript
type AutoReplyResult = {
  success: boolean;
  message: string;
};

type NotificationInfo = {
  packageName: string;
  title?: string;
  text?: string;
  timestamp: number;
  hasReplyAction: boolean;
};

type ReplyHistoryItem = {
  message: string;
  timestamp: number;
};
```

## Usage Example

```typescript
import * as AutoReplyManager from '@/modules/auto-reply-manager';

// Step 1: Enable notification listener
const hasAccess = AutoReplyManager.isListenerEnabled();
if (!hasAccess) {
  await AutoReplyManager.requestListenerPermission();
}

// Step 2: Configure auto-reply
await AutoReplyManager.setReplyMessage("I'm busy, will reply later!");

// Step 3: Set allowed apps (optional)
await AutoReplyManager.setAllowedApps([
  'com.whatsapp',
  'com.facebook.orca', // Messenger
  'com.instagram.android'
]);

// Step 4: Enable auto-reply
await AutoReplyManager.setAutoReplyEnabled(true);

// Check status
const isRunning = AutoReplyManager.isServiceRunning();
const isEnabled = AutoReplyManager.isAutoReplyEnabled();

// Get active notifications
const notifications = await AutoReplyManager.getActiveNotifications();
```

## How It Works

1. **NotificationListenerService** receives all notifications
2. Service checks if auto-reply is enabled
3. Filters notifications by allowed apps list
4. Detects if notification has reply capability (RemoteInput)
5. Extracts reply action and sends configured message
6. Logs success/failure for debugging

## Limitations

- Only works with apps that support direct reply (RemoteInput)
- Cannot reply to notifications without reply actions
- User must manually enable notification listener in system settings
- Service may be killed by system (will auto-restart on next notification)
- Requires API 35+ (Android 15)
- Reply actions must have `allowFreeFormInput = true`

## Technical Details

### Service Lifecycle
- Service starts when notification listener permission granted
- Runs in background until permission revoked
- Auto-restarts on device reboot (if permission granted)
- Survives app termination

### Reply Mechanism
- Uses `RemoteInput.addResultsToIntent()` to inject reply text
- Sends reply via notification's `PendingIntent`
- Works with messaging apps (WhatsApp, Messenger, Telegram, etc.)

### Storage
- Uses SharedPreferences for configuration
- Stores: enabled state, reply message, allowed apps list
- Persists across app restarts

## Supported Apps

Any app that implements Android's Direct Reply API:
- WhatsApp
- Facebook Messenger
- Telegram
- Signal
- Discord
- Slack
- SMS (default messaging app)
- And more...

## Events

```typescript
// Listen for notifications
AutoReplyManagerModule.addListener('onNotificationReceived', (notification) => {
  console.log('Notification from:', notification.packageName);
});

// Listen for sent replies
AutoReplyManagerModule.addListener('onAutoReplySent', (info) => {
  console.log('Replied to:', info.packageName, 'with:', info.message);
});
```
