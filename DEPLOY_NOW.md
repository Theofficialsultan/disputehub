# 🚀 DEPLOY DISPUTEHUB TO DISPUTE-HUB.COM

**Status**: Ready to deploy  
**Domain**: dispute-hub.com (GoDaddy)  
**Platform**: Vercel (Next.js optimized)

---

## ✅ PRE-DEPLOYMENT FIXES APPLIED

- ✅ Fixed `useAutosave.ts` → `useAutosave.tsx` (TypeScript error)
- ✅ Vercel CLI installed locally
- ✅ `vercel.json` configuration created
- ✅ Deployment script created

---

## 🎯 DEPLOYMENT STEPS (Follow Exactly)

### **Step 1: Login to Vercel**

Run this in your terminal:

```bash
cd /Users/saedmohamed/disputehub
npx vercel login
```

This will:
- Open your browser
- Ask you to verify your email
- Log you in

---

### **Step 2: Deploy to Vercel (Preview)**

```bash
npx vercel
```

**Answer the prompts:**
```
? Set up and deploy "~/disputehub"? [Y/n] → Y
? Which scope do you want to deploy to? → (Choose your account)
? Link to existing project? [y/N] → N
? What's your project's name? → disputehub
? In which directory is your code located? → ./
? Want to modify these settings? [y/N] → N
```

This will:
- ✅ Deploy to a preview URL (e.g., `disputehub-xxx.vercel.app`)
- ✅ Build your app
- ✅ Give you a deployment URL

**⚠️ Important**: This is a **preview deployment**. You'll deploy to production next.

---

### **Step 3: Add Environment Variables**

You have **2 options**:

#### Option A: Via Vercel Dashboard (Easier)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **disputehub** project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from your `.env` file:

```
DATABASE_URL = (your production database URL)
CLERK_SECRET_KEY = sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_...
ANTHROPIC_API_KEY = sk-ant-...
OPENAI_API_KEY = sk-...
STRIPE_SECRET_KEY = sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_...
NEXT_PUBLIC_APP_URL = https://dispute-hub.com
```

**Make sure to select**: ✅ Production ✅ Preview ✅ Development

#### Option B: Via CLI
```bash
npx vercel env add DATABASE_URL
# (paste your value when prompted)
# Repeat for each env var
```

---

### **Step 4: Deploy to Production**

Once environment variables are set:

```bash
npx vercel --prod
```

This will:
- ✅ Deploy to production
- ✅ Use your environment variables
- ✅ Give you a production URL
- ✅ Enable for custom domain

---

### **Step 5: Add Custom Domain in Vercel**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your **disputehub** project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `dispute-hub.com`
6. Click **Add**
7. Repeat for `www.dispute-hub.com`

**Vercel will show you the DNS records you need** (usually):
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

### **Step 6: Configure GoDaddy DNS**

1. **Login to GoDaddy**: [godaddy.com](https://godaddy.com)

2. **Go to Domain Management**:
   - Click **My Products**
   - Find `dispute-hub.com`
   - Click **DNS** or **Manage DNS**

3. **Delete Conflicting Records**:
   - Find any existing `A` record with name `@`
   - Find any existing `CNAME` record with name `www`
   - Delete them

4. **Add New Records**:

   **Record 1: Root Domain**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (or the IP Vercel gave you)
   TTL: 600 seconds
   ```

   **Record 2: WWW Subdomain**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600 seconds
   ```

5. **Save Changes**

---

### **Step 7: Wait for DNS Propagation**

DNS changes take **5-60 minutes** to propagate.

**Check status:**
```bash
# Check if DNS is updated
dig dispute-hub.com
dig www.dispute-hub.com

# Or use online tool
open https://dnschecker.org
```

---

### **Step 8: Verify Domain in Vercel**

1. Go back to Vercel → Your Project → Domains
2. You should see:
   - ✅ `dispute-hub.com` - Valid Configuration
   - ✅ `www.dispute-hub.com` - Valid Configuration
3. SSL certificate will be auto-provisioned (takes ~5 minutes)

---

### **Step 9: Update Clerk for Production Domain**

1. Go to [clerk.com](https://clerk.com) dashboard
2. Select your DisputeHub app
3. Go to **Domains**
4. Add production domains:
   - `https://dispute-hub.com`
   - `https://www.dispute-hub.com`

---

### **Step 10: Test Your Live Site**

Visit:
- https://dispute-hub.com
- https://www.dispute-hub.com

**Test these features:**
- [ ] Homepage loads
- [ ] Sign up / login works
- [ ] Create new case
- [ ] AI chat works
- [ ] Document generation works
- [ ] Evidence upload works
- [ ] Stripe checkout works

---

## 🔧 TROUBLESHOOTING

### Domain not working?
```bash
# Clear DNS cache (Mac)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Check DNS propagation
dig dispute-hub.com +short
```

### SSL Certificate issues?
- Wait 10-15 minutes
- Vercel auto-provisions Let's Encrypt
- Check Vercel dashboard for status

### Build failing on Vercel?
- Check Vercel build logs
- Ensure all environment variables are set
- Check Node version compatibility

### Database connection failing?
- Ensure `DATABASE_URL` points to **production database**
- Check database allows connections from Vercel IPs
- Run migrations: `npx prisma migrate deploy`

---

## 📝 QUICK COMMAND REFERENCE

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy to preview
npx vercel

# 3. Deploy to production
npx vercel --prod

# 4. Check deployment status
npx vercel list

# 5. View logs
npx vercel logs

# 6. Roll back deployment
npx vercel rollback
```

---

## 🎯 YOUR GODADDY DNS RECORDS (COPY-PASTE READY)

**After Vercel shows you the exact values**, update GoDaddy with:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

**⚠️ Note**: The IP might be different. **Use what Vercel gives you in the dashboard**.

---

## 🔐 SECURITY CHECKLIST

Before going live:

- [ ] Production database configured (not dev DB)
- [ ] All API keys are production keys (not test keys)
- [ ] Stripe is in live mode (not test mode)
- [ ] Clerk is configured for production domain
- [ ] Environment variables secured in Vercel
- [ ] No hardcoded secrets in code
- [ ] CORS headers configured

---

## 💰 VERCEL PRICING

**Hobby Plan (Free)**:
- ✅ Custom domains included
- ✅ Automatic SSL
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ⚠️ Limited to personal projects

**Pro Plan ($20/month)**:
- ✅ Commercial use allowed
- ✅ 1000 GB bandwidth
- ✅ Team collaboration
- ✅ Priority support
- ✅ Advanced analytics

**Recommendation**: Start with Hobby, upgrade to Pro when you get users.

---

## 🚀 DEPLOYMENT TIMELINE

```
Now           → Login to Vercel (1 minute)
+2 minutes    → Deploy preview (5-10 minutes)
+15 minutes   → Add env variables (5 minutes)
+20 minutes   → Deploy production (5 minutes)
+25 minutes   → Configure GoDaddy DNS (5 minutes)
+30 minutes   → Wait for DNS propagation (5-30 minutes)
+60 minutes   → Site live at dispute-hub.com ✅
```

**Total time**: ~1 hour

---

## 📞 NEXT ACTIONS

**Run these commands now:**

```bash
# Terminal 1: Stop current dev server (Ctrl+C)

# Terminal 2: Run deployment
cd /Users/saedmohamed/disputehub
npx vercel login
npx vercel
```

**Then:**
1. Add environment variables in Vercel dashboard
2. Deploy to production: `npx vercel --prod`
3. Configure GoDaddy DNS
4. Update Clerk domains
5. Test live site

---

## ✅ DEPLOYMENT READY

Your app is **ready to deploy**. The critical TypeScript error has been fixed.

**Start the deployment process now with:**

```bash
npx vercel login
```

🎯 **Let's get dispute-hub.com live!**
