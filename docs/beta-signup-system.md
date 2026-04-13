# Beta Signup System

This document describes the beta signup system for Landline, including the public signup page and the admin export functionality.

## Overview

The beta signup system allows potential users to join a waitlist for the Landline app. Signups are stored in Firebase Firestore and can be exported as CSV for importing into Google Play Console for closed beta testing.

## Components

### 1. Public Signup Page

**Location:** `web/beta-signup/index.html`

A public-facing page where users can enter their email to join the beta waitlist.

**Features:**

- Email input with validation
- Optional "How did you hear about us?" dropdown
  - Through a friend
  - ASU Capstone
- Duplicate prevention (uses email as document ID)
- Success confirmation after signup
- Rolodex card design matching the app theme

**URL:** Deployed at `https://your-domain.com/beta-signup/`

### 2. Admin Export Page

**Location:** `web/admin/export-signups.html`

A protected page for administrators to view and export signup data.

**Features:**

- Firebase Authentication (email/password)
- Total signup count
- Source breakdown statistics
- CSV export with columns: Email, Source, Sign Up Date
- Only accessible by authorized admin user

**URL:** Deployed at `https://your-domain.com/admin/export-signups.html`

### 3. Firestore Security Rules

**Location:** `firestore.rules`

Security rules that protect the beta signup data:

```javascript
match /betaSignups/{docId} {
  // Anyone can create with valid email format
  allow create: if request.resource.data.email is string
                && request.resource.data.email.matches('^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$')
                && request.resource.data.timestamp is timestamp;

  // Only admin can read
  allow read: if request.auth != null
              && request.auth.token.email == 'admin@landline.app';

  // No update or delete allowed
  allow update, delete: if false;
}
```

### 4. Data Structure

Each signup is stored as a document in the `betaSignups` collection:

```
Collection: betaSignups
  Document ID: normalized_email (e.g., "user_example_com")
    email: string (e.g., "user@example.com")
    source: string | null (e.g., "Through a friend")
    timestamp: timestamp (server-generated)
```

### 5. Utility Scripts

**Location:** `scripts/`

#### create-admin-user.js

Creates an admin user in Firebase Authentication via REST API.

```bash
node scripts/create-admin-user.js <email> <password>
```

**Note:** The created user's email must match the email specified in the Firestore rules.

#### test-export.js

Populates test data and verifies the export functionality works correctly.

```bash
node scripts/test-export.js [add|export|both]
```

## Setup Instructions

### Step 1: Create Admin User

1. Run the create-admin script:

   ```bash
   node scripts/create-admin-user.js admin@landline.app YourSecurePassword123
   ```

2. Note the UID that is output (e.g., `kgNWG3fs7wPHnbdrVhw3jIyPu8H3`)

### Step 2: Deploy Firestore Rules

The rules are already configured with the admin email. Deploy them:

```bash
firebase deploy --only firestore:rules --project landline-application
```

### Step 3: Verify Setup

1. Visit the beta signup page and submit a test email
2. Visit the admin export page
3. Sign in with the admin credentials
4. Verify the signup appears and can be exported as CSV

## Usage

### For Beta Testers

1. Navigate to the beta signup page
2. Enter email address
3. Optionally select how they heard about the app
4. Click "Join Waitlist"
5. See confirmation message

### For Admins

1. Navigate to the admin export page
2. Sign in with admin credentials
   - Email: `admin@landline.app`
   - Password: (the one set during setup)
3. View total signups and source breakdown
4. Click "Download CSV" to get the data

## Google Play Console Integration

1. Download the CSV from the admin page
2. Open the CSV file
3. Copy the Email column
4. Go to Google Play Console → Your App → Testing → Closed testing
5. Paste emails into the testers section

## Security Considerations

- **Data Access:** Only the specific admin email can read signup data
- **Data Creation:** Anyone can submit a signup, but emails are validated
- **Duplicates:** Prevented by using normalized email as document ID
- **No Delete/Update:** Signups cannot be modified or deleted via the app

## Customization

### Change Admin Email

1. Update `firestore.rules`:

   ```javascript
   allow read: if request.auth != null
               && request.auth.token.email == 'new-admin@yourdomain.com';
   ```

2. Deploy rules:

   ```bash
   firebase deploy --only firestore:rules --project landline-application
   ```

3. Create new admin user with the new email

### Change Password

To change the admin password:

1. Go to Firebase Console → Authentication → Users
2. Find the admin user
3. Click "Reset password" or delete and recreate the user

## Troubleshooting

### "Permission Denied" Error

- Verify you're signed in with the correct admin email
- Check that the Firestore rules have been deployed
- Confirm the admin email in rules matches the authenticated user

### "Invalid Credential" Error

- Wrong email or password
- User may not exist in Firebase Authentication
- Check Firebase Console → Authentication → Users

### No Data Appearing

- Check Firestore Console to see if signups are being saved
- Verify the collection name is `betaSignups`
- Check browser console for JavaScript errors

### CSV Export Not Working

- Check browser console for errors
- Verify user is authenticated
- Ensure data exists in the collection

## Files Overview

| File                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| `web/beta-signup/index.html`    | Public signup page                        |
| `web/admin/export-signups.html` | Admin export page                         |
| `firestore.rules`               | Security rules for betaSignups collection |
| `scripts/create-admin-user.js`  | Create admin users via API                |
| `scripts/test-export.js`        | Test data and export verification         |

## Support

For issues or questions about the beta signup system, contact the project owner or check the Firebase Console for detailed error logs.
