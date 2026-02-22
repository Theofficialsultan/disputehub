# 🔐 ENVIRONMENT VARIABLES CHECKLIST FOR VERCEL

**Copy each variable from your `.env` file to Vercel Dashboard**

---

## 📋 REQUIRED ENVIRONMENT VARIABLES (23 total)

### 🗄️ Database
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct database connection (Prisma)

### 🔐 Authentication (Clerk)
- [ ] `CLERK_SECRET_KEY` - Server-side Clerk key
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Client-side Clerk key
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - `/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - `/disputes`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - `/disputes`

### 🤖 AI Services
- [ ] `ANTHROPIC_API_KEY` - Claude Opus 4 (System A, D)
- [ ] `OPENAI_API_KEY` - GPT-4o (System B)
- [ ] `XAI_API_KEY` - Grok (if using)
- [ ] `XAI_CONSUMER_KEY` - Grok consumer key
- [ ] `XAI_SECRET_KEY` - Grok secret key

### 💳 Payments (Stripe)
- [ ] `STRIPE_SECRET_KEY` - Server-side Stripe key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### 📦 Storage (Supabase)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

### 📄 PDF Services
- [ ] `PDF_API_KEY` - PDF generation API key
- [ ] `PDF_API_MODE` - `production` or `test`

### 🌐 App Configuration
- [ ] `NEXT_PUBLIC_APP_URL` - **SET TO**: `https://dispute-hub.com`
- [ ] `BYPASS_PAYWALL` - `false` (for production)

---

## ⚙️ HOW TO ADD IN VERCEL

### Via Dashboard (Recommended):
1. Go to https://vercel.com/dashboard
2. Click **disputehub** project
3. **Settings** → **Environment Variables**
4. For each variable:
   - Click **Add New**
   - Enter **Key** (e.g., `DATABASE_URL`)
   - Enter **Value** (copy from your .env)
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

### Via CLI:
```bash
npx vercel env add DATABASE_URL
# Paste value when prompted
# Choose: Production, Preview, Development
# Repeat for each variable
```

---

## 🚨 PRODUCTION-SPECIFIC VALUES

**These should be DIFFERENT from your local dev values:**

### 1. `DATABASE_URL`
```
# Local (dev): postgres://localhost:5432/disputehub
# Production: postgres://production-host/disputehub?sslmode=require
```

### 2. `NEXT_PUBLIC_APP_URL`
```
# Local: http://localhost:3000
# Production: https://dispute-hub.com
```

### 3. `STRIPE_SECRET_KEY`
```
# Local: sk_test_...
# Production: sk_live_...
```

### 4. `BYPASS_PAYWALL`
```
# Local: true (for testing)
# Production: false
```

---

## ✅ VERIFICATION CHECKLIST

After adding all variables:

- [ ] 23 environment variables added
- [ ] All marked for **Production**
- [ ] Production DATABASE_URL uses production database
- [ ] NEXT_PUBLIC_APP_URL = `https://dispute-hub.com`
- [ ] Stripe keys are **live mode** (not test)
- [ ] BYPASS_PAYWALL = `false`
- [ ] Clerk keys match your production Clerk app

---

## 🔄 AFTER ADDING VARIABLES

**Redeploy:**
```bash
npx vercel --prod
```

This will:
- ✅ Use new environment variables
- ✅ Rebuild the app
- ✅ Deploy to production

---

## 🎯 READY TO CONFIGURE?

**Your checklist:**
1. ✅ Fixed TypeScript error (useAutosave.tsx)
2. ✅ Vercel CLI installed
3. ✅ vercel.json created
4. ⏳ **Next**: Login and deploy

**Run this now:**
```bash
cd /Users/saedmohamed/disputehub
npx vercel login
```

Then follow the prompts! 🚀
