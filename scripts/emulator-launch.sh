#!/usr/bin/env bash

set -e

AVDS=$(emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
  echo "No AVDs found. Create one with: avdmanager create avd -n <name> -k <package>"
  exit 1
fi

SELECTED_AVD=$(echo "$AVDS" | gum choose --header "Select an Android Emulator:")

if [ -z "$SELECTED_AVD" ]; then
  echo "No device selected. Exiting."
  exit 0
fi

echo "Launching: $SELECTED_AVD"
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json
exec emulator -avd "$SELECTED_AVD" "$@"
