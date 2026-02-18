# Build Guide

This document provides instructions on how to build the project and run the application.

## Prerequisites

- Node.js
- pnpm
- Android Studio (for Android builds)
- Xcode (for iOS builds)

You can follow the official [Expo environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local) for your platform.

## Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:Landline-Application/LandlineApplication.git
   cd LandlineApplication
   ```

2. Install dependencies using pnpm:

   ```bash
   pnpm install
   ```

3. Run the application:

   ```bash
   pnpm start
   ```

4. To run the application on a specific platform, use one of the following commands:

   ```bash
   pnpm android # for Android
   pnpm ios     # for iOS
   pnpm web     # for Web
   ```

## Troubleshooting

### Metro Cache and TreeFS Errors

If you encounter Metro bundler errors such as "TreeFS: Could not add directory..." or "node_modules already exists in the file map as a file", the Metro cache is corrupted. This typically happens after interrupted builds or dependency updates.

#### Quick Fix (Recommended First Step)

Clear the Metro cache and free port 8081:

```bash
# Clear all Metro cache directories
rm -rf node_modules/.cache $TMPDIR/metro-* ~/.metro-cache 2>/dev/null

# Kill any process using port 8081
lsof -i :8081 | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9 2>/dev/null

# Restart the dev server with cache clear flag
pnpm start --clear
```

#### Full Project Reset (If Quick Fix Doesn't Work)

For more serious issues or when switching between `node-linker` configurations:

```bash
# 1. Stop the dev server and kill any remaining processes
lsof -i :8081 | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9 2>/dev/null

# 2. Clear all caches (Metro, pnpm, Gradle, Expo)
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf ~/.metro-cache
rm -rf .expo
rm -rf .gradle
rm -rf node_modules

# 3. Reinstall dependencies
pnpm install

# 4. Restart the dev server
pnpm start --clear
```

### Android Build Issues

If you encounter Gradle errors related to missing dependencies or dependency resolution when building for Android, you may need to regenerate the Android build files:

```bash
rm -r android
expo prebuild --clean
```

This regenerates the Android project with the correct dependency linking.
