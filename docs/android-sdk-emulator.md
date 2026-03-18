# Android SDK & Emulator Reference

This document covers day-to-day usage of the Android SDK command-line tools:
`sdkmanager`, `avdmanager`, `emulator`, and `adb`.

---

## Prerequisites

### Environment Variables

Add the following to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export ANDROID_HOME=$HOME/Android/Sdk          # Linux default
# export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS default

export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

Reload your shell after editing:

```bash
source ~/.bashrc   # or ~/.zshrc
```

Verify the tools are on your PATH:

```bash
sdkmanager --version
adb --version
emulator -version
```

> **Note:** Android Studio installs the SDK to `$HOME/Android/Sdk` on Linux and
> `$HOME/Library/Android/sdk` on macOS. If you installed via the command-line tools
> package alone, point `ANDROID_HOME` at wherever you extracted it.

---

## sdkmanager

`sdkmanager` installs, updates, and removes Android SDK packages.

### List installed and available packages

```bash
# All available packages (can be long)
sdkmanager --list

# Filter to show only installed packages
sdkmanager --list --installed

# Filter output to a keyword
sdkmanager --list | grep "system-images"
```

### Install packages

```bash
# Install a specific API level platform
sdkmanager "platforms;android-35"

# Install build tools
sdkmanager "build-tools;35.0.0"

# Install a system image for the emulator (x86_64 recommended for speed)
sdkmanager "system-images;android-35;google_apis_playstore;x86_64"

# Install platform-tools (adb, fastboot)
sdkmanager "platform-tools"

# Install emulator
sdkmanager "emulator"

# Accept all licences non-interactively
sdkmanager --licenses
```

### Update all installed packages

```bash
sdkmanager --update
```

### Uninstall a package

```bash
sdkmanager --uninstall "build-tools;34.0.0"
```

### Useful package identifiers

| Package                                   | Identifier                                              |
| ----------------------------------------- | ------------------------------------------------------- |
| Android Platform (API 35)                 | `platforms;android-35`                                  |
| Build Tools                               | `build-tools;35.0.0`                                    |
| Platform Tools (adb)                      | `platform-tools`                                        |
| Emulator                                  | `emulator`                                              |
| Google Play system image (x86_64, API 35) | `system-images;android-35;google_apis_playstore;x86_64` |
| Command-line Tools                        | `cmdline-tools;latest`                                  |

---

## avdmanager — Creating & Managing Virtual Devices

`avdmanager` creates and manages Android Virtual Devices (AVDs).

### List available device definitions

```bash
avdmanager list device
```

### List existing AVDs

```bash
avdmanager list avd
```

### Create an AVD

```bash
avdmanager create avd \
  --name "Pixel9_API35" \
  --package "system-images;android-35;google_apis_playstore;x86_64" \
  --device "pixel_9"
```

- `--name` — the name you'll reference when launching
- `--package` — must match an installed system image (see `sdkmanager --list --installed`)
- `--device` — hardware profile (list with `avdmanager list device`)

### Delete an AVD

```bash
avdmanager delete avd --name "Pixel9_API35"
```

---

## emulator — Running the Android Emulator

### List available AVDs

```bash
emulator -list-avds
```

### Start an emulator

```bash
emulator -avd Pixel9_API35
```

Run in the background (no attached terminal):

```bash
emulator -avd Pixel9_API35 -no-window &
```

### Useful launch flags

| Flag                | Description                               |
| ------------------- | ----------------------------------------- |
| `-no-snapshot-load` | Cold boot every time (ignore saved state) |
| `-wipe-data`        | Factory reset the AVD before starting     |
| `-no-audio`         | Disable audio (useful in CI)              |
| `-no-window`        | Run headless                              |
| `-gpu host`         | Use host GPU (better performance)         |
| `-memory 4096`      | Set RAM in MB                             |

### Wait for the emulator to be ready (scripting)

```bash
adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'
```

---

## adb — Android Debug Bridge

`adb` is the primary tool for communicating with a running device or emulator.

### Device management

```bash
# List connected devices/emulators
adb devices

# Target a specific device (if multiple are connected)
adb -s emulator-5554 <command>
```

### Installing and uninstalling APKs

```bash
# Install an APK
adb install path/to/app.apk

# Reinstall, keeping data
adb install -r path/to/app.apk

# Uninstall by package name
adb uninstall com.example.landline
```

### Launching an app

```bash
adb shell am start -n com.example.landline/.MainActivity
```

### Logcat — viewing device logs

```bash
# Stream all logs
adb logcat

# Filter by tag
adb logcat -s ReactNative

# Filter by log level (V=verbose, D=debug, I=info, W=warn, E=error)
adb logcat *:E

# Filter by multiple tags
adb logcat -s ReactNative:D ExpoModulesCore:W

# Clear the log buffer first, then stream
adb logcat -c && adb logcat
```

### File transfer

```bash
# Copy a file to the device
adb push local/file.txt /sdcard/file.txt

# Copy a file from the device
adb pull /sdcard/file.txt local/file.txt
```

### Shell access

```bash
# Open an interactive shell
adb shell

# Run a single command
adb shell ls /data/local/tmp
```

### Port forwarding (useful for Metro bundler)

```bash
# Forward device port 8081 to host port 8081
adb reverse tcp:8081 tcp:8081

# Remove port forward
adb reverse --remove tcp:8081
```

> Metro bundler uses `adb reverse` automatically when you run `pnpm android`,
> but you can run it manually if the connection drops.

### Useful one-liners

```bash
# Reboot the device/emulator
adb reboot

# Show current app in focus
adb shell dumpsys window | grep mCurrentFocus

# Simulate a back-button press
adb shell input keyevent 4
```

> **Screenshots:** Use the project script instead of raw `adb` — see
> [`scripts/capture-app-store-screenshots.sh`](#capture-app-store-screenshotssh) below.

---

## Project Scripts

The `scripts/` directory contains helper scripts that wrap common `adb` workflows.

### `capture-app-store-screenshots.sh`

Captures named screenshots from a running emulator or device and saves them
locally. Useful when preparing app store assets.

```bash
# Basic usage — saves PNGs to ./tmp/
./scripts/capture-app-store-screenshots.sh

# Custom output directory
./scripts/capture-app-store-screenshots.sh my-screenshots

# Specific device serial (required when multiple devices are connected)
./scripts/capture-app-store-screenshots.sh my-screenshots emulator-5554
```

The script will:

1. Detect connected devices via `adb devices`.
2. Prompt for a screenshot name (or auto-name as `shot-1`, `shot-2`, …).
3. Capture with `adb exec-out screencap -p` and write a `.png` per shot.
4. Type `done` to exit.

Output files are named `<serial>-<name>.png` inside the output directory.

---

### `test-notification.sh`

Launches the app via `adb` and prints instructions for triggering a test
notification through the in-app UI.

```bash
./scripts/test-notification.sh
```

This script:

1. Starts the app with `adb shell am start`.
2. Prints a checklist — navigate to the **Auto-Reply Test Page**, tap
   **Send Test Message**, and pull down the notification shade to verify.
3. If auto-reply is enabled you should see a "Reply Sent" notification within
   1–2 seconds.

> Use this script as a quick sanity-check after changes to the notification or
> auto-reply pipeline.

---

## Recommended Emulator Setup for This Project

The project targets Android and uses notification/foreground service APIs. For
the best local dev experience:

1. **Install a Google Play system image** — required to test Play Services
   (FCM push notifications):

   ```bash
   sdkmanager "system-images;android-35;google_apis_playstore;x86_64"
   ```

2. **Create a Pixel 9 AVD:**

   ```bash
   avdmanager create avd \
     --name "Pixel9_API35" \
     --package "system-images;android-35;google_apis_playstore;x86_64" \
     --device "pixel_9"
   ```

3. **Launch it:**

   ```bash
   emulator -avd Pixel9_API35
   ```

4. **Run the app:**

   ```bash
   pnpm android
   ```

   `pnpm android` will detect the running emulator, build, install the APK,
   and set up Metro port forwarding automatically.

---

## See Also

- [BUILD.md](../BUILD.md) — project build instructions and troubleshooting
- [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local)
- [Android SDK Manager docs](https://developer.android.com/tools/sdkmanager)
- [ADB docs](https://developer.android.com/tools/adb)
