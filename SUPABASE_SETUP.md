# 🗄️ SUPABASE STORAGE SETUP

DisputeHub requires Supabase Storage for:
1. **Generated legal documents** (PDFs)
2. **User-uploaded evidence** (images, PDFs)

---

## 🔧 SETUP INSTRUCTIONS

### Step 1: Get Supabase Credentials

1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (secret key, starts with `eyJ...`)

### Step 2: Update .env File

Add these to your `.env` file:

```env
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important:** Use the **Service Role Key**, not the Anon Key!

### Step 3: Create Storage Buckets

Run the setup script:

```bash
npx tsx scripts/setup-supabase-buckets.ts
```

This will create two buckets:
- `documents` - For generated legal PDFs
- `evidence` - For user-uploaded evidence files

**OR** manually create them in Supabase Dashboard:

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Create bucket: `documents`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`
4. Create bucket: `evidence`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## ✅ VERIFICATION

Test evidence upload:
1. Navigate to a case
2. Click Evidence section
3. Upload an image or PDF
4. Should see success message
5. Evidence appears with index #1

Test document generation:
1. Complete a case conversation
2. Documents start generating
3. PDFs appear in right panel
4. Download buttons work

---

## 🚨 TROUBLESHOOTING

### Error: "Failed to upload file"

**Cause:** Buckets don't exist in Supabase

**Solution:** Run `npx tsx scripts/setup-supabase-buckets.ts`

### Error: "Missing Supabase credentials"

**Cause:** .env file missing keys

**Solution:** Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Unauthorized"

**Cause:** Using Anon Key instead of Service Role Key

**Solution:** Use the Service Role Key from Supabase Settings → API

---

## 📁 BUCKET STRUCTURE

After setup, your Supabase Storage will have:

```
documents/
  └── cases/
      └── {caseId}/
          └── documents/
              ├── FORMAL_LETTER_1234567890.pdf
              ├── EVIDENCE_SCHEDULE_1234567891.pdf
              └── TIMELINE_1234567892.pdf

evidence/
  └── cases/
      └── {caseId}/
          └── evidence/
              ├── 1234567890-abc123.jpg
              ├── 1234567891-def456.png
              └── 1234567892-ghi789.pdf
```

---

## 🔐 SECURITY

**Service Role Key:**
- ⚠️ **NEVER commit to git**
- ⚠️ **NEVER expose to client**
- ✅ Only use server-side
- ✅ Store in .env (gitignored)

**Public Buckets:**
- ✅ Required for PDF embedding
- ✅ Files are not listed publicly
- ✅ Only accessible via direct URL
- ✅ URLs are hard to guess (random strings)

---

**Setup complete!** Your DisputeHub instance can now upload evidence and generate court-ready PDFs. 🎉
