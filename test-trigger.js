// Quick test script to trigger decision gate for all open cases
require('dotenv').config();

async function main() {
  // Get all open cases
  const response = await fetch('http://localhost:3000/api/disputes', {
    headers: {
      'Cookie': 'your-auth-cookie-here' // This won't work without auth, but let's try
    }
  });

  console.log('Fetching open cases...');
  
  // For now, just try to trigger for a known case
  // The user should provide the case ID from the URL
  const caseId = process.argv[2];
  
  if (!caseId) {
    console.log('Usage: node test-trigger.js <caseId>');
    console.log('Example: node test-trigger.js cm4abc123xyz');
    process.exit(1);
  }

  console.log(`\nTriggering decision gate for case: ${caseId}`);
  
  try {
    const triggerResponse = await fetch('http://localhost:3000/api/admin/trigger-gate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caseId }),
    });

    const result = await triggerResponse.json();
    console.log('\nResult:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Documents should start generating now.');
      console.log('Check the server logs for progress.');
    } else {
      console.log('\n❌ Failed to trigger. Check server logs for details.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
