const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with your project
// You'll need to download a service account key from Firebase Console
// Go to: Project Settings → Service Accounts → Generate new private key
const serviceAccount = require('./service-account-key.json');

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'landline-application',
});

const db = getFirestore();

async function exportBetaSignups() {
  try {
    console.log('Fetching beta signups...');

    const snapshot = await db.collection('betaSignups').orderBy('timestamp', 'desc').get();

    if (snapshot.empty) {
      console.log('No beta signups found.');
      return;
    }

    // Build CSV content
    let csvContent = 'Email,Source,Sign Up Date\n';

    snapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.email || '';
      const source = data.source || '';
      const timestamp = data.timestamp ? data.timestamp.toDate().toISOString() : '';

      // Escape commas and quotes for CSV
      const escapedEmail = `"${email.replace(/"/g, '""')}"`;
      const escapedSource = `"${source.replace(/"/g, '""')}"`;

      csvContent += `${escapedEmail},${escapedSource},${timestamp}\n`;
    });

    // Save to file
    const outputPath = path.join(__dirname, 'beta-signups.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`✅ Exported ${snapshot.size} signups to: ${outputPath}`);

    // Also create a simple email-only list for Google Play Console
    let emailList = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        emailList += data.email + '\n';
      }
    });

    const emailListPath = path.join(__dirname, 'beta-emails.txt');
    fs.writeFileSync(emailListPath, emailList);

    console.log(`✅ Exported email list to: ${emailListPath}`);
    console.log('\nFiles created:');
    console.log(`  - beta-signups.csv (full data with source and date)`);
    console.log(`  - beta-emails.txt (just emails for Google Play Console)`);
  } catch (error) {
    console.error('Error exporting signups:', error);
    process.exit(1);
  }
}

exportBetaSignups();
