# Permission Backup Plan

If Google Play rejects the app over `FOREGROUND_SERVICE_SPECIAL_USE` or
`QUERY_ALL_PACKAGES`, both can be removed cleanly. Neither permission gates the
app's core functionality — Landline Mode will still capture and display
notifications after both are stripped out.

---

## Summary

| Permission                                              | Used for                                                               | Core to app?                                                  | Removal effort   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------- |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_SPECIAL_USE` | Persistent status-bar notification while Landline Mode is on           | No — already wrapped in `try/catch` that continues on failure | ~10 min, 2 files |
| `QUERY_ALL_PACKAGES`                                    | Debug button + unfinished "App Selection" screen (hardcoded mock data) | No — never wired to live state                                | ~5 min, 4 files  |

---

## 1. Remove the Foreground Service

### What it does today

When the user enables Landline Mode, `use-landline-store.ts` starts a persistent
Android foreground service (`NotificationForegroundService`) which displays a
low-priority status-bar notification ("Landline Mode Active / Your notifications
are being captured"). The service does **not** capture notifications — that is
done by a separate, always-on `NotificationListenerService` inside the
`notification-api-manager` module. The foreground service's only job is to hold
the app process alive while the screen is off.

The call is already wrapped in an isolated `try/catch` that explicitly comments
"Continue anyway — service is optional". Removing it has no effect on
notification capture correctness.

### What breaks if removed

- The persistent status-bar notification will no longer appear during Landline
  Mode.
- On some aggressive OEM ROMs (Xiaomi MIUI, Samsung One UI with battery saver),
  the app process may be killed sooner when the screen is off, causing a gap in
  notification capture. This is a reliability trade-off, not a correctness
  failure — when the user reopens the app the listener reconnects automatically.

### Exact changes required

#### 1a. `hooks/use-landline-store.ts`

Remove the two `try/catch` blocks that start and stop the service. Leave
everything else untouched.

**On activate (lines 95–104) — delete these lines:**

```typescript
// Start foreground service for reliability
try {
  BackgroundServiceManager.startForegroundService(
    'Landline Mode Active',
    'Your notifications are being captured',
  );
} catch (serviceErr) {
  console.warn('Background service not available:', serviceErr);
  // Continue anyway - service is optional
}
```

**On deactivate (lines 151–157) — delete these lines:**

```typescript
// Stop foreground service
try {
  BackgroundServiceManager.stopForegroundService();
} catch (serviceErr) {
  console.warn('Service stop failed:', serviceErr);
  // Continue anyway
}
```

Also remove the now-unused import at line 3:

```typescript
import * as BackgroundServiceManager from '@/modules/background-service-manager';
```

#### 1b. `app/(tabs)/debug-tools.tsx`

Remove the "Start / Stop Foreground Service" toggle button (lines 283–347) and
the status rows that reference `serviceRunning`.

The import of `BackgroundServiceManager` (line 12) can also be removed if no
other debug buttons reference it — check for remaining uses of `BackgroundServiceManager`
in that file first (battery optimization calls at lines 72–76 and 376 still use it,
so keep the import unless you remove those too).

#### 1c. `modules/background-service-manager/android/src/main/AndroidManifest.xml`

Remove the two permission lines:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
```

#### 1d. `app.json`

Remove the two permission strings from the `android.permissions` array:

```json
"android.permission.FOREGROUND_SERVICE",
"android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
```

#### 1e. `plugins/withAndroidForegroundService.js`

Remove the plugin from `app.json` plugins array:

```json
"./plugins/withAndroidForegroundService.js"
```

The plugin file itself can be deleted too, but it is harmless if left in place.

---

## 2. Remove QUERY_ALL_PACKAGES

### What it does today

The permission is declared in `modules/dnd-manager/android/src/main/AndroidManifest.xml`
and is used by exactly one call site: a debug-only "Get Installed Apps" button in
`app/(tabs)/debug-tools.tsx` (line 738). It calls `getAllInstalledApps(false)` and
shows the result in an Alert — purely for manual inspection.

The App Selection screen (`app/app-selection.tsx`) was intended to use this data
but currently displays entirely hardcoded mock data (14 fixed apps) and its "Save"
button only shows an Alert — it does not persist anything or affect notification
filtering in any way.

### What breaks if removed

Nothing in the live app. Notification capture continues for all apps. The user
loses the ability to navigate to the App Selection screen, but that screen does
not work yet anyway.

### Exact changes required

#### 2a. `modules/dnd-manager/android/src/main/AndroidManifest.xml`

Remove line 3:

```xml
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```

#### 2b. `app/(tabs)/debug-tools.tsx`

Remove the "Get Installed Apps" button (lines 735–748):

```typescript
<Button
  title="Get Installed Apps"
  onPress={async () => {
    const apps = await getAllInstalledApps(false);
    Alert.alert(
      'Installed Apps',
      `Found ${apps.length} apps\n\nFirst 3:\n${apps
        .slice(0, 3)
        .map((a) => `${a.appName}`)
        .join('\n')}`,
    );
  }}
  color={COLORS.dark.primary}
/>
```

Remove `getAllInstalledApps` from the import on lines 13–21:

```typescript
import {
  getAllInstalledApps,   // <-- remove this line
  getCurrentState,
  ...
} from '@/modules/dnd-manager';
```

#### 2c. `app/(tabs)/settings.tsx`

Remove the "App Selection" navigation button (lines 181–189):

```typescript
<TouchableOpacity
  style={styles.actionButton}
  onPress={() => router.push('/app-selection' as any)}
>
  <Text style={styles.actionButtonText}>📱 App Selection</Text>
  <Text style={styles.actionButtonSubtext}>
    Choose which apps to include in Landline Mode
  </Text>
</TouchableOpacity>
```

#### 2d. `app/permissions.tsx`

Remove the "Next: Choose Your Apps" card (lines 369–380):

```typescript
<TouchableOpacity style={styles.nextStepCard} onPress={() => router.push('/app-selection')}>
  <View style={styles.nextStepContent}>
    <Text style={styles.nextStepIcon}>📱</Text>
    <View style={styles.nextStepText}>
      <Text style={styles.nextStepTitle}>Next: Choose Your Apps</Text>
      <Text style={styles.nextStepDescription}>
        Select which apps to include in Landline Mode
      </Text>
    </View>
  </View>
  <Text style={styles.nextStepArrow}>→</Text>
</TouchableOpacity>
```

#### 2e. `app/_layout.tsx`

Remove the route registration (line 65):

```typescript
<Stack.Screen name="app-selection" options={{ headerShown: false }} />
```

#### 2f. `app/app-selection.tsx`

Delete the file entirely. Nothing imports it — it is only reachable via
`router.push('/app-selection')`, which will be removed in steps 2c and 2d above.

---

## After either removal — rebuild

```bash
# Regenerate Android project to pick up manifest changes
npx expo prebuild --clean

# Then build a new production bundle
eas build --platform android --profile production
```

---

## Re-adding later

Both features can be re-introduced at any time:

- **Foreground service:** restore the two `try/catch` blocks in
  `use-landline-store.ts`, re-add the permissions, and re-add the plugin entry.
- **App Selection / QUERY_ALL_PACKAGES:** restore the permission and wire
  `getAllInstalledApps()` into `app-selection.tsx` to replace the hardcoded mock
  data. The Play Store declaration will need to be re-submitted with a demo video.
