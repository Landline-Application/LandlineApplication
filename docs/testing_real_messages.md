# Testing Auto-Reply with Real Messages

## Emulator SMS Testing

### Send SMS to Emulator
```bash
# Get emulator phone number
adb emu sms send 5554 "Test message from emulator"

# Or use Android Studio Device Manager → Send SMS
```

**Limitations:**
- SMS auto-reply works ONLY if the Messages app creates notifications with reply actions
- Most default SMS apps on Android 15+ support this
- The notification must have RemoteInput for auto-reply to work

## WhatsApp on Emulator

### Install WhatsApp
```bash
# Download WhatsApp APK
wget https://www.whatsapp.com/android/current/WhatsApp.apk

# Install on emulator
adb install WhatsApp.apk
```

### Setup
1. Open WhatsApp
2. Verify with a real phone number (or use test number)
3. Send message from another device
4. Auto-reply should respond

## Physical Device Testing (Recommended)

### Setup
1. Build release APK: `cd android && ./gradlew assembleRelease`
2. Install on device: `adb install app/build/outputs/apk/release/app-release.apk`
3. Grant notification listener permission
4. Enable auto-reply
5. Install messaging apps:
   - WhatsApp
   - Messenger  
   - Telegram
   - Signal
   - Instagram

### Test
1. Send yourself messages from another account/device
2. Verify auto-replies are sent
3. Check in messaging app conversation

## Supported Apps

Auto-reply works with any app that implements Direct Reply (RemoteInput):

✅ **Confirmed Working:**
- WhatsApp
- Facebook Messenger
- Telegram
- Signal
- Discord
- Slack
- Instagram DMs
- Android Messages (SMS)
- Google Messages

❌ **Not Supported:**
- Apps without reply actions
- Notifications marked as "silent"
- System notifications

## Why Test Notifications Don't Show in Messages App

Test notifications are **system notifications**, not real messages. They:
- Simulate the notification structure
- Include reply actions
- Trigger auto-reply service
- But don't create actual conversations

**For real message testing:** Use physical device with real messaging apps.

## Quick Test Workflow

### On Emulator (Test Notifications)
```
1. Enable auto-reply
2. Send test notification
3. Check notification shade
4. See "Reply Sent" confirmation
```

### On Real Device (Real Messages)
```
1. Install WhatsApp
2. Enable auto-reply
3. Send WhatsApp message from another phone
4. Check WhatsApp conversation
5. See auto-reply in chat
```
