# How to Obtain google-services.json

The `google-services.json` file contains Firebase configuration for the Landline Android app. It is **not** in the repository (for security), so each developer must obtain it separately.

---

## 1. Download from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open the **Landline** project (or `landline-application`)
3. Click the gear icon → **Project settings**
4. Under **Your apps**, select the **Android** app (`com.outersnail.Landline`)
5. Click **Download google-services.json**
6. Save the file to the **project root** of LandlineApplication (same folder as `app.json`)

---

## 2. File location

Place the file here:

```
LandlineApplication/
├── app.json
├── google-services.json   ← here
├── package.json
└── ...
```

---

## 3. After adding the file

Run:

```bash
npx expo prebuild --clean --platform android
pnpm android
```

---

## 4. Getting it from a teammate

If you don't have access to Firebase Console, ask a teammate who does. Do not share it in public chat or commit it to the repo.

