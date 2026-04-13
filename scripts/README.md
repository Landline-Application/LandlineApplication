# Export Beta Signups to CSV

This script exports all beta signup emails from Firebase Firestore to a CSV file.

## Quick Setup

### Step 1: Get your Firebase service account key

1. Go to [Firebase Console](https://console.firebase.google.com/project/landline-application/settings/serviceaccounts)
2. Click **"Generate new private key"**
3. Save the JSON file as `service-account-key.json` in this `scripts/` folder

### Step 2: Install dependencies

```bash
cd scripts
npm install firebase-admin
```

### Step 3: Run the export

```bash
node export-beta-signups.js
```

This will create two files:

- `beta-signups.csv` - Full data with email, source, and signup date
- `beta-emails.txt` - Just the emails (copy/paste into Google Play Console)

## Alternative: Using Firebase CLI

If you prefer not to use a script, you can use the Firebase CLI to export all data:

```bash
# Export all Firestore data (includes betaSignups)
firebase firestore:export ./firestore-export --project landline-application

# This creates a backup that you can browse
```

## For Google Play Console

To add testers to your closed beta:

1. Open `beta-emails.txt` (created by the script)
2. Copy all emails
3. Go to [Google Play Console](https://play.google.com/console)
4. Navigate to your app → Testing → Closed testing
5. Click "Create release" or "Edit"
6. Paste emails into the "Testers" section

## Troubleshooting

**"Cannot find module './service-account-key.json'"**

- Make sure you downloaded the service account key and saved it as `service-account-key.json` in the scripts folder

**"Permission denied"**

- The service account needs "Cloud Datastore User" or "Editor" role
- Check in Firebase Console → IAM & Admin → IAM
