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
  
  // Get actual generated document content
  const result = await client.query(`
    SELECT gd.type, gd.title, gd.status, 
           SUBSTRING(gd.content, 1, 2000) as content_preview,
           LENGTH(gd.content) as total_length
    FROM "GeneratedDocument" gd
    WHERE gd.status = 'COMPLETED'
    ORDER BY gd."createdAt" DESC
    LIMIT 3
  `);
  
  for (const doc of result.rows) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${doc.type} (${doc.total_length} chars)`);
    console.log(`${'='.repeat(60)}`);
    console.log(doc.content_preview);
    console.log(`\n... [truncated]`);
    
    // Check for placeholders in content
    const placeholders = doc.content_preview?.match(/\[.*?\]|_______/g);
    if (placeholders && placeholders.length > 0) {
      console.log(`\n⚠️  Found ${placeholders.length} placeholders: ${placeholders.slice(0,5).join(', ')}`);
    } else {
      console.log(`\n✅ No obvious placeholders found`);
    }
  }
  
  await client.end();
}

main().catch(console.error);
