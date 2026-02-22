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
  
  // Check docs for case with N1
  const caseId = 'cmlcqr4pm0000s9o64n5cxalp';
  
  const result = await client.query(`
    SELECT gd.id, gd.type, gd.title, gd.status, 
           LENGTH(gd.content) as content_length,
           gd."lastError",
           gd."createdAt"
    FROM "GeneratedDocument" gd
    JOIN "DocumentPlan" dp ON gd."planId" = dp.id
    WHERE dp."caseId" = $1
    ORDER BY gd."order"
  `, [caseId]);
  
  console.log(`\n📄 Documents for case ${caseId}:\n`);
  for (const doc of result.rows) {
    const status = doc.status === 'COMPLETED' ? '✅' : '❌';
    console.log(`${status} ${doc.type}`);
    console.log(`   Title: ${doc.title}`);
    console.log(`   Status: ${doc.status}`);
    console.log(`   Length: ${doc.content_length || 0} chars`);
    if (doc.lastError) {
      console.log(`   Error: ${doc.lastError}`);
    }
    console.log('');
  }
  
  await client.end();
}

main().catch(console.error);
