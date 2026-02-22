# 🌐 CONNECTING DISPUTE-HUB.COM TO DISPUTEHUB

**Domain**: dispute-hub.com (GoDaddy)  
**Status**: Ready to connect  
**Date**: 2026-02-11

---

## 📋 DEPLOYMENT OPTIONS

You have 3 main options for deploying DisputeHub:

### Option 1: **Vercel** (Recommended - Fastest)
- ✅ Next.js optimized
- ✅ Automatic deployments
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Zero config needed

### Option 2: **Your Own Server** (VPS/Cloud)
- Digital Ocean, AWS, Azure, etc.
- More control
- Requires server management

### Option 3: **Netlify** (Alternative)
- Similar to Vercel
- Good Next.js support

---

## 🚀 RECOMMENDED: VERCEL DEPLOYMENT

I'll guide you through the **Vercel** approach (easiest and fastest):

---

## STEP 1: DEPLOY TO VERCEL

### 1.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (or email)

### 1.2 Deploy DisputeHub
```bash
# Install Vercel CLI
npm install -g vercel

# From your project directory
cd /Users/saedmohamed/disputehub

# Deploy
vercel
```

**During deployment, answer:**
- Set up and deploy? **Y**
- Which scope? **(Choose your account)**
- Link to existing project? **N**
- What's your project's name? **disputehub**
- In which directory is your code located? **./**
- Want to override the settings? **N**

### 1.3 Set Environment Variables
After deployment, add your environment variables:

```bash
# Add environment variables to Vercel
vercel env add DATABASE_URL
vercel env add CLERK_SECRET_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY
# ... (add all your env vars)
```

Or do it via Vercel Dashboard:
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add all your `.env` variables

---

## STEP 2: CONNECT GODADDY DOMAIN

### 2.1 Get Your Vercel Deployment URL
After deployment, you'll get a URL like:
```
https://disputehub-xxx.vercel.app
```

### 2.2 Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Add domain: `dispute-hub.com`
4. Also add: `www.dispute-hub.com`

### 2.3 Vercel Will Show You DNS Records
You'll see something like:

**For dispute-hub.com:**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For www.dispute-hub.com:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

---

## STEP 3: UPDATE GODADDY DNS

### 3.1 Log into GoDaddy
1. Go to [godaddy.com](https://godaddy.com)
2. Sign in
3. Go to **My Products**
4. Find `dispute-hub.com`
5. Click **DNS** (or **Manage DNS**)

### 3.2 Add DNS Records

**Delete any conflicting records first** (old A records for @)

Then add these records:

#### Record 1: Root Domain
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds (or default)
```

#### Record 2: WWW Subdomain
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds (or default)
```

### 3.3 Save Changes
- Click **Save** or **Add Record**
- Wait 5-10 minutes for DNS propagation

---

## STEP 4: VERIFY DOMAIN IN VERCEL

1. Go back to Vercel → Your Project → Domains
2. Wait for verification (usually 1-5 minutes)
3. Once verified, you'll see:
   - ✅ `dispute-hub.com` - Valid Configuration
   - ✅ `www.dispute-hub.com` - Valid Configuration

---

## STEP 5: TEST YOUR DOMAIN

After DNS propagates (5-60 minutes), test:

```bash
# Check DNS propagation
nslookup dispute-hub.com

# Or visit
https://dispute-hub.com
https://www.dispute-hub.com
```

---

## 🔒 SSL CERTIFICATE

Vercel automatically provisions an SSL certificate for your domain. You'll see:
- ✅ SSL Certificate: Valid
- 🔒 HTTPS will work automatically

---

## ⚙️ IMPORTANT: UPDATE YOUR APP CONFIGURATION

After domain is connected, update these files:

### 1. Update `next.config.mjs`
Add your production domain:

```javascript
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ... existing headers
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://dispute-hub.com https://www.dispute-hub.com"
          }
        ],
      },
    ];
  },
};
```

### 2. Update Clerk Dashboard
1. Go to [clerk.com](https://clerk.com) dashboard
2. Configure → **Domains**
3. Add production domain:
   - `https://dispute-hub.com`
   - `https://www.dispute-hub.com`

### 3. Update Environment Variables
Make sure your production environment variables are set in Vercel:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL` (use production database)
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

---

## 📊 DEPLOYMENT CHECKLIST

Before going live, ensure:

- [ ] All environment variables set in Vercel
- [ ] Production database configured
- [ ] Clerk domain added
- [ ] DNS records updated in GoDaddy
- [ ] SSL certificate valid
- [ ] Test the live site
- [ ] Check all API routes work
- [ ] Test document generation
- [ ] Test AI chat
- [ ] Test payments (Stripe)

---

## 🐛 TROUBLESHOOTING

### Domain not working?
```bash
# Check DNS propagation
dig dispute-hub.com
dig www.dispute-hub.com

# Or use online tool
https://dnschecker.org
```

### SSL Certificate not working?
- Wait 10-15 minutes
- Vercel provisions it automatically
- Check Vercel dashboard for status

### 502/504 Errors?
- Check Vercel function logs
- Ensure environment variables are set
- Check database connection

---

## 📈 MONITORING & ANALYTICS

Once live, add monitoring:

1. **Vercel Analytics**
   - Automatically enabled
   - View in Vercel dashboard

2. **Sentry** (Error Tracking)
   ```bash
   npm install @sentry/nextjs
   ```

3. **Google Analytics**
   - Add to `_app.tsx` or `layout.tsx`

---

## 🚀 PRODUCTION DEPLOYMENT COMMANDS

```bash
# Initial deployment
cd /Users/saedmohamed/disputehub
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel list

# View logs
vercel logs

# Roll back if needed
vercel rollback
```

---

## 💰 COSTS

**Vercel Pro Plan**: $20/month
- Includes:
  - Custom domains
  - Automatic SSL
  - 1000 GB bandwidth
  - Unlimited serverless functions
  - Team collaboration

**Free Plan** (for testing):
- 100 GB bandwidth
- Custom domains included
- Perfect for MVP launch

---

## 🎯 QUICK START COMMANDS

Run these now to get started:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project directory
cd /Users/saedmohamed/disputehub
vercel

# 4. Follow the prompts
# 5. Then add your domain in Vercel dashboard
# 6. Update GoDaddy DNS records
# 7. Wait 5-10 minutes
# 8. Visit https://dispute-hub.com 🎉
```

---

## 📞 NEXT STEPS

**Tell me when you're ready, and I can:**
1. ✅ Help you set up the deployment
2. ✅ Generate the exact DNS records you need
3. ✅ Walk through the Vercel setup
4. ✅ Configure your environment variables
5. ✅ Test the deployment

**Or if you prefer a different hosting platform** (AWS, DigitalOcean, etc.), let me know and I'll provide those instructions instead!

---

**Ready to deploy?** 🚀
