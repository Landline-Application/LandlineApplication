# Auto-Reply Testing Limitation on Emulator

## The Issue

**NotificationListenerService cannot receive notifications from its own app** on Android 15 (API 35).

This is by design for security reasons - Android prevents apps from intercepting their own notifications through NotificationListenerService.

## What This Means

❌ **Test notifications from our app** → NotificationListenerService won't see them
✅ **Real notifications from other apps** → NotificationListenerService WILL see them

## Why You Don't See Reply History

1. You tap "Send Test Message"
2. Test notification is created ✅
3. Notification appears in system ✅
4. NotificationListenerService is called ❌ (Android blocks own app)
5. Auto-reply doesn't trigger ❌
6. No reply history ❌

## How to Actually Test Auto-Reply

### Option 1: Use Real Messaging Apps (Recommended)

**On Physical Device:**
1. Install WhatsApp, Messenger, or Telegram
2. Enable auto-reply in our app
3. Send yourself a message from another device
4. Auto-reply will trigger ✅
5. Reply history will show ✅

**Example:**
```bash
# Install on physical device
cd android && ./gradlew installDebug
adb -d install app/build/outputs/apk/debug/app-debug.apk

# Enable auto-reply
# Send WhatsApp message from another phone
# Check reply history
```

### Option 2: Use ADB to Send SMS (Emulator Only)

```bash
# Send SMS to emulator
adb emu sms send 5554 "Test message"

# Check if SMS app created notification with reply action
adb shell dumpsys notification | grep -A20 "messaging"
```

**Note:** Only works if the default SMS app supports reply actions.

### Option 3: Install Third-Party App

Install another app that creates test notifications:

```bash
# Example: Install a demo messaging app
adb install test-messaging-app.apk

# Use that app to create notifications
# Our auto-reply will see them
```

## Verifying Auto-Reply Works

Even though test notifications don't trigger auto-reply, you can verify the system works:

### 1. Check Service is Running
```bash
adb shell dumpsys activity services | grep AutoReplyListenerService
# Should show: "app=ProcessRecord..."
```

### 2. Check Listener is Connected
```bash
adb shell dumpsys notification | grep "Notification listeners" -A5
# Should include: com.anonymous.LandlineApplication/expo.modules.autoreplymanager.AutoReplyListenerService
```

### 3. Check Auto-Reply is Enabled
In app: Tap "Check Status" → Should show "Enabled: true"

### 4. Monitor Logs
```bash
adb logcat | grep "AutoReplyListener"
```

When a REAL notification arrives, you'll see:
```
AutoReplyListener: Notification posted from: com.whatsapp
AutoReplyListener: Processing notification from com.whatsapp
AutoReplyListener: Auto-reply sent to com.whatsapp: Your message here
```

## Production Testing Checklist

✅ **Service registered** - Check with `dumpsys notification`
✅ **Permission granted** - Notification listener access enabled
✅ **Auto-reply enabled** - Check in app
✅ **Real messaging app installed** - WhatsApp, Messenger, etc.
✅ **Send real message** - From another device
✅ **Verify auto-reply sent** - Check in messaging app conversation
✅ **Check reply history** - Should show in app

## Why This Limitation Exists

**Security:** Prevents malicious apps from:
- Intercepting their own permission requests
- Hiding their own notifications
- Manipulating their own notification state

**Privacy:** Apps shouldn't be able to:
- Read their own notifications after posting
- Modify their own notifications via listener
- Create notification loops

## Alternative: Manual Testing Guide

Since automated testing is limited, here's a manual test workflow:

### Setup (One Time)
1. Install app on physical device
2. Install WhatsApp
3. Get second phone or use web.whatsapp.com
4. Grant notification listener permission
5. Enable auto-reply

### Test Flow
1. Set reply message: "Testing auto-reply!"
2. Send WhatsApp message from second device: "Hello?"
3. Wait 1-2 seconds
4. Check WhatsApp conversation → Should see auto-reply
5. Check app "Reply History" → Should show "Testing auto-reply!" with timestamp

### Expected Results
- WhatsApp shows: "Testing auto-reply!" from you
- Reply history shows: 1 reply at [timestamp]
- Logs show: "Auto-reply sent to com.whatsapp..."

## Summary

**Emulator Test Notifications:** ❌ Won't trigger auto-reply (Android limitation)
**Real App Notifications:** ✅ Will trigger auto-reply (production scenario)

**Solution:** Test with real messaging apps on physical device for accurate results.
