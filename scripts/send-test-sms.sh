#!/bin/bash

# Send a fake SMS to the connected Android emulator via ADB.
# Usage: ./scripts/send-test-sms.sh [phone_number] [message]

PHONE="${1:-5554}"
MESSAGE="${2:-Test message from Landline}"

if ! adb devices | grep -q "emulator"; then
  echo "Error: no emulator found. Start one with: pnpm android" >&2
  exit 1
fi

echo "Sending SMS from ${PHONE}: \"${MESSAGE}\""
adb emu sms send "${PHONE}" "${MESSAGE}"
echo "Done. Pull down the notification shade to see the incoming message."
