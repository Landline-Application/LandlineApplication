# How to update the closed-beta app

Closed-beta phones update only from **Google Play**. Merge to `main`, then ship a new production AAB with a **higher** `versionCode` than the build already on the closed track.

`eas.json` uses `"appVersionSource": "remote"`. Production builds use the version on Expo, so bump that and keep `app.config.ts` `android.versionCode` in sync. Testers must be on the closed-testing list ([beta signup export](beta-signup-system.md)), have accepted the Play invite, and install from the Play listing (not a sideloaded APK).

## Steps

1. Merge the work into `main`.

2. Increment the Android version (Play rejects an upload with the same `versionCode`):

   ```bash
   eas build:version:set -p android -e production
   ```

   Set `android.versionCode` in `app.config.ts` to the same number.

3. Build the production AAB ([BUILD.md](../BUILD.md)):

   ```bash
   eas build --platform android --profile production
   ```

4. Submit the `.aab` to Play (`eas submit` or a manual upload).

5. In Play Console, release it on the **closed testing** track.

6. Testers open Play → Landline → **Update** (or wait for auto-update). Rollout can take minutes to hours.

EAS **preview** / internal APKs do not update through Play. Those installs need a new APK/link, or the tester should switch to the Play closed-beta app.
