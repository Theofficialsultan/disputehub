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
  
  const result = await client.query(`
    SELECT d.id, d.title, d.phase, dp."allowedDocuments", dp.id as plan_id,
           (SELECT COUNT(*) FROM "GeneratedDocument" gd WHERE gd."planId" = dp.id) as doc_count
    FROM "Dispute" d
    LEFT JOIN "DocumentPlan" dp ON dp."caseId" = d.id
    WHERE d.phase IN ('COMPLETED', 'GENERATING')
    ORDER BY d."updatedAt" DESC
    LIMIT 5
  `);
  
  console.log('Cases found:', result.rows.length);
  for (const row of result.rows) {
    console.log(`\n📋 ${row.title}`);
    console.log(`   ID: ${row.id}`);
    console.log(`   Phase: ${row.phase}`);
    console.log(`   Docs: ${row.doc_count}`);
    if (row.allowedDocuments) {
      console.log(`   Allowed: ${JSON.stringify(row.allowedDocuments)}`);
    }
  }
  
  await client.end();
}

main().catch(console.error);
