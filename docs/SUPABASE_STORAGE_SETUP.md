# Supabase Storage Setup Guide

## Prerequisites
- Active Supabase project
- Access to Supabase Dashboard

## Step 1: Create Storage Bucket

1. Navigate to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/storage/buckets
2. Click "New bucket"
3. Configuration:
   - **Name**: `documents`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 10 MB
   - **Allowed MIME types**: application/pdf

## Step 2: Set Storage Policies

Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/storage/policies

Run these SQL commands in the SQL Editor:

```sql
-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'cases'
);

-- Policy 2: Public read access
CREATE POLICY "Public can read documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy 3: Users can delete their own documents
CREATE POLICY "Users can delete their documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

## Step 3: Get API Keys

1. Navigate to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/settings/api
2. Copy these values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep secret!)

## Step 4: Update .env File

Add to `/Users/saedmohamed/disputehub/.env`:

```bash
# Supabase Storage (Block 3C)
NEXT_PUBLIC_SUPABASE_URL=https://zejcceqpltluyypyvkoo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **IMPORTANT**: Never commit the service role key to git!

## Step 5: Test Connection

Create a test file: `test-supabase.ts`

```typescript
import { supabaseStorage } from "@/lib/storage/supabase";

async function testConnection() {
  const { data, error } = await supabaseStorage.storage
    .from("documents")
    .list("cases");

  if (error) {
    console.error("❌ Connection failed:", error);
  } else {
    console.log("✅ Connection successful!", data);
  }
}

testConnection();
```

## Troubleshooting

### Error: "Bucket not found"
- Verify bucket name is exactly `documents`
- Check bucket was created successfully

### Error: "Permission denied"
- Verify storage policies are active
- Check service role key is correct

### Error: "Invalid API key"
- Regenerate keys from Supabase dashboard
- Ensure no extra spaces in .env file

## File Structure

Documents will be stored as:
```
/documents
  /cases
    /{caseId}
      /documents
        /FORMAL_LETTER_1738012345678.pdf
        /EVIDENCE_SCHEDULE_1738012345679.pdf
        ...
```

## Next Steps

After setup is complete:
1. Restart dev server: `npm run dev`
2. Test document generation: `POST /api/disputes/[id]/documents/generate`
3. Check Supabase Storage dashboard to see uploaded PDFs
