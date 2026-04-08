#!/bin/bash

# Build script for Android production release
# Usage: ./scripts/build-android-production.sh

set -e

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
