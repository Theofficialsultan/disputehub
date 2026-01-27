# Paywall Bypass (Development Only)

## Purpose

Allows testing of full AI output without completing Stripe payments during development.

---

## How to Enable

Add to `.env` or `.env.local`:

```bash
BYPASS_PAYWALL=true
```

Restart dev server:
```bash
npm run dev
```

---

## How It Works

### Single Point of Control

The bypass is implemented in **one place only**:

**File:** `src/lib/payments.ts`  
**Function:** `isDisputeUnlocked()`

```typescript
export async function isDisputeUnlocked(disputeId: string): Promise<boolean> {
  // DEV ONLY: Bypass paywall for testing
  if (process.env.BYPASS_PAYWALL === "true") {
    return true; // All disputes appear unlocked
  }

  // Production: Check for completed payment
  const payment = await prisma.payment.findFirst({
    where: { disputeId, status: "COMPLETED" }
  });

  return !!payment;
}
```

### What Happens When Enabled

- ✅ All disputes appear unlocked
- ✅ Full AI output visible (no blur)
- ✅ No "Unlock" button shown
- ✅ Console log: "⚠️ PAYWALL BYPASSED (dev mode)"

### What Remains Unchanged

- ❌ Stripe checkout logic (still exists)
- ❌ Payment webhook handler (still works)
- ❌ Payment database table (still tracks payments)
- ❌ Unlock button component (still functional)

---

## Safety Features

### Server-Side Only
- Env var checked on server
- Cannot be bypassed from browser
- No client-side code changes

### Explicit Opt-In
- Must set to exact string `"true"`
- `BYPASS_PAYWALL=false` → paywall active
- `BYPASS_PAYWALL=1` → paywall active
- Missing env var → paywall active

### Production Safe
- Requires explicit configuration
- Default behavior: paywall active
- Easy to verify: check env var

### Audit Trail
- Console logs every bypass
- Easy to spot in development logs
- Clear warning emoji (⚠️)

---

## Testing Scenarios

### Test AI Output (Bypass Enabled)
```bash
# 1. Set bypass
BYPASS_PAYWALL=true

# 2. Create dispute
# 3. Generate preview
# 4. See full output immediately (no payment)
```

### Test Payment Flow (Bypass Disabled)
```bash
# 1. Remove or set to false
BYPASS_PAYWALL=false

# 2. Create dispute
# 3. Generate preview
# 4. Content locked → Click unlock → Stripe checkout
```

---

## How to Remove (Production)

### Option 1: Delete Env Var
Simply don't set `BYPASS_PAYWALL` in production environment.

### Option 2: Remove Code (Later)
When ready to remove bypass entirely:

1. Delete the bypass check from `src/lib/payments.ts`:
```typescript
// DELETE THESE LINES:
if (process.env.BYPASS_PAYWALL === "true") {
  console.log("⚠️  PAYWALL BYPASSED (dev mode) for dispute:", disputeId);
  return true;
}
```

2. Delete this file: `PAYWALL_BYPASS.md`

3. Remove from `.env.local.example`:
```bash
# DELETE THESE LINES:
# Development Only - Paywall Bypass
BYPASS_PAYWALL=false
```

---

## Verification Checklist

### Before Deploying to Production

- [ ] `BYPASS_PAYWALL` is NOT set in production env vars
- [ ] Stripe keys are production keys (not test)
- [ ] Test payment flow works in production
- [ ] Locked content shows correctly
- [ ] Unlock button appears for locked disputes

### In Development

- [ ] Bypass works when `BYPASS_PAYWALL=true`
- [ ] Paywall works when `BYPASS_PAYWALL=false`
- [ ] Console shows bypass warnings
- [ ] Stripe logic still intact

---

## Current Implementation

**Location:** `src/lib/payments.ts` (line ~10)  
**Scope:** Single function only  
**Impact:** All calls to `isDisputeUnlocked()`  
**Used by:**
- Preview page (show/hide locked content)
- Checkout route (prevent duplicate payment)
- Any future features checking unlock status

---

## Example Usage

### Development with Bypass
```bash
# .env
BYPASS_PAYWALL=true
STRIPE_SECRET_KEY=sk_test_... # Still required for checkout route
```

Result: Full AI output visible, no payment required

### Development without Bypass
```bash
# .env
BYPASS_PAYWALL=false
STRIPE_SECRET_KEY=sk_test_...
```

Result: Normal paywall behavior, Stripe checkout required

### Production
```bash
# .env (production)
# BYPASS_PAYWALL not set
STRIPE_SECRET_KEY=sk_live_... # Live keys
```

Result: Normal paywall behavior, real payments

---

**Status:** ✅ Implemented  
**Risk Level:** Low (single point of control, explicit opt-in)  
**Removal Effort:** Minimal (delete 4 lines of code)
