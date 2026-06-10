# Scripts

## Development

### `emulator-launch.sh`
Launch an Android emulator. Uses `gum` for a TUI picker if installed; falls back to a numbered prompt.

```bash
./scripts/emulator-launch.sh
```

### `send-test-sms.sh`
Send a fake SMS to a running emulator via ADB. Useful for testing notification capture.

```bash
./scripts/send-test-sms.sh [phone_number] [message]
# e.g. ./scripts/send-test-sms.sh 5554 "Hello from Landline"
```

### `capture-app-store-screenshots.sh`
Capture screenshots from a connected device or emulator via ADB. Saves PNGs to a local directory.

```bash
./scripts/capture-app-store-screenshots.sh [output_dir] [device_serial]
# e.g. ./scripts/capture-app-store-screenshots.sh app-store-shots emulator-5554
```

---

## Build & Release

### `setup.sh`
One-time setup for new developers. Checks EAS CLI, authentication, keystore, `.env.local`, Android SDK, and Node/pnpm.

```bash
./scripts/setup.sh
```

> **Windows users:** Requires Bash. Run via Git Bash or WSL.

### `build-android-production.sh`
Build and optionally submit a production Android AAB to Google Play Console via EAS.

```bash
./scripts/build-android-production.sh
```

---

## Data Export

### `export-beta-signups.js`
Export beta signup emails from Firebase Firestore to CSV and `.txt` for Google Play Console testers.

**Setup:**
1. Download a Firebase service account key from the [Firebase Console](https://console.firebase.google.com/project/landline-application/settings/serviceaccounts)
2. Save it as `scripts/service-account-key.json`
3. Install deps: `cd scripts && npm install firebase-admin`

```bash
node scripts/export-beta-signups.js
```

Outputs:
- `beta-signups.csv` — email, source, signup date
- `beta-emails.txt` — emails only, for pasting into Google Play Console
