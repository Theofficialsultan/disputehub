import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.zejcceqpltluyypyvkoo',
  password: 'Xauusd21!!?',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  const caseId = 'cmlcqr4pm0000s9o64n5cxalp';
  
  // Delete failed N1 document so it regenerates
  const delResult = await client.query(`
    DELETE FROM "GeneratedDocument" gd
    USING "DocumentPlan" dp
    WHERE gd."planId" = dp.id
    AND dp."caseId" = $1
    AND gd.type = 'UK-N1-COUNTY-COURT-CLAIM'
    RETURNING gd.id
  `, [caseId]);
  
  console.log(`Deleted ${delResult.rowCount} failed docs`);
  
  // Set phase back to GENERATING to trigger regeneration
  await client.query(`
    UPDATE "Dispute" 
    SET phase = 'ROUTING', "chatLocked" = false
    WHERE id = $1
  `, [caseId]);
  
  console.log(`Reset case to ROUTING phase`);
  console.log(`\n🔗 Go to: http://localhost:3000/disputes/${caseId}/case`);
  console.log(`   Then click "Generate Docs" to test the fix`);
  
  await client.end();
}

main().catch(console.error);
