#!/usr/bin/env bash

set -euo pipefail

if ! command -v adb >/dev/null 2>&1; then
  echo "Error: adb command not found in PATH."
  exit 1
fi

OUT_DIR="${1:-tmp}"
mkdir -p "$OUT_DIR"

SERIAL="${2:-}"

mapfile -t CONNECTED_DEVICES < <(adb devices | tail -n +2 | awk '$2 == "device" { print $1 }')

if [[ ${#CONNECTED_DEVICES[@]} -eq 0 ]]; then
  echo "No running Android devices found."
  echo "Start an emulator/device first, then run this script again."
  exit 1
fi

if [[ -z "$SERIAL" ]]; then
  if [[ ${#CONNECTED_DEVICES[@]} -eq 1 ]]; then
    SERIAL="${CONNECTED_DEVICES[0]}"
  else
    echo "Multiple devices found. Pass a serial as the second argument."
    echo "Example: ./scripts/capture-app-store-screenshots.sh app-store-shots emulator-5554"
    echo "Connected devices:"
    printf '  %s\n' "${CONNECTED_DEVICES[@]}"
    exit 1
  fi
fi

if ! printf '%s\n' "${CONNECTED_DEVICES[@]}" | grep -qx "$SERIAL"; then
  echo "Device serial not connected: $SERIAL"
  echo "Connected devices:"
  printf '  %s\n' "${CONNECTED_DEVICES[@]}"
  exit 1
fi

echo "Saving screenshots to: $OUT_DIR"
echo "Using device: $SERIAL"
echo "Enter screenshot name (for example: home, settings, detail)."
echo "Press Enter for auto-name. Type 'done' to exit."
echo

capture_count=1
while true; do
  printf "screenshot name (or 'done'): "
  read -r shot_name

  if [[ "$shot_name" == "done" ]]; then
    break
  fi

  if [[ -z "$shot_name" ]]; then
    shot_name="shot-$capture_count"
  fi

  safe_name="$(printf '%s' "$shot_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9._-')"
  if [[ -z "$safe_name" ]]; then
    safe_name="shot-$capture_count"
  fi

  screenshot_file="$OUT_DIR/${SERIAL}-${safe_name}.png"
  adb -s "$SERIAL" exec-out screencap -p >"$screenshot_file"
  echo "Saved screenshot: $screenshot_file"
  capture_count=$((capture_count + 1))
done

echo
echo "Done. Captured $((capture_count - 1)) screenshots from $SERIAL"
