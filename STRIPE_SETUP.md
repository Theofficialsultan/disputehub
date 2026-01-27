# Stripe Payment Integration - Complete ✅

**Date:** January 23, 2026  
**Status:** Stripe one-time payments fully implemented

---

## ✅ What Was Implemented

### 1. Database Schema
**Added:**
- `PaymentStatus` enum (PENDING, COMPLETED, FAILED)
- `Payment` model (single source of truth for unlock status)
- Relations: User → Payment, Dispute → Payment

**Key Decision:** No `isPaid` field on Dispute. Payment table is the ONLY source of truth.

### 2. Payment Flow
```
User clicks "Unlock" button
↓
POST /api/disputes/[id]/checkout
  - Verify ownership
  - Check if already unlocked
  - Create Stripe Checkout session
  - Create Payment record (status: PENDING)
  - Return checkout URL
↓
Redirect to Stripe Checkout
↓
User completes payment
↓
Stripe webhook: checkout.session.completed
  - POST /api/webhooks/stripe
  - Verify signature
  - Update Payment (status: COMPLETED)
↓
User redirected back to preview page
↓
Check Payment.status === COMPLETED
  - If true: Show unlocked content
  - If false: Show locked content + CTA
```

### 3. Files Created

**Utilities (3 files):**
- `src/lib/stripe.ts` - Stripe client singleton
- `src/lib/pricing.ts` - Price constants (£9.99)
- `src/lib/payments.ts` - Payment query helpers

**API Routes (2 files):**
- `src/app/api/disputes/[id]/checkout/route.ts` - Create checkout session
- `src/app/api/webhooks/stripe/route.ts` - Handle Stripe webhooks

**Components (1 file):**
- `src/components/features/dispute-preview/UnlockButton.tsx` - Payment CTA

**Updated (2 files):**
- `prisma/schema.prisma` - Added Payment model
- `src/app/(dashboard)/disputes/[id]/preview/page.tsx` - Check payment status

---

## 🔧 Setup Instructions

### Step 1: Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test Mode** (toggle in top right)
3. Navigate to **Developers → API keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 2: Add Environment Variables

Add to `.env.local`:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here  # Get this in Step 3
```

### Step 3: Setup Webhook (Local Testing)

#### Option A: Stripe CLI (Recommended)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add to .env.local as STRIPE_WEBHOOK_SECRET
```

#### Option B: ngrok (Alternative)

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)

# Go to Stripe Dashboard → Developers → Webhooks
# Click "Add endpoint"
# URL: https://abc123.ngrok.io/api/webhooks/stripe
# Events: Select "checkout.session.completed" and "checkout.session.expired"
# Copy the webhook signing secret
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## 🧪 Testing the Payment Flow

### Test Cards

Use these test card numbers in Stripe Checkout:

| Card Number         | Result  |
|---------------------|---------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 9995 | Decline |

**Expiry:** Any future date (e.g., 12/34)  
**CVC:** Any 3 digits (e.g., 123)  
**ZIP:** Any 5 digits (e.g., 12345)

### Test Flow

1. **Create a dispute:**
   ```
   Go to /disputes/new
   Complete the wizard
   Generate preview
   ```

2. **Check locked state:**
   ```
   Preview page should show:
   ✓ Free summary
   ✓ First 3 key points
   🔒 Locked content (blurred)
   ✓ "Unlock Full Analysis - £9.99" button
   ```

3. **Click unlock button:**
   ```
   Should redirect to Stripe Checkout
   Mobile-optimized payment form
   ```

4. **Complete payment:**
   ```
   Use test card: 4242 4242 4242 4242
   Click "Pay"
   ```

5. **Verify webhook:**
   ```
   Check terminal for webhook event:
   "Payment completed: [payment_id] for dispute: [dispute_id]"
   ```

6. **Check unlocked state:**
   ```
   Redirected back to preview page
   Should show:
   ✓ Success message
   ✓ All key points visible
   ✓ Full dispute letter (no blur)
   ✓ Legal references (no blur)
   ✓ Submission guide (no blur)
   ✗ No unlock button
   ```

7. **Verify database:**
   ```bash
   npx prisma studio
   # Check Payment table
   # status should be "COMPLETED"
   ```

---

## 🔒 Security Features

### Implemented:

1. ✅ **Webhook Signature Verification**
   - Stripe signature validated on every webhook
   - Prevents unauthorized requests

2. ✅ **Ownership Checks**
   - User must own dispute to create checkout
   - Verified server-side before creating session

3. ✅ **Idempotency**
   - Webhook checks if payment already completed
   - Prevents double-processing

4. ✅ **No Client-Side Checks**
   - Unlock status checked server-side only
   - Payment.status is single source of truth

5. ✅ **Metadata Validation**
   - userId and disputeId stored in session metadata
   - Verified in webhook handler

### Prevents:

- ❌ Unauthorized access to locked content
- ❌ Double payments for same dispute
- ❌ Webhook replay attacks
- ❌ Client-side manipulation
- ❌ Payment without ownership

---

## 💰 Pricing

**Current:**
- £9.99 per dispute unlock
- One-time payment
- No subscription
- No refunds

**Configurable in:** `src/lib/pricing.ts`

```typescript
export const PRICING = {
  DISPUTE_UNLOCK: {
    amount: 999, // Change this to adjust price
    currency: "gbp",
    description: "Unlock full dispute analysis",
  },
};
```

---

## 🎨 UX Flow

### Before Payment:
```
[Free Summary] ✓
[First 3 Key Points] ✓
[🔒 Full Letter - Blurred]
[🔒 Legal References - Blurred]
[🔒 Submission Guide - Blurred]
[Unlock Button - £9.99] ← Active
```

### After Payment:
```
[Success Message] 🎉
[Full Summary] ✓
[All Key Points] ✓
[Full Letter - Unlocked] ✓
[Legal References - Unlocked] ✓
[Submission Guide - Unlocked] ✓
[No Unlock Button]
```

---

## 📊 Database Queries

### Check if Unlocked:
```typescript
import { isDisputeUnlocked } from "@/lib/payments";

const unlocked = await isDisputeUnlocked(disputeId);
```

### Get Payment:
```typescript
import { getDisputePayment } from "@/lib/payments";

const payment = await getDisputePayment(disputeId);
```

### Manual Query:
```typescript
const payment = await prisma.payment.findFirst({
  where: {
    disputeId: "xxx",
    status: "COMPLETED"
  }
});
```

---

## 🐛 Troubleshooting

### Issue: Webhook not firing

**Solution:**
```bash
# Check Stripe CLI is running
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook secret is correct in .env.local
echo $STRIPE_WEBHOOK_SECRET
```

### Issue: Payment completed but content still locked

**Solution:**
```bash
# Check Payment table in database
npx prisma studio

# Verify status is "COMPLETED"
# If stuck on "PENDING", webhook didn't fire
```

### Issue: "Dispute already unlocked" error

**Solution:**
```sql
-- Check for existing completed payment
SELECT * FROM "Payment" WHERE "disputeId" = 'xxx' AND status = 'COMPLETED';

-- If incorrect, delete and retry
DELETE FROM "Payment" WHERE id = 'xxx';
```

### Issue: Stripe signature verification failed

**Solution:**
```bash
# Regenerate webhook secret
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy new secret to .env.local
# Restart dev server
```

---

## 🚀 Production Deployment

### Step 1: Switch to Live Mode

1. Go to Stripe Dashboard
2. Toggle to **Live Mode**
3. Get live API keys (starts with `pk_live_` and `sk_live_`)

### Step 2: Create Production Webhook

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `checkout.session.expired`
4. Copy webhook signing secret

### Step 3: Update Environment Variables

In Vercel/production:
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 4: Test in Production

Use real card or Stripe test mode in production.

---

## 📈 Analytics & Monitoring

### Track in Database:

```sql
-- Total revenue
SELECT SUM(amount) / 100 as total_gbp 
FROM "Payment" 
WHERE status = 'COMPLETED';

-- Conversion rate
SELECT 
  COUNT(DISTINCT "disputeId") as total_disputes,
  COUNT(DISTINCT CASE WHEN status = 'COMPLETED' THEN "disputeId" END) as paid_disputes,
  (COUNT(DISTINCT CASE WHEN status = 'COMPLETED' THEN "disputeId" END) * 100.0 / COUNT(DISTINCT "disputeId")) as conversion_rate
FROM "Payment";

-- Failed payments
SELECT * FROM "Payment" WHERE status = 'FAILED';
```

### Stripe Dashboard:

- Revenue tracking
- Failed payment reasons
- Customer disputes/chargebacks
- Payment success rate

---

## 🔄 Edge Cases Handled

1. ✅ **User already paid:** Returns error, doesn't create new session
2. ✅ **Payment canceled:** User can retry, no payment record updated
3. ✅ **Webhook delayed:** Payment status checked on page load
4. ✅ **Multiple tabs:** Only one payment can complete per dispute
5. ✅ **Session expired:** Marked as FAILED in database

---

## 📝 Next Steps (Future Enhancements)

- [ ] PDF generation and download
- [ ] Email receipt after payment
- [ ] Refund handling
- [ ] Subscription model (unlimited disputes)
- [ ] Discount codes
- [ ] Payment history page
- [ ] Admin payment dashboard

---

**Status:** ✅ Stripe integration complete and ready for testing!

**Test it now:**
1. Add Stripe keys to `.env.local`
2. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Create a dispute and generate preview
4. Click "Unlock" and use test card: `4242 4242 4242 4242`
5. Verify content unlocks!
