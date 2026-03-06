# LLA-96: Database Implementation Research

**Ticket:** LLA-96  
**EPIC:** Data Management and Privacy  
**Assignee:** Alec Morris  
**Date:** January 29, 2026  
**Status:** In Progress  

---

## 1. Executive Summary

This document evaluates database solutions for the Landline Android Application. The primary focus is on **Firebase** as the recommended solution, with **Supabase** as an alternative. We also briefly cover other options that would require custom authentication implementation.

**Recommendation:** Firebase (Firestore + Firebase Authentication)

---

## 2. Requirements Analysis

*Based on the Landline Design Document*

### User Authentication Requirements (Design Doc Section 1a)

The app requires users to:
1. **Register with email address** - primary identifier
2. **Register with phone number** - for SMS verification
3. **Verify email** - via confirmation link/code
4. **Verify phone** - via SMS verification code
5. **Accept Terms of Use** - individually for each registered address

### What Landline Needs to Store

| Data Type | Description | Design Doc Reference |
|-----------|-------------|---------------------|
| **User Account** | Email, phone number, verification status | Section 1a - Initial Setup |
| **Terms Acceptance** | Record of ToU acceptance per email/phone | Section 1a, Section 1 (Terms Agreement) |
| **Emergency Contacts** | Contacts that can bypass Landline Mode | Section 1e |
| **OOO Reply Contacts** | Contacts to send "I'm on Landline" replies to | Section 1d |
| **App Selection** | Which apps to include/exclude in Landline Mode | Section 1b, 1c |
| **Auto-Reply Message** | Custom out-of-office message text | Section 2d, 3d-f |
| **Notification Logs** | Categorized: Texts, Emails, Calls, Voicemails, App notifications | Section 3 (Notification Log Categories) |
| **User Preferences** | UI style, themes, color schemes | Section 1f |

### Privacy & Compliance Requirements (Design Doc - Success Criteria)

- All logged data **encrypted at rest and in transit**
- **GDPR and CCPA compliance** required
- Users must be able to **view, delete, or reset** notification logs
- **No unauthorized access** or data leakage
- Clear **user consent policies**

### Future Requirement: Multi-Device Sync

The design document mentions "Multi-device support with account login" as a future improvement, which requires cloud-based user authentication.

### Technical Requirements

- **Authentication:** Email + Phone number verification (minimum)
- **Offline Support:** App should work without internet (local storage)
- **Real-time Sync:** Settings should sync across sessions (future: across devices)
- **Privacy:** User data must be isolated, encrypted, and GDPR/CCPA compliant
- **React Native/Expo Compatible:** Must work with our tech stack
- **Cost Effective:** Free tier sufficient for beta/MVP

---

## 3. Firebase (Primary Option)

### Overview

Firebase is Google's mobile development platform providing backend services including authentication, databases, and cloud functions.

### Relevant Services

| Service | Purpose | Pricing (Free Tier) |
|---------|---------|---------------------|
| Firebase Authentication | User login/signup | 50K MAU free |
| Cloud Firestore | NoSQL document database | 1GB storage, 50K reads/day |
| Realtime Database | JSON real-time sync | 1GB storage, 10GB transfer |

### Pros

1. **All-in-One Solution** - Auth + Database in single platform
2. **Excellent React Native Support** - `@react-native-firebase` is well-maintained
3. **Offline Persistence** - Built-in, works out of the box
4. **Strong Security Rules** - Granular access control per document
5. **Scalable** - Handles growth without architecture changes
6. **Extensive Documentation** - Large community, many tutorials

### Cons

1. **Vendor Lock-in** - Difficult to migrate away from Firebase
2. **Requires Development Build** - Cannot use Expo Go for testing
3. **NoSQL Limitations** - Complex relational queries are difficult
4. **Cost at Scale** - Read/write operations can add up

### Setup Complexity

- **Difficulty:** Medium
- **Time Estimate:** 4-6 hours for initial setup

**Required Packages:**
- @react-native-firebase/app
- @react-native-firebase/auth
- @react-native-firebase/firestore

### Proposed Data Model (Firestore)

*Based on Landline Design Document requirements*

```
users (collection)
└── {userId} (document)
    │
    │── AUTHENTICATION & PROFILE
    ├── email: string                    # Required (Design Doc 1a)
    ├── emailVerified: boolean           # Email verification status
    ├── phoneNumber: string              # Required (Design Doc 1a)
    ├── phoneVerified: boolean           # SMS verification status
    ├── displayName: string
    ├── createdAt: timestamp
    ├── lastLogin: timestamp
    │
    │── TERMS ACCEPTANCE (Design Doc 1a, Section 1)
    ├── termsAcceptance (subcollection)
    │   └── {acceptanceId} (document)
    │       ├── type: string             # "email" or "phone"
    │       ├── identifier: string       # email address or phone number
    │       ├── acceptedAt: timestamp
    │       └── termsVersion: string
    │
    │── SETTINGS & PREFERENCES
    ├── settings (subcollection)
    │   └── preferences (document)
    │       ├── autoReplyEnabled: boolean
    │       ├── autoReplyMessage: string  # Custom "I'm on Landline" message
    │       ├── uiTheme: string           # "dark", "light" (Design Doc 1f)
    │       ├── logStyle: string          # "rolodex", "addressBook" (Design Doc 1f)
    │       └── colorScheme: string
    │
    │── CONTACTS (Design Doc 1d, 1e)
    ├── emergencyContacts (subcollection)  # Can bypass Landline Mode
    │   └── {contactId} (document)
    │       ├── name: string
    │       ├── phoneNumber: string
    │       ├── email: string
    │       └── addedAt: timestamp
    │
    ├── oooReplyContacts (subcollection)   # Receive auto-reply messages
    │   └── {contactId} (document)
    │       ├── name: string
    │       ├── phoneNumber: string
    │       ├── email: string
    │       └── addedAt: timestamp
    │
    │── APP SELECTION (Design Doc 1b, 1c)
    ├── selectedApps (subcollection)
    │   └── {appId} (document)
    │       ├── packageName: string
    │       ├── appName: string
    │       └── included: boolean         # Include in Landline Mode
    │
    │── NOTIFICATION LOGS (Design Doc Section 3)
    └── notificationLogs (subcollection)
        └── {logId} (document)
            ├── category: string          # "text", "email", "call", "voicemail", "app"
            ├── appName: string
            ├── packageName: string
            ├── title: string
            ├── body: string
            ├── senderName: string
            ├── senderContact: string
            ├── timestamp: timestamp
            ├── sessionId: string         # Which Landline session
            └── isRead: boolean
```

### Security Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{subcollection}/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Cost Estimate

| User Base | Monthly Reads | Monthly Writes | Estimated Cost |
|-----------|---------------|----------------|----------------|
| 100 users | ~50K | ~10K | Free |
| 1,000 users | ~500K | ~100K | $5-10 |
| 10,000 users | ~5M | ~1M | $50-100 |

---

## 4. Supabase (Alternative Option)

### Overview

Supabase is an open-source Firebase alternative built on PostgreSQL. It provides authentication, database, and real-time subscriptions.

### Relevant Services

| Service | Purpose | Pricing (Free Tier) |
|---------|---------|---------------------|
| Supabase Auth | User authentication | 50K MAU free |
| PostgreSQL Database | Relational database | 500MB storage |
| Realtime | Subscribe to changes | Included |

### Pros

1. **Open Source** - Can self-host if needed
2. **PostgreSQL** - Full SQL support, complex queries easy
3. **No Vendor Lock-in** - Standard PostgreSQL, easy to export
4. **Row Level Security** - Powerful access control
5. **Works with Expo** - No development build required for basic features

### Cons

1. **Newer Platform** - Less mature than Firebase (founded 2020)
2. **Smaller React Native Community** - Fewer examples/tutorials
3. **Offline Support** - Requires manual implementation
4. **Cold Starts** - Free tier can be slow on first request

### Setup Complexity

- **Difficulty:** Medium
- **Time Estimate:** 3-5 hours for initial setup

**Required Packages:**
- @supabase/supabase-js
- @react-native-async-storage/async-storage

### Proposed Data Model (PostgreSQL)

```sql
-- Users table (auto-created by Supabase Auth)

-- User settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  landline_mode_enabled BOOLEAN DEFAULT FALSE,
  auto_reply_enabled BOOLEAN DEFAULT FALSE,
  auto_reply_message TEXT,
  UNIQUE(user_id)
);

-- Whitelist contacts
CREATE TABLE whitelist_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  app_name TEXT,
  package_name TEXT,
  title TEXT,
  body TEXT,
  logged_at TIMESTAMP DEFAULT NOW(),
  session_id UUID
);
```

### Cost Estimate

| User Base | Storage Used | Estimated Cost |
|-----------|--------------|----------------|
| 100 users | ~10MB | Free |
| 1,000 users | ~100MB | Free |
| 10,000 users | ~1GB | $25/month |

---

## 5. Other Options Considered

### AWS Amplify

- **Auth:** Cognito (built-in)
- **Database:** DynamoDB or AppSync
- **Pros:** AWS ecosystem, highly scalable
- **Cons:** Complex setup, steeper learning curve
- **Verdict:** Overkill for our needs

### MongoDB Atlas + Custom Auth

- **Auth:** Must implement ourselves (JWT)
- **Database:** MongoDB (document-based)
- **Pros:** Flexible schema, familiar to many devs
- **Cons:** No built-in auth, more development work
- **Verdict:** Too much custom work required

### Appwrite

- **Auth:** Built-in
- **Database:** Document-based
- **Pros:** Open source, self-hostable
- **Cons:** Smaller community, less React Native support
- **Verdict:** Viable but less documented

### PocketBase

- **Auth:** Built-in
- **Database:** SQLite-based
- **Pros:** Single binary, easy to deploy
- **Cons:** Very new, limited React Native examples
- **Verdict:** Too immature for production

---

## 6. Comparison Matrix

| Criteria | Firebase | Supabase | AWS Amplify | Custom |
|----------|----------|----------|-------------|--------|
| Auth Included | Yes | Yes | Yes | No |
| Offline Support | Built-in | Manual | Built-in | Manual |
| React Native Support | Excellent | Good | Complex | N/A |
| Setup Time | 4-6 hrs | 3-5 hrs | 8-12 hrs | 20+ hrs |
| Free Tier | Generous | Good | Limited | N/A |
| Documentation | Extensive | Good | Good | N/A |
| Vendor Lock-in | High | Low | High | None |
| Team Familiarity | Medium | Low | Low | N/A |

---

## 7. Recommendation

### Primary Choice: Firebase

**Reasons:**

1. **Integrated Auth** - Saves significant development time
2. **Offline-First** - Critical for notification management app
3. **Proven at Scale** - Used by major apps worldwide
4. **Best Documentation** - Faster onboarding for team
5. **Free Tier Sufficient** - Covers beta and early launch

### Implementation Plan

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Create Firebase project | 30 min |
| 2 | Configure Authentication | 1 hour |
| 3 | Set up Firestore database | 1 hour |
| 4 | Write security rules | 1 hour |
| 5 | Integrate with React Native | 2-3 hours |
| 6 | Test auth flow | 1-2 hours |

**Total Estimated Time:** 6-8 hours

---

## 8. Next Steps

- [ ] Team reviews this document
- [ ] Discuss recommendation in standup
- [ ] Create Firebase project (if approved)
- [ ] Begin LLA-97 (Implement database)

---

## 9. References

- Firebase Documentation: https://firebase.google.com/docs
- React Native Firebase: https://rnfirebase.io/
- Supabase Documentation: https://supabase.com/docs
- Supabase React Native Guide: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

**Document Prepared By:** Alec Morris  
**Date:** January 29, 2026  
**Version:** 1.0
