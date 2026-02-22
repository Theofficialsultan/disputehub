// Use fetch to query the API
const baseUrl = 'http://localhost:3000';

async function test() {
  try {
    // Try to get disputes list (will need auth)
    const res = await fetch(`${baseUrl}/api/disputes`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
