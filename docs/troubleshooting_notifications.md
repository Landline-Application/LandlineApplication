# Troubleshooting: Test Notifications Not Appearing

## Issue
When tapping "Send Test Message", notifications don't appear in the notification shade.

## Root Causes & Solutions

### 1. POST_NOTIFICATIONS Permission (Android 13+)

**Check if permission is granted:**
```bash
adb shell dumpsys package com.anonymous.LandlineApplication | grep POST_NOTIFICATIONS
```

**Grant permission manually:**
```bash
adb shell pm grant com.anonymous.LandlineApplication android.permission.POST_NOTIFICATIONS
```

**Or grant in UI:**
1. Open app
2. Permission popup should appear automatically
3. Tap "Allow"

### 2. Notification Channels Not Created

The notification channel must be created before posting notifications.

**Check channels:**
```bash
adb shell dumpsys notification | grep -A5 "com.anonymous.LandlineApplication"
```

**Solution:** Channels are created automatically on first notification. If not working, uninstall and reinstall app.

### 3. Do Not Disturb (DND) Blocking Notifications

**Check DND status:**
```bash
adb shell settings get global zen_mode
# 0 = off, 1 = priority only, 2 = total silence, 3 = alarms only
```

**Disable DND:**
```bash
adb shell settings put global zen_mode 0
```

**Or via UI:**
- Pull down notification shade
- Tap DND icon to disable

### 4. App in Background/Killed

**Ensure app is running:**
```bash
adb shell am start -n com.anonymous.LandlineApplication/.MainActivity
```

### 5. Notification Priority Too Low

Check if notifications are being created but not displayed.

**View all notifications:**
```bash
adb shell dumpsys notification --noredact | grep -A20 "test_messages"
```

### 6. Emulator Issues

Some emulators have notification issues.

**Try:**
1. Restart emulator
2. Clear app data: Settings → Apps → Landline Application → Storage → Clear Data
3. Reinstall app

## Testing Checklist

Run these steps in order:

```bash
# 1. Check app is installed
adb shell pm list packages | grep LandlineApplication
# Should output: package:com.anonymous.LandlineApplication

# 2. Grant POST_NOTIFICATIONS permission
adb shell pm grant com.anonymous.LandlineApplication android.permission.POST_NOTIFICATIONS

# 3. Disable DND
adb shell settings put global zen_mode 0

# 4. Start the app
adb shell am start -n com.anonymous.LandlineApplication/.MainActivity

# 5. Monitor logs while testing
adb logcat -s "ReactNativeJS:*" "TestNotification*:*" "NotificationManager:*" | grep -v "^$"
```

## What Should Happen

When you tap "Send Test Message":

1. **Module Called:**
   ```
   ReactNativeJS: Calling sendTestNotification("John Doe", "Hey! Are you available...")
   ```

2. **Notification Created:**
   ```
   NotificationManager: Posting notification...
   TestNotificationHelper: Created test notification ID: 1234567890
   ```

3. **Visible in Shade:**
   - Pull down from top
   - See "John Doe" notification
   - Tap to expand
   - See "Reply" button

## Debug Commands

```bash
# View all recent logs
adb logcat -d | tail -100

# Filter for our app
adb logcat | grep -i "landline\|autoreply\|test"

# View notification service
adb shell dumpsys notification

# Clear all notifications
adb shell cmd notification clear

# Force stop app
adb shell am force-stop com.anonymous.LandlineApplication

# Reinstall app
cd android && ./gradlew installDebug
```

## Common Error Messages

### "Permission denial"
**Fix:** Grant POST_NOTIFICATIONS permission (see Solution #1)

### "Channel does not exist"
**Fix:** Uninstall and reinstall app to recreate channels

### "Failed to post notification"
**Fix:** Check if app has notification permission in Settings → Apps → Landline Application → Notifications

## Manual Testing Without Code

You can test if notifications work at all:

```bash
# Send a simple test notification via ADB
adb shell cmd notification post -S bigtext -t "Test Title" "Tag" "Test Message"
```

If this doesn't show notifications, the emulator/device has notification issues.

## Still Not Working?

1. **Check Android version:** Must be Android 13+ for POST_NOTIFICATIONS
   ```bash
   adb shell getprop ro.build.version.sdk
   # Should be 33 or higher
   ```

2. **Try physical device:** Emulators sometimes have notification issues

3. **Check logs for errors:**
   ```bash
   adb logcat | grep -E "Error|Exception|Failed"
   ```

4. **Verify module loaded:**
   ```bash
   adb logcat | grep "AutoReplyManager"
   # Should see module registration logs
   ```

## Success Indicators

✅ Permission granted:
```bash
adb shell dumpsys package com.anonymous.LandlineApplication | grep POST_NOTIFICATIONS
# Shows: granted=true
```

✅ Notification posted:
```bash
adb logcat | grep "Posting notification"
# Shows: Posting notification to channel...
```

✅ Visible in shade:
- Pull down notification shade
- See test notification

✅ Has reply action:
- Long press notification
- See "Reply" button
