# Viewing Auto-Reply Messages

## Reply History Feature

The auto-reply manager now tracks every reply sent, allowing you to see what messages were sent and when.

## How to View Reply History

### In the App

1. Navigate to **Auto-Reply Test Page**
2. Scroll to **"Reply History"** section
3. Tap **"View Reply History"**

You'll see:
- The message text sent
- Timestamp of when it was sent
- Up to 10 most recent replies (with total count)

### Example Output

```
Reply History (15 total)

1. "I'm in a meeting right now. I'll get back to you soon!"
   10/10/2025, 12:45:30 PM

2. "Auto-reply: I'll get back to you soon."
   10/10/2025, 12:40:15 PM

3. "On vacation until Monday!"
   10/10/2025, 11:30:00 AM

...and more
```

## How It Works

### Storage
- Replies are stored in **SharedPreferences**
- Maximum 50 most recent replies kept
- Persists across app restarts
- Automatically trims old entries

### What's Tracked
✅ Reply message text
✅ Timestamp (milliseconds)
❌ NOT tracked: Recipient name/app (for privacy)

### Data Structure
```json
[
  {
    "message": "Auto-reply: I'll get back to you soon.",
    "timestamp": 1696953600000
  }
]
```

## Testing the Feature

### Setup
1. Enable auto-reply
2. Send test notifications
3. Wait 1-2 seconds for auto-reply to trigger
4. View history

### Full Test Flow

```bash
# Enable auto-reply
tap "Enable Auto-Reply"

# Send test notification
tap "Send Test Message"

# Wait for auto-reply (check logs)
adb logcat | grep "Auto-reply sent"

# View the sent message
tap "View Reply History"
```

## Clearing History

To clear all reply history:

1. Tap **"Clear History"** button
2. Confirms with success message
3. History is permanently deleted

## API Usage

```typescript
import { getReplyHistory, clearReplyHistory } from '@/modules/auto-reply-manager';

// Get reply history
const history = getReplyHistory();
history.forEach(item => {
  console.log(`Sent at ${new Date(item.timestamp)}: ${item.message}`);
});

// Clear history
const result = await clearReplyHistory();
console.log(result.message); // "Reply history cleared"
```

## Debugging

### Check if replies are being saved

```bash
# View SharedPreferences
adb shell run-as com.anonymous.LandlineApplication cat /data/data/com.anonymous.LandlineApplication/shared_prefs/auto_reply_prefs.xml | grep reply_history
```

### View logs

```bash
# Watch for replies being sent
adb logcat | grep "Auto-reply sent"

# Watch for history saves
adb logcat | grep "saveReplyToHistory"
```

## Privacy Considerations

**What we DON'T track:**
- Recipient names
- Recipient phone numbers
- Package names of messaging apps
- Message content received
- Notification details

**What we DO track:**
- Only the auto-reply message YOU configured
- Timestamp of when it was sent

This ensures user privacy while providing useful history.

## Limitations

- Maximum 50 entries (oldest automatically removed)
- No sync across devices
- Local storage only (not backed up)
- Cleared when app data is cleared

## Use Cases

1. **Verify auto-reply is working** - Check if messages are actually being sent
2. **Audit sent messages** - See what was sent and when
3. **Debug issues** - Confirm replies were sent during specific times
4. **Track usage** - See how often auto-reply triggers

## Future Enhancements

Potential features (not yet implemented):
- Filter by date range
- Search history
- Export to file
- Statistics (total replies, average per day)
- Per-app breakdown
