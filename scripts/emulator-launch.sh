#!/usr/bin/env bash

# Script to launch Android emulator with gum selection
# Uses software rendering (swiftshader_indirect) to avoid GPU issues

set -e

AVDS=$(emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
  echo "No Android Virtual Devices (AVDs) found."
  echo "Create one with: avdmanager create avd -n <name> -k <package>"
  exit 1
fi

SELECTED_AVD=$(echo "$AVDS" | gum choose --header "Select an Android Emulator to launch:")

if [ -z "$SELECTED_AVD" ]; then
  echo "No device selected. Exiting."
  exit 0
fi

echo "Launching: $SELECTED_AVD"

exec emulator -avd "$SELECTED_AVD" -gpu host
