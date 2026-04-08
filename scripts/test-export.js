const fs = require('fs');
const path = require('path');

// Using Firebase REST API (no service account needed)

const PROJECT_ID = 'landline-application';

async function addTestData() {
  console.log('Adding test beta signups...\n');

  const testData = [
    {
      email: 'test1@example.com',
      source: 'Through a friend',
      timestamp: new Date().toISOString(),
    },
    {
      email: 'test2@example.com',
      source: 'ASU Capstone',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      email: 'test3@example.com',
      source: '',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      email: 'beta.user@gmail.com',
      source: 'Through a friend',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
    {
      email: 'student@asu.edu',
      source: 'ASU Capstone',
      timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    },
  ];

  // Using Firebase REST API since we don't have service account
  const apiKey = 'AIzaSyAZjY6U6zo2K037tSv-10mEuchy49AGQEk';

  for (const data of testData) {
    const docId = data.email.replace(/[^a-zA-Z0-9]/g, '_');

    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/betaSignups/${docId}?key=${apiKey}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              email: { stringValue: data.email },
              source: { stringValue: data.source },
              timestamp: { timestampValue: data.timestamp },
            },
          }),
        },
      );

      if (response.ok) {
        console.log(`✅ Added: ${data.email}`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed: ${data.email} - ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${data.email} - ${error.message}`);
    }
  }

  console.log('\n✅ Test data added successfully!');
}

async function testExport() {
  console.log('\n📊 Testing export functionality...\n');

  const apiKey = 'AIzaSyAZjY6U6zo2K037tSv-10mEuchy49AGQEk';

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/betaSignups?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    if (!data.documents) {
      console.log('No documents found in betaSignups collection');
      return;
    }

    console.log(`Found ${data.documents.length} signups:\n`);

    // Parse and display
    const signups = data.documents.map((doc) => {
      const fields = doc.fields;
      return {
        email: fields.email?.stringValue || '',
        source: fields.source?.stringValue || '',
        timestamp: fields.timestamp?.timestampValue || '',
      };
    });

    signups.forEach((s, i) => {
      console.log(`${i + 1}. ${s.email}`);
      console.log(`   Source: ${s.source || 'Not specified'}`);
      console.log(`   Date: ${s.timestamp ? new Date(s.timestamp).toLocaleString() : 'N/A'}\n`);
    });

    // Generate CSV
    let csv = 'Email,Source,Sign Up Date\n';
    signups.forEach((s) => {
      const escapedEmail = `"${s.email.replace(/"/g, '""')}"`;
      const escapedSource = `"${(s.source || '').replace(/"/g, '""')}"`;
      const date = s.timestamp || '';
      csv += `${escapedEmail},${escapedSource},${date}\n`;
    });

    // Save CSV
    const outputPath = path.join(__dirname, 'test-export.csv');
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ CSV exported to: ${outputPath}`);

    // Save email list
    const emailList = signups.map((s) => s.email).join('\n');
    const emailListPath = path.join(__dirname, 'test-emails.txt');
    fs.writeFileSync(emailListPath, emailList);
    console.log(`✅ Email list exported to: ${emailListPath}`);

    // Source breakdown
    const sources = {};
    signups.forEach((s) => {
      const src = s.source || 'Not specified';
      sources[src] = (sources[src] || 0) + 1;
    });

    console.log('\n📈 Source Breakdown:');
    for (const [source, count] of Object.entries(sources)) {
      console.log(`  ${source}: ${count}`);
    }
  } catch (error) {
    console.error('❌ Export test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Beta Signup Test & Export Tool\n');
console.log('1. Add test data');
console.log('2. Test export');
console.log('3. Do both\n');

const command = process.argv[2];

if (command === 'add' || command === '1') {
  addTestData();
} else if (command === 'export' || command === '2') {
  testExport();
} else if (command === 'both' || command === '3') {
  addTestData().then(() => testExport());
} else {
  console.log('Usage: node test-export.js [add|export|both]');
  console.log('  add    - Add test data');
  console.log('  export - Test export functionality');
  console.log('  both   - Add data and test export');
  console.log('\nRunning both by default...\n');
  addTestData().then(() => testExport());
}
