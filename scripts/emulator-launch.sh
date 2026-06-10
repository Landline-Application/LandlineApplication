#!/usr/bin/env bash

# Launch an Android emulator, using gum for selection if available.
# Uses host GPU rendering; falls back to software if unavailable.

set -e

AVDS=$(emulator -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
  echo "No Android Virtual Devices (AVDs) found."
  echo "Create one with: avdmanager create avd -n <name> -k <package>"
  exit 1
fi

AVD_COUNT=$(echo "$AVDS" | wc -l | tr -d ' ')

if [ "$AVD_COUNT" -eq 1 ]; then
  SELECTED_AVD="$AVDS"
elif command -v gum &>/dev/null; then
  SELECTED_AVD=$(echo "$AVDS" | gum choose --header "Select an Android Emulator to launch:")
else
  echo "Available AVDs:"
  i=1
  while IFS= read -r avd; do
    echo "  $i) $avd"
    i=$((i + 1))
  done <<< "$AVDS"
  echo ""
  printf "Select AVD (1-$AVD_COUNT): "
  read -r choice
  SELECTED_AVD=$(echo "$AVDS" | sed -n "${choice}p")
fi

if [ -z "$SELECTED_AVD" ]; then
  echo "No device selected. Exiting."
  exit 0
fi

echo "Launching: $SELECTED_AVD"

exec emulator -avd "$SELECTED_AVD" -gpu host
