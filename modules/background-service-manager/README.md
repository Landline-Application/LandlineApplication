# Background Service Manager

A native module for managing Android background services and background tasks in a battery-efficient, Google Play Store compliant manner.

## 🎯 Purpose

This module enables your React Native/Expo app to:
- Run a foreground service to handle notifications and background operations
- Schedule battery-efficient periodic background tasks using WorkManager
- Manage battery optimization settings
- Monitor device power states (Doze mode, etc.)

## ✅ Google Play Store Compliance

This implementation follows all Google Play Store policies for background services:

1. **Foreground Service with Notification**: Uses a persistent notification to inform users that the app is running in the background
2. **Battery Optimization**: Respects Android's Doze mode and App Standby
3. **Proper Permissions**: Uses only necessary permissions with clear justifications
4. **WorkManager**: Uses Android's recommended WorkManager API for periodic tasks
5. **Special Use Foreground Service**: Properly declared for notification monitoring

## 📋 Features

### Foreground Service
- Start/stop foreground service with custom notification
- Persistent notification while service is running
- Proper lifecycle management to prevent battery drain
- Service restarts automatically if killed by system (configurable)

### Background Work (WorkManager)
- Schedule periodic background tasks (minimum 15 minutes interval)
- Battery-efficient execution respecting Doze mode
- Guaranteed execution even if app is closed or device restarts
- Automatic retry on failure

### Battery Optimization
- Check if app is ignoring battery optimizations
- Request user to disable battery optimizations (use sparingly!)
- Open battery optimization settings

### System Utilities
- Get Android version information
- Check if device is in Doze mode
- Monitor service and work status

## 📦 Installation

The module is already set up as a local Expo module. No additional installation needed.

## 🚀 Usage

### Import the Module

```typescript
import BackgroundServiceManager from '@/modules/background-service-manager';
```

### Start Foreground Service

```typescript
// Start the foreground service
const success = BackgroundServiceManager.startForegroundService(
  'Background Service Active',
  'Monitoring notifications in the background'
);

if (success) {
  console.log('Foreground service started!');
}

// Check if service is running
const isRunning = BackgroundServiceManager.isForegroundServiceRunning();

// Stop the service
BackgroundServiceManager.stopForegroundService();
```

### Schedule Background Work

```typescript
// Schedule work to run every 15 minutes (minimum allowed)
const success = BackgroundServiceManager.scheduleBackgroundWork(
  15, // interval in minutes
  'notification_check' // task type
);

// Check if work is scheduled
const isScheduled = BackgroundServiceManager.isBackgroundWorkScheduled();

// Cancel scheduled work
BackgroundServiceManager.cancelBackgroundWork();
```

### Battery Optimization

```typescript
// Check if app is ignoring battery optimizations
const isIgnoring = BackgroundServiceManager.isIgnoringBatteryOptimizations();

// Request to ignore battery optimizations (use with caution!)
await BackgroundServiceManager.requestIgnoreBatteryOptimizations();

// Open battery settings (less aggressive approach)
await BackgroundServiceManager.openBatteryOptimizationSettings();
```

### System Utilities

```typescript
// Get Android version
const version = BackgroundServiceManager.getAndroidVersion();
console.log(`Android ${version.release}, SDK ${version.sdkInt}`);

// Check if device is in Doze mode
const isDoze = BackgroundServiceManager.isDeviceIdleMode();
```

## 📱 Android Manifest

The module automatically adds the required permissions and service declarations:

```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>

<!-- Service Declaration -->
<service
  android:name="expo.modules.backgroundservicemanager.NotificationForegroundService"
  android:enabled="true"
  android:exported="false"
  android:foregroundServiceType="specialUse">
  <property
    android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
    android:value="Notification monitoring and handling"/>
</service>
```

## ⚠️ Important Considerations

### Battery Optimization Request
Only request to ignore battery optimizations if it's **absolutely necessary** for your app's core functionality. Google Play may reject apps that abuse this permission. Instead, consider:
1. Using WorkManager for periodic tasks (respects battery optimization)
2. Using foreground service only when necessary
3. Letting users manually disable battery optimization through settings

### Foreground Service Notification
The foreground service **must** display a persistent notification. This is a requirement by Android and cannot be hidden. Make sure the notification clearly explains what the service is doing.

### WorkManager Intervals
WorkManager has a minimum interval of **15 minutes** for periodic work. This is an Android system limitation to preserve battery life.

### Doze Mode
When the device enters Doze mode, background work is heavily restricted. WorkManager will automatically defer tasks until the device exits Doze mode or enters a maintenance window.

## 🧪 Testing

Use the included demo screen (`app/(tabs)/background-service-demo.tsx`) to test all functionality:

1. Run the app: `npm run android` or `pnpm android`
2. Navigate to the "BG Service" tab
3. Test starting/stopping the foreground service
4. Schedule background work
5. Check battery optimization status
6. Send test notifications

## 📖 API Reference

### startForegroundService(title: string, message: string): boolean
Starts the foreground service with a persistent notification.

**Parameters:**
- `title`: Notification title
- `message`: Notification message

**Returns:** `true` if service started successfully

### stopForegroundService(): boolean
Stops the foreground service and removes the notification.

**Returns:** `true` if service stopped successfully

### isForegroundServiceRunning(): boolean
Checks if the foreground service is currently running.

**Returns:** `true` if service is running

### scheduleBackgroundWork(intervalMinutes: number, taskType: string): boolean
Schedules periodic background work using WorkManager.

**Parameters:**
- `intervalMinutes`: How often to run the task (minimum 15)
- `taskType`: Type of task to perform

**Returns:** `true` if work was scheduled successfully

### cancelBackgroundWork(): boolean
Cancels scheduled background work.

**Returns:** `true` if work was cancelled successfully

### isBackgroundWorkScheduled(): boolean
Checks if background work is currently scheduled.

**Returns:** `true` if work is scheduled

### isIgnoringBatteryOptimizations(): boolean
Checks if the app is ignoring battery optimizations.

**Returns:** `true` if app is ignoring battery optimizations

### requestIgnoreBatteryOptimizations(): Promise<boolean>
Requests user to disable battery optimizations for this app.

**Returns:** Promise that resolves to `true` if request was successful

### openBatteryOptimizationSettings(): Promise<boolean>
Opens battery optimization settings for the app.

**Returns:** Promise that resolves to `true` if settings opened successfully

### getAndroidVersion(): AndroidVersionInfo
Gets Android version information.

**Returns:** Object containing `sdkInt`, `release`, and `codename`

### isDeviceIdleMode(): boolean
Checks if device is in Doze mode.

**Returns:** `true` if device is in Doze mode

## 🔧 Customization

### Modifying the Background Worker

To customize what happens during background work, edit:
`modules/background-service-manager/android/src/main/java/expo/modules/backgroundservicemanager/BackgroundWorker.kt`

Look for the `performNotificationCheck()` method and implement your custom logic.

### Changing Notification Icon

The foreground service notification currently uses a default Android icon. To use your app's icon:

1. Add your notification icon to `android/app/src/main/res/drawable/`
2. Update the `setSmallIcon()` call in `NotificationForegroundService.kt`

### Adjusting Service Behavior

Edit `NotificationForegroundService.kt` to:
- Change notification priority
- Modify wake lock behavior
- Adjust service restart policy (START_STICKY vs START_NOT_STICKY)

## 📚 Resources

- [Android Foreground Services Guide](https://developer.android.com/develop/background-work/services/foreground-services)
- [WorkManager Documentation](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Google Play Policy: Background Work](https://developer.android.com/guide/background)
- [Battery Optimization Best Practices](https://developer.android.com/topic/performance/power)

## 🐛 Troubleshooting

### Service Not Starting
- Check that POST_NOTIFICATIONS permission is granted (Android 13+)
- Verify service is declared in AndroidManifest.xml
- Check logcat for error messages

### Background Work Not Running
- WorkManager minimum interval is 15 minutes
- Device may be in Doze mode (work will run during maintenance window)
- Check battery optimization settings

### Battery Drain Issues
- Review wake lock usage (should be minimal or none)
- Ensure WorkManager is used for periodic tasks instead of constant service
- Monitor with Android Battery Profiler

## 📄 License

This module is part of the Landline Application project.

