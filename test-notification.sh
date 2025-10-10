#!/bin/bash
# Test notification script

echo "Sending test notification via ADB..."

# Open the app first
adb shell am start -n com.anonymous.LandlineApplication/.MainActivity

# Wait a bit
sleep 2

# Send test notification by invoking the method
echo "You should now:"
echo "1. Navigate to Auto-Reply Test Page in the app"
echo "2. Tap 'Send Test Message' button"
echo "3. Pull down notification shade to see the notification"
echo ""
echo "The notification will appear in the Android notification shade (not in Messages app)"
echo "If auto-reply is enabled, you'll see a 'Reply Sent' notification after 1-2 seconds"
