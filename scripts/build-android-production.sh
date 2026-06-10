#!/bin/bash

# Build script for Android production release
#
# This requires a EAS expo account to work properly.
#
# If you dont want to create an account you must build
# it manually with gradle
#
# Usage: ./scripts/build-android-production.sh

set -e

# ── Preflight checks ──────────────────────────────────────
PREFLIGHT_FAILED=0

preflight_fail() {
    echo "  ✗ $1"
    PREFLIGHT_FAILED=1
}

echo ""
echo "Running preflight checks..."

# EAS CLI
if ! command -v eas &>/dev/null; then
    preflight_fail "eas-cli not found — run: npm install -g eas-cli"
fi

# EAS login
if [ -z "$(eas whoami 2>/dev/null || true)" ]; then
    preflight_fail "Not logged in to EAS — run: eas login"
fi

# .env.local
if [ ! -f "$(pwd)/.env.local" ]; then
    preflight_fail ".env.local not found — copy .env.example and fill in values"
else
    set -a
    # shellcheck disable=SC1091
    source "$(pwd)/.env.local"
    set +a

    if [ -z "$GOOGLE_SERVICES_JSON" ] || [ "$GOOGLE_SERVICES_JSON" = "/path/to/google-services.json" ]; then
        preflight_fail "GOOGLE_SERVICES_JSON not set in .env.local"
    elif [ ! -f "$GOOGLE_SERVICES_JSON" ]; then
        preflight_fail "GOOGLE_SERVICES_JSON path does not exist: $GOOGLE_SERVICES_JSON"
    fi
fi

# ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    preflight_fail "ANDROID_HOME is not set — see BUILD.md for Android SDK setup"
fi

if [ "$PREFLIGHT_FAILED" -ne 0 ]; then
    echo ""
    echo "Preflight failed. Run ./scripts/setup.sh for guided setup."
    exit 1
fi

echo "  ✓ All checks passed"
echo ""
# ─────────────────────────────────────────────────────────

echo "Starting Android production build..."

echo ""
echo "Checking current EAS build version..."
eas build:version:get -p android -e production

echo ""
echo "NOTE: Increment the EAS build version for each build published to Google Play Console"
echo "      Use: eas build:version:set -p android -e production --version <number>"
echo ""

echo "Setting EAS build version..."
eas build:version:set -p android -e production

echo "Building Android production AAB..."
# Use environment variable if set, otherwise use relative path from project root
GOOGLE_SERVICES_JSON=${GOOGLE_SERVICES_JSON:-"$(pwd)/google-services.json"} \
    eas build --platform android --profile production --local

# Find the generated build artifact
BUILD_FILE=$(ls -t build-*.aab 2>/dev/null | head -1)

if [ -z "$BUILD_FILE" ]; then
    echo ""
    echo "Warning: Could not find build artifact"
    echo "Look for build-*.aab in the current directory"
    exit 1
fi

echo ""
echo "Build complete: $BUILD_FILE"
echo ""

# Prompt for submission
read -p "Submit to Google Play Console? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Submitting $BUILD_FILE to Google Play Console..."
    eas submit --platform android --path "$BUILD_FILE"
else
    echo ""
    echo "To submit manually, run:"
    echo "  eas submit --platform android --path $BUILD_FILE"
fi
