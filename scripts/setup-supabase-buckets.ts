/**
 * Setup Supabase Storage Buckets
 * Run this script to create required buckets for DisputeHub
 * 
 * Usage: npx tsx scripts/setup-supabase-buckets.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupBuckets() {
  console.log("🚀 Setting up Supabase Storage buckets...\n");

  const bucketsToCreate = [
    {
      name: "documents",
      public: true,
      description: "Generated legal documents (PDFs)",
    },
    {
      name: "evidence",
      public: true,
      description: "User-uploaded evidence (images, PDFs)",
    },
  ];

  for (const bucket of bucketsToCreate) {
    console.log(`📦 Checking bucket: ${bucket.name}`);

    // Check if bucket exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const exists = existingBuckets?.some((b) => b.name === bucket.name);

    if (exists) {
      console.log(`✅ Bucket "${bucket.name}" already exists\n`);
      continue;
    }

    // Create bucket
    console.log(`📝 Creating bucket: ${bucket.name}`);
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ],
    });

    if (error) {
      console.error(`❌ Failed to create bucket "${bucket.name}":`, error.message);
    } else {
      console.log(`✅ Created bucket: ${bucket.name}\n`);
    }
  }

  console.log("✨ Supabase Storage setup complete!");
  console.log("\nBuckets created:");
  console.log("  • documents - For generated legal PDFs");
  console.log("  • evidence - For user-uploaded evidence files");
}

setupBuckets().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
