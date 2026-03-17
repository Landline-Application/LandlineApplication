# App Store Release Guide

This document covers everything needed for a Google Play Store submission:

1. Recording the foreground service demo video
2. Recording the QUERY_ALL_PACKAGES demo video
3. Building the production app bundle (.aab)

---

## 1. Foreground Service Demo Video

Google Play requires a video demonstrating the core use of `FOREGROUND_SERVICE` /
`FOREGROUND_SERVICE_SPECIAL_USE` permissions. The video must show the service
starting, the persistent notification appearing, and the service being stopped.

### What to show

| Step | What the reviewer needs to see                                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | App open, Landline Mode **off**                                                                                                                                             |
| 2    | User enables Landline Mode — foreground service starts, persistent notification appears in the status bar                                                                   |
| 3    | Pull down the notification shade to show the persistent "Landline" notification                                                                                             |
| 4    | User disables Landline Mode — notification disappears                                                                                                                       |
| 5    | (Optional) Open the debug tools screen and use the manual "Start Foreground Service" / "Stop Foreground Service" buttons to demonstrate the same lifecycle programmatically |

### How to record

1. Connect an Android device (or start an emulator) running the latest production
   build.
2. On the device, open **Settings > Developer options > Show screen recording
   controls** (or use `adb shell screenrecord`).
3. Start screen recording before launching the app.
4. Walk through each step in the table above.
5. Stop recording and export the file.

#### Quick ADB screen record

```bash
# Start recording (stops automatically after 3 minutes, or Ctrl+C)
adb shell screenrecord /sdcard/foreground-service-demo.mp4

# Pull the file to your machine
adb pull /sdcard/foreground-service-demo.mp4./foreground-service-demo.mp4
```

### Technical background (for the Play Store declaration form)

- **Service class:** `expo.modules.backgroundservicemanager.NotificationForegroundService`
- **Manifest entry:** declared in `plugins/withAndroidForegroundService.js` with
  `android:foregroundServiceType="specialUse"` and the property
  `android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE` = `"Notification monitoring service for Landline Mode"`
- **Permission:** `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_SPECIAL_USE`
- **Purpose:** keeps the notification listener alive while the device screen is off
  so Landline Mode can capture incoming notifications for focused review
- **User visibility:** a persistent low-priority notification is always shown while
  the service is running; the user can stop it at any time from the app

---

## 2. QUERY_ALL_PACKAGES Demo Video

Google Play requires justification for `QUERY_ALL_PACKAGES`. The video must show
the feature that actually uses the permission — listing installed apps so the user
can choose which apps Landline Mode monitors.

### What to show

| Step | What the reviewer needs to see                                              |
| ---- | --------------------------------------------------------------------------- |
| 1    | Open the DND / app-filter settings screen                                   |
| 2    | The app displays a list of all installed (non-system) apps with their names |
| 3    | User toggles notification access on/off for one or more specific apps       |
| 4    | The selection is saved and reflected back in the UI                         |

### How to record

Use the same ADB screen record method described above.

```bash
adb shell screenrecord /sdcard/query-all-packages-demo.mp4
# ...interact with the app...
# Ctrl+C to stop

adb pull /sdcard/query-all-packages-demo.mp4 ./query-all-packages-demo.mp4
```

### Technical background (for the Play Store declaration form)

- **Permission declared in:** `modules/dnd-manager/android/src/main/AndroidManifest.xml`
- **Used by:** `DndManagerModule.kt` — `getAllInstalledApps()` and
  `getAppNotificationStatus()` functions
- **Purpose:** enumerate installed apps so users can select which apps are
  included/excluded from Landline Mode notification monitoring
- **Why `QUERY_ALL_PACKAGES` is necessary:** the core feature is per-app
  notification filtering; without enumerating all packages the user cannot
  configure which apps Landline Mode listens to
- **Data usage:** package names and app labels are displayed in-app only; no data
  is transmitted off the device

---

## 3. Building the Production App Bundle

The production build uses EAS Build and outputs a signed `.aab` for Google Play.

### Prerequisites

- EAS CLI installed: `npm install -g eas-cli`
- Logged in to Expo: `eas login`
- Correct EAS project ID in `app.json` (`9054e1e3-4810-4d81-acef-067671c365a8`)

### Build command

```bash
# Trigger a production Android app bundle build on EAS servers
eas build --platform android --profile production
```

The build profile in `eas.json` is:

```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```

### What happens

1. EAS uploads the project to Expo build servers.
2. Gradle assembles a release `.aab` signed with the keystore managed by EAS.
3. A download link is printed in the terminal when the build completes.
4. Download the `.aab` and upload it to the Google Play Console under
   **Production > Create new release**.

### Version bump (do this before building)

Update `app.json` if the version or build number needs incrementing:

```json
"version": "0.1.0"
```

Because `"appVersionSource": "remote"` is set in `eas.json`, the build number is
managed automatically by EAS — no manual `versionCode` bump is needed.

### Local build (alternative)

If you need to build locally without EAS:

```bash
pnpm prebuild          # regenerate native Android project
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

> **Note:** local builds require your own keystore configured in
> `android/app/build.gradle`. EAS-managed builds handle signing automatically.

---

## Checklist before submitting

- [ ] Foreground service demo video recorded and exported
- [ ] QUERY_ALL_PACKAGES demo video recorded and exported
- [ ] Production `.aab` built and downloaded
- [ ] Play Store declaration form filled in for `FOREGROUND_SERVICE_SPECIAL_USE`
- [ ] Play Store declaration form filled in for `QUERY_ALL_PACKAGES`
- [ ] App version / release notes updated in the Play Console
