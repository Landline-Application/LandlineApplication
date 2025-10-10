# DND Manager Native Module

Native Android module for managing Do Not Disturb (DND) mode and per-app notification permissions.

## Requirements

- Android API 35+ (Android 15)
- Permissions:
  - `ACCESS_NOTIFICATION_POLICY` - DND control
  - `QUERY_ALL_PACKAGES` - App enumeration

## Features

### 1. Permission Management

**`hasPermission(): boolean`**
- Check if DND policy access is granted

**`requestPermission(): Promise<boolean>`**
- Opens system settings to request DND permission
- Returns `true` if already granted, `false` if user needs to grant

### 2. DND State

**`getCurrentState(): DndState`**
- Returns current DND mode and interruption filter state
- Response includes: `success`, `message`, `currentState` (filter constant)

**`getInterruptionFilterConstants(): InterruptionFilterConstants`**
- Returns filter constant values: `ALL`, `PRIORITY`, `NONE`, `ALARMS`, `UNKNOWN`

### 3. DND Control

**`setDNDEnabled(enabled: boolean): Promise<DndState>`**
- Enable/disable DND mode
- `true` = Total Silence mode
- `false` = Normal mode

**`setInterruptionFilter(filter: number): Promise<DndState>`**
- Set specific DND mode:
  - `INTERRUPTION_FILTER_ALL` (1) - Normal, all notifications
  - `INTERRUPTION_FILTER_PRIORITY` (2) - Priority only
  - `INTERRUPTION_FILTER_NONE` (3) - Total silence
  - `INTERRUPTION_FILTER_ALARMS` (4) - Alarms only

### 4. App Notification Management

**`getAllInstalledApps(includeSystemApps: boolean): Promise<AppInfo[]>`**
- Enumerate all installed apps with notification status
- Returns: `packageName`, `appName`, `notificationsEnabled`, `isSystemApp`
- Set `includeSystemApps=false` for user apps only

**`getAppNotificationStatus(packageName: string): Promise<NotificationPermissionResult>`**
- Check if specific app has notification permission
- Returns: `success`, `message`, `notificationsEnabled`

**`openAppNotificationSettings(packageName: string): Promise<boolean>`**
- Opens system notification settings for specific app
- User can manually toggle notification permission
- Returns `true` if settings opened successfully

## Types

```typescript
type DndState = {
  success: boolean;
  message: string;
  currentState?: number;
  ruleId?: string;
};

type AppInfo = {
  packageName: string;
  appName: string;
  notificationsEnabled: boolean;
  isSystemApp: boolean;
};

type NotificationPermissionResult = {
  success: boolean;
  message: string;
  notificationsEnabled?: boolean;
};

enum InterruptionFilter {
  ALL = 1,
  PRIORITY = 2,
  NONE = 3,
  ALARMS = 4,
  UNKNOWN = 0,
}
```

## Usage Example

```typescript
import * as DndManager from '@/modules/dnd-manager';

// Check permission
const hasPerms = DndManager.hasPermission();
if (!hasPerms) {
  await DndManager.requestPermission();
}

// Set DND mode
const constants = DndManager.getInterruptionFilterConstants();
await DndManager.setInterruptionFilter(constants.PRIORITY);

// Get all user apps
const apps = await DndManager.getAllInstalledApps(false);

// Check specific app
const status = await DndManager.getAppNotificationStatus('com.example.app');

// Open app settings
await DndManager.openAppNotificationSettings('com.example.app');
```

## Limitations

- Android cannot programmatically toggle notification permissions for other apps
- Apps can only open system settings UI where user manually grants/revokes permissions
- `QUERY_ALL_PACKAGES` permission requires Play Store justification
- DND policy access must be explicitly granted by user in system settings
- Reflection is used for `areNotificationsEnabledForPackage` (hidden API)

## Test Page

Navigate to `/dnd-test` route to access comprehensive API testing interface.
