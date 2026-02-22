/**
 * End-to-End Quick Letter Flow Test
 * Tests the complete wizard flow with different case types
 */

const BASE_URL = 'http://localhost:3001';

// Test cases for different dispute types
const TEST_CASES = [
  {
    name: 'Parking Fine',
    type: 'parking_fine',
    title: 'Unfair Parking Penalty Notice',
    description: `I received a parking penalty notice (PCN reference: AB123456) on 15th January 2026 while parked at High Street car park in London.

I was issued with a £100 fine claiming I overstayed my parking by 10 minutes. However, I have evidence that I paid for 2 hours of parking at 2:00 PM and returned to my vehicle at 3:55 PM, which is within my paid time.

The ticket machine was also malfunctioning that day - I had to try three times before it accepted my payment. Several other drivers complained about this issue on the same day.

I have the following evidence:
1. My parking receipt showing payment at 2:00 PM for 2 hours
2. CCTV footage request submitted showing I returned before 4:00 PM
3. Photos of the ticket machine displaying error messages
4. Witness statement from another driver who experienced the same issue

The PCN was issued at 4:05 PM but I was already in my car preparing to leave. The warden did not give me opportunity to show my valid ticket.

I believe this fine was issued unfairly and request it be cancelled immediately.`,
  },
  {
    name: 'Landlord Deposit Dispute',
    type: 'landlord',
    title: 'Unlawful Deposit Deduction',
    description: `I am disputing the deduction of £850 from my tenancy deposit by my former landlord, John Smith, for the property at 42 Oak Lane, Manchester, M1 2AB.

I vacated the property on 31st December 2025 after a 12-month tenancy. The deposit of £1,200 was protected with the DPS scheme.

The landlord has claimed deductions for:
- £400 for "carpet cleaning" - The carpets were professionally cleaned by me before leaving, I have the receipt
- £300 for "wall repainting" - Normal wear and tear after 12 months of occupation
- £150 for "garden maintenance" - The garden was left in the same condition as when I moved in

I conducted a full inventory check with photos when I moved in and again when I left. The condition was essentially identical, accounting for normal wear and tear.

The landlord failed to conduct a proper check-out inspection with me present, as required. He also did not provide an itemised list of deductions within the required 10-day period.

Evidence I have:
1. Move-in and move-out photos (dated)
2. Professional carpet cleaning receipt dated 29th December 2025
3. Copy of original inventory
4. Email correspondence showing landlord agreed property was in good condition

I request the full £850 be returned to me immediately.`,
  },
  {
    name: 'Consumer Rights - Faulty Product',
    type: 'consumer',
    title: 'Refund for Faulty Laptop',
    description: `I purchased a laptop from TechStore Ltd on 1st November 2025 for £1,299. The laptop developed a serious fault within 3 months of purchase.

The laptop's screen began flickering on 20th January 2026 and now shows horizontal lines across the display, making it unusable for work. This is clearly a manufacturing defect, not damage caused by me.

I contacted TechStore on 22nd January 2026 and was told I could only get a repair, not a refund. However, under the Consumer Rights Act 2015, goods must be of satisfactory quality and fit for purpose. A laptop that fails within 3 months clearly does not meet this standard.

I am entitled to reject the goods and receive a full refund as the fault occurred within 6 months of purchase (the burden of proof is on the retailer to prove the fault wasn't present at delivery).

I have:
1. Original receipt dated 1st November 2025
2. Photos and video of the screen fault
3. Email correspondence with TechStore
4. Expert opinion from local repair shop confirming manufacturing defect

I am seeking a full refund of £1,299 plus compensation for the inconvenience caused. TechStore has 14 days to respond before I escalate to trading standards and small claims court.`,
  },
];

async function testQuickLetterFlow(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Create dispute (simulating the start page)
    console.log('\n1. Creating dispute...');
    const createRes = await fetch(`${BASE_URL}/api/disputes/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'YOUR_AUTH_COOKIE_HERE' // Would need real auth
      },
      body: JSON.stringify({ mode: 'QUICK' }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      console.log(`   ❌ Failed to create dispute: ${createRes.status} - ${error}`);
      return { success: false, step: 'create', error };
    }

    const dispute = await createRes.json();
    console.log(`   ✅ Created dispute: ${dispute.id}`);

    // Step 2: Update with details (simulating wizard completion)
    console.log('\n2. Updating dispute details...');
    const updateRes = await fetch(`${BASE_URL}/api/disputes/${dispute.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'YOUR_AUTH_COOKIE_HERE'
      },
      body: JSON.stringify({
        type: testCase.type,
        title: testCase.title,
        description: testCase.description,
        evidenceFiles: [],
      }),
    });

    if (!updateRes.ok) {
      const error = await updateRes.text();
      console.log(`   ❌ Failed to update dispute: ${updateRes.status} - ${error}`);
      return { success: false, step: 'update', error };
    }

    console.log('   ✅ Updated dispute details');

    // Step 3: Generate AI preview
    console.log('\n3. Generating AI preview...');
    const analyzeRes = await fetch(`${BASE_URL}/api/disputes/${dispute.id}/analyze`, {
      method: 'POST',
      headers: { 'Cookie': 'YOUR_AUTH_COOKIE_HERE' },
    });

    if (!analyzeRes.ok) {
      const error = await analyzeRes.text();
      console.log(`   ❌ Failed to generate preview: ${analyzeRes.status} - ${error}`);
      return { success: false, step: 'analyze', error };
    }

    const analyzed = await analyzeRes.json();
    const preview = analyzed.aiPreview;

    console.log('   ✅ AI Preview generated:');
    console.log(`      - Strength: ${preview?.strength || 'N/A'}`);
    console.log(`      - Summary: ${(preview?.summary || '').substring(0, 100)}...`);
    console.log(`      - Key Points: ${preview?.keyPoints?.length || 0}`);

    return {
      success: true,
      disputeId: dispute.id,
      preview: preview,
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Quick Letter Flow - End-to-End Tests');
  console.log('======================================\n');
  console.log('Note: These tests require authentication.');
  console.log('Run manually in browser or use authenticated API calls.\n');

  // Print test cases for manual testing
  console.log('TEST CASES TO TRY MANUALLY:');
  console.log('===========================\n');

  TEST_CASES.forEach((tc, i) => {
    console.log(`${i + 1}. ${tc.name}`);
    console.log(`   Type: ${tc.type}`);
    console.log(`   Title: ${tc.title}`);
    console.log(`   Description length: ${tc.description.length} chars`);
    console.log('');
  });

  console.log('\nMANUAL TESTING STEPS:');
  console.log('=====================');
  console.log('1. Go to http://localhost:3001/disputes/start');
  console.log('2. Click "Quick Letter"');
  console.log('3. Select dispute type (parking_fine, landlord, or consumer)');
  console.log('4. Enter the title and description from test cases above');
  console.log('5. Skip evidence upload (optional)');
  console.log('6. Review and submit');
  console.log('7. Verify AI preview is generated with:');
  console.log('   - Strength indicator (weak/moderate/strong)');
  console.log('   - Case summary');
  console.log('   - Key points');
  console.log('   - Letter preview');
  console.log('');
  console.log('Expected results:');
  console.log('- Parking Fine: Should be MODERATE to STRONG (has evidence)');
  console.log('- Landlord Dispute: Should be STRONG (detailed + evidence)');
  console.log('- Consumer Rights: Should be STRONG (clear grounds + evidence)');
}

runAllTests();
