#!/usr/bin/env node

/**
 * Create Firebase Auth User via REST API
 *
 * Usage: node create-admin-user.js <email> <password>
 * Example: node create-admin-user.js admin@landline.app SecurePass123!
 */

const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) {
  console.error('Error: FIREBASE_API_KEY environment variable is not set.');
  console.error('Add it to your .env.local or pass it inline:');
  console.error('  FIREBASE_API_KEY=your-key node create-admin-user.js <email> <password>');
  process.exit(1);
}

async function createUser(email, password) {
  if (!email || !password) {
    console.error('Usage: node create-admin-user.js <email> <password>');
    console.error('Example: node create-admin-user.js admin@landline.app SecurePass123!');
    process.exit(1);
  }

  console.log(`Creating user: ${email}...\n`);

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Unknown error');
    }

    console.log('✅ User created successfully!\n');
    console.log('Email:', data.email);
    console.log('UID:', data.localId);
    console.log('\nNext steps:');
    console.log('1. Update firestore.rules with this email:');
    console.log(
      `   allow read: if request.auth != null && request.auth.token.email == '${email}';`,
    );
    console.log('2. Deploy the rules:');
    console.log('   firebase deploy --only firestore:rules --project landline-application');
    console.log('3. Sign in at /admin/export-signups.html');
  } catch (error) {
    console.error('❌ Error creating user:', error.message);

    if (error.message.includes('EMAIL_EXISTS')) {
      console.error('\nThis email already exists. You can use it directly.');
    } else if (error.message.includes('WEAK_PASSWORD')) {
      console.error('\nPassword is too weak. Use at least 6 characters.');
    } else if (error.message.includes('INVALID_EMAIL')) {
      console.error('\nInvalid email format.');
    }

    process.exit(1);
  }
}

// Get arguments
const email = process.argv[2];
const password = process.argv[3];

createUser(email, password);
