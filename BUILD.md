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

2. Set up your `google-services.json` by adding its **absolute path** to `.env.local`:

   ```bash
   # .env.local — must be a hardcoded absolute path, not relative
   GOOGLE_SERVICES_JSON=/absolute/path/to/google-services.json
   ```

3. Install dependencies using pnpm:

   ```bash
   pnpm install
   ```

4. Run the application:

   ```bash
   pnpm prebuild
   pnpm android  # we prioritize android
   ```

## Android SDK & Emulator Setup

For a full reference on `sdkmanager`, `avdmanager`, `emulator`, and `adb` see
[docs/android-sdk-emulator.md](docs/android-sdk-emulator.md).

### Quick Setup

1. **Set environment variables** in your shell profile (`~/.bashrc` / `~/.zshrc` / or whatever windows uses):

   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk          # Linux
   # export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS

   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   ```

2. **Install required SDK packages:**

   ```bash
   sdkmanager "platforms;android-35" \
               "build-tools;35.0.0" \
               "platform-tools" \
               "emulator" \
               "system-images;android-35;google_apis_playstore;x86_64"
   sdkmanager --licenses   # accept all licences
   ```

3. **Create a virtual device (AVD):**

   ```bash
   avdmanager create avd \
     --name "Pixel9_API35" \
     --package "system-images;android-35;google_apis_playstore;x86_64" \
     --device "pixel_9"
   ```

4. **Start the emulator:**

   ```bash
   emulator -avd Pixel9_API35
   ```

5. **Run the app** (in a separate terminal):

   ```bash
   pnpm android
   ```

---

## EAS Setup & Production Builds

[EAS (Expo Application Services)](https://expo.dev/eas) is used for production builds.

> **Warning:** EAS free tier allows **15 Android builds per month**. Be conservative — run EAS builds only when necessary and prefer local builds during development.

### 1. Install EAS CLI & Log In

```bash
npm install -g eas-cli
eas login
```

You'll be prompted for your Expo account credentials. To verify you're logged in:

```bash
eas whoami
```

### 2. Configure Credentials

EAS manages the Android keystore used to sign releases. To set up or pull existing credentials:

```bash
eas credentials
```

When prompted, navigate: **Android** → **production** → **Keystore: Manage everything needed to build your project** → **Set up a new keystore**.

The existing keystore for this project (`O55UgHZ17F`) is already configured on EAS. If you are setting up a new machine, selecting the existing default keystore will pull it down automatically. Once set up, quit the prompt — you're ready to build.

Credentials are stored remotely on EAS and do not need to be committed to the repo.

### 3. Production Build (EAS Cloud)

Triggers a build on EAS servers. Useful for CI or when you don't have a local Android environment set up.

```bash
eas build --platform android --profile production
```

The resulting `.aab` file can be downloaded from the [Expo dashboard](https://expo.dev) and submitted to Google Play.

### 4. Production Build (Local)

Runs the build on your machine using your local Android SDK. Requires `ANDROID_HOME` to be set correctly in your environment.

```bash
# If you need a new build, you will need to update the version number as such.
# The CLI will tell you the current version, so all you need to do is increment by one.
# If you need a different environment change -e
eas build:version:set -p android -e production

eas build --platform android --profile production --local
```

The `.aab` output will be written to the project root. This does **not** count against your monthly EAS build quota.

---

## Quick Links

- [docs/EAS-SETUP.md](docs/EAS-SETUP.md) - Links to official Expo/EAS documentation for EAS setup and Google Play Console integration
- [docs/FIREBASE-CONFIG.md](docs/FIREBASE-CONFIG.md) - Firebase configuration and google-services.json setup

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
pnpm prebuild
```

This regenerates the Android project with the correct dependency linking.
