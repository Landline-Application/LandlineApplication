# Firebase Configuration

Landline uses a shared Firebase project for authentication and backend services. New team members do **not** need to create their own Firebase project.

## What's Already Set Up

The following are already configured and ready to use:

- **Firebase Project**: Landline Application (shared)
- **Authentication**: Google Sign-In and Phone Auth enabled
- **Firestore**: Database for user data and app state
- **Google Play Console**: Linked for app distribution

## What You Need

### 1. google-services.json

This file contains the Firebase configuration and must be obtained from a team member or Firebase Console.

**Do NOT commit this file to git.** It should already be in `.gitignore`.

**To obtain:**

1. Ask a teammate who has Firebase Console access
2. Or request access to the Firebase Console project from the project owner
3. Place the file at: `LandlineApplication/google-services.json`

### 2. Environment Variable (Optional)

For local builds with EAS, you can set the path:

```bash
# In .env.local (not committed)
GOOGLE_SERVICES_JSON=/absolute/path/to/google-services.json
```

The `app.config.ts` will use this environment variable if set, otherwise falls back to `./google-services.json`.

## Firebase Services Used

| Service       | Purpose                              | Package                            |
| ------------- | ------------------------------------ | ---------------------------------- |
| Firebase Auth | Google Sign-In, Phone authentication | `@react-native-firebase/auth`      |
| Firebase App  | Core Firebase functionality          | `@react-native-firebase/app`       |
| Firestore     | User data, preferences               | `@react-native-firebase/firestore` |

## Authentication Flow

Currently implemented:

- **Google Sign-In**: Via `@react-native-google-signin/google-signin`
- **Phone Auth**: UI ready, backend integration in progress

## Troubleshooting

### "google-services.json is missing"

```
Execution failed for task ':app:processDebugGoogleServices'.
> File google-services.json is missing.
```

**Fix:** Obtain `google-services.json` from a teammate and place it in the project root.

### Google Sign-In Not Working

1. Check that `google-services.json` is valid and not corrupted
2. Verify the SHA-1 fingerprint of your debug keystore matches Firebase config
3. For release builds, the release keystore SHA-1 must also be registered in Firebase

### Getting Your SHA-1 Fingerprint

```bash
# Debug keystore (default Android debug key)
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore

# When prompted for password, enter: android
```

Add this SHA-1 to Firebase Console under Project Settings → Your apps → Android app → SHA certificate fingerprints.

## Project Access

To get access to the shared Firebase project:

1. Request access from the project owner
2. Provide your Google account email
3. You will receive an invitation to join the Firebase project

## See Also

- [GOOGLE-SERVICES-SETUP.md](GOOGLE-SERVICES-SETUP.md) - How to obtain the config file
- [BUILD.md](../../BUILD.md) - Build instructions
- [Firebase Console](https://console.firebase.google.com/)
