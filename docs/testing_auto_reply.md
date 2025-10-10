# Testing Auto-Reply Manager on Emulator

## Testing Setup Complete ✓

The app now includes a test notification generator that simulates real messaging app notifications with reply actions.

## Testing Steps

### 1. Grant Notification Listener Permission

**On Device/Emulator:**
1. Open the app
2. Navigate to "Auto-Reply Test Page"
3. Tap "Request Listener Permission"
4. In Settings → Notification Access:
   - Find "Landline Application"
   - Toggle ON
5. Return to app
6. Tap "Check Listener Permission" to verify (should show `true`)

### 2. Configure Auto-Reply

**Set Reply Message:**
1. Tap "Update Message" (sets: "I'm in a meeting right now. I'll get back to you soon!")
2. Tap "Show Current Message" to verify

**Set Allowed Apps (Optional):**
- Tap "Allow All Apps" to reply to all test notifications
- Or tap "Set Messaging Apps" to filter specific apps

### 3. Enable Auto-Reply

1. Tap "Enable Auto-Reply"
2. Tap "Check Status" to verify both:
   - `Enabled: true`
   - `Service Running: true`

### 4. Send Test Notifications

**Single Test:**
1. Tap "Send Test Message"
2. Pull down notification shade
3. You should see notification from "John Doe"
4. Click the notification to see reply action

**Multiple Tests:**
1. Tap "Send Multiple Test Messages"
2. Creates 3 test notifications (Alice, Bob, Charlie)
3. Watch auto-reply respond to each

### 5. Verify Auto-Reply

**Check if it worked:**
1. After sending test notification, wait 1-2 seconds
2. Pull down notification shade
3. Look for "Reply Sent" notification showing your auto-reply
4. Or tap "Show Active Notifications" to see all notifications

**Check Service Logs:**
```bash
# View auto-reply service logs
adb logcat | grep AutoReplyListener
```

You should see:
```
AutoReplyListener: Processing notification from expo.modules.autoreplymanager.testnotificationhelper
AutoReplyListener: Auto-reply sent: I'm in a meeting...
```

## Test Notification Details

The test notifications simulate real messaging apps:
- **Sender:** Configurable name (e.g., "John Doe")
- **Message:** Configurable text
- **Reply Action:** Full RemoteInput with free-form text
- **Package:** `expo.modules.autoreplymanager.testnotificationhelper`
- **Behavior:** Identical to WhatsApp/Messenger notifications

## Troubleshooting

### Auto-Reply Not Working?

**Check Permission:**
```javascript
const hasPermission = isListenerEnabled();
console.log('Permission:', hasPermission); // Must be true
```

**Check Service:**
```javascript
const isRunning = isServiceRunning();
console.log('Service:', isRunning); // Must be true
```

**Check Enabled:**
```javascript
const enabled = isAutoReplyEnabled();
console.log('Enabled:', enabled); // Must be true
```

**Check Allowed Apps:**
```javascript
const apps = getAllowedApps();
console.log('Allowed:', apps); // Empty = all allowed
```

### Notifications Not Appearing?

1. Check notification permission:
   - Settings → Apps → Landline Application → Permissions → Notifications (ON)
2. Check Do Not Disturb is OFF
3. Check notification channels:
   - Settings → Apps → Landline Application → Notifications → All categories enabled

### Service Not Running?

1. Force stop the app
2. Re-grant notification listener permission
3. Restart the app
4. Check "Check Status" again

## Testing on Real Device

For production testing with real apps:

1. Install messaging apps (WhatsApp, Messenger, Telegram)
2. Configure allowed apps:
   ```javascript
   await setAllowedApps(['com.whatsapp', 'com.facebook.orca']);
   ```
3. Send yourself messages from another device
4. Verify auto-replies are sent

## Test Scenarios

### Scenario 1: Basic Auto-Reply
1. Enable auto-reply ✓
2. Send test notification ✓
3. Verify reply sent ✓

### Scenario 2: App Filtering
1. Set "WhatsApp Only" filter ✓
2. Send test notification (will NOT reply - different package) ✗
3. Clear filter with "Allow All Apps" ✓
4. Send test notification (will reply now) ✓

### Scenario 3: Enable/Disable
1. Enable auto-reply ✓
2. Send test → replies ✓
3. Disable auto-reply ✗
4. Send test → no reply ✗
5. Enable again ✓
6. Send test → replies ✓

### Scenario 4: Custom Message
1. Set custom message: "On vacation until Monday!"
2. Send test notification
3. Verify custom message in reply

## Expected Behavior

**When Auto-Reply is ENABLED:**
- ✅ Receives all notifications via NotificationListenerService
- ✅ Filters by allowed apps list (if set)
- ✅ Detects notifications with reply actions
- ✅ Automatically sends configured reply message
- ✅ Logs activity to Logcat

**When Auto-Reply is DISABLED:**
- ✅ Service still receives notifications (listener stays active)
- ✅ Does NOT send any replies
- ✅ Notifications remain unread

## Debugging Commands

```bash
# View all logs from auto-reply module
adb logcat | grep -E "AutoReply|TestNotification"

# Check if service is registered
adb shell dumpsys notification_listener

# View active notifications
adb shell dumpsys notification

# Clear all notifications
adb shell cmd notification clear

# Force stop app
adb shell am force-stop com.anonymous.landlineapplication
```

## Success Criteria

✅ Notification listener permission granted
✅ Service shows as running
✅ Test notifications appear in notification shade
✅ Auto-reply sends configured message
✅ "Reply Sent" confirmation notification appears
✅ Can enable/disable auto-reply dynamically
✅ App filtering works correctly
✅ Custom messages work correctly

## Next Steps

Once testing is complete on emulator:
1. Test on physical device with real messaging apps
2. Test battery impact (service runs continuously)
3. Test behavior when app is closed
4. Test behavior after device reboot
5. Test with different messaging apps (WhatsApp, Messenger, Telegram, Signal)
