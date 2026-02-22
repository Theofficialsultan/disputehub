# Quick Letter Generation - Full Audit Report

**Date:** 12 February 2026  
**Auditor:** Achilles ⚔️

---

## Executive Summary

The Quick Letter system provides a streamlined 4-step wizard for generating legal letters. While functional, there are **significant gaps** that limit document quality and user success rates.

**Overall Grade: C+ (Needs Improvement)**

---

## Current System Overview

### Flow
1. User selects dispute type from HomeScreen
2. QuickLetterWizardScreen guides through 4 steps: Opponent → Incident → Resolution → Review
3. On submit: Create dispute → Submit quick letter data → Generate documents
4. User is redirected to DisputeDetail with generated documents

### Strengths ✅
- Simple, intuitive 4-step wizard
- Nice generation animation with progress feedback
- Deadline selection (7/14/21/28 days)
- Auto-confirms summary for immediate generation
- Good mobile UX

### Critical Issues ❌

---

## Issue #1: No Profile Check (CRITICAL)

**Problem:** Quick letter generates documents WITHOUT checking user profile completeness.

**Impact:** Documents contain `[YOUR NAME]` and `[YOUR ADDRESS]` placeholders.

**Fix Required:**
```typescript
// In quick-submit/route.ts - Add BEFORE generating:
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { firstName, lastName, addressLine1, city, postcode }
});

const missing = ['firstName','lastName','addressLine1','city','postcode']
  .filter(f => !user[f]);

if (missing.length > 0) {
  return NextResponse.json({
    error: "Profile incomplete",
    code: "PROFILE_INCOMPLETE",
    requiresProfileCompletion: true
  }, { status: 400 });
}
```

---

## Issue #2: caseSummary Format Mismatch (HIGH)

**Problem:** Quick letter builds `caseSummary` differently than AI chat system.

**Current Quick Letter Format:**
```json
{
  "facts": [{ "key": "opponent_name", "value": "ABC Ltd" }],
  "keyFacts": ["Dispute with: ABC Ltd"],
  "quickLetterData": { ... }
}
```

**Expected by Document Generation (System 3):**
```json
{
  "disputeType": "CONSUMER_GOODS",
  "parties": { "counterparty": "ABC Ltd", "counterpartyType": "RETAILER" },
  "financialAmount": 150,
  "keyFacts": ["I purchased...", "The product was faulty..."],
  "desiredOutcome": "Full refund"
}
```

**Impact:** Document generation helpers fail to extract data properly.

**Fix:** Rewrite `caseSummary` builder to match expected format:

```typescript
const caseSummary = {
  disputeType: data.disputeType || "OTHER",
  parties: {
    counterparty: data.opponentName,
    counterpartyType: inferCounterpartyType(data.disputeType),
  },
  financialAmount: parseFloat(data.amountClaimed) || null,
  timeline: {
    issueDate: data.incidentDate,
    keyEvents: [data.incidentDescription],
  },
  keyFacts: buildKeyFacts(data),
  desiredOutcome: data.desiredOutcome,
  chosenForum: null, // Let System 2 decide
};
```

---

## Issue #3: No Dispute Type Inference (MEDIUM)

**Problem:** `disputeType` comes from route params but is often undefined.

**Impact:** Documents use generic templates instead of specialized ones.

**Fix:** Add dispute type inference from description:

```typescript
function inferDisputeType(description: string): string {
  const lower = description.toLowerCase();
  
  if (lower.includes('parking') || lower.includes('pcn')) return 'PARKING';
  if (lower.includes('refund') || lower.includes('faulty')) return 'CONSUMER_GOODS';
  if (lower.includes('wage') || lower.includes('paid')) return 'UNPAID_WAGES';
  if (lower.includes('deposit') || lower.includes('landlord')) return 'TENANCY_DEPOSIT';
  if (lower.includes('dismiss') || lower.includes('sacked')) return 'UNFAIR_DISMISSAL';
  if (lower.includes('insurance')) return 'INSURANCE';
  
  return 'OTHER';
}
```

---

## Issue #4: Missing Evidence Handling (MEDIUM)

**Problem:** Quick letter has no evidence upload step.

**Impact:** Generated letters reference no supporting evidence.

**Options:**
1. **Quick fix:** Add optional evidence step before Review
2. **Better:** Show "Add Evidence" prompt after generation
3. **Best:** Allow evidence upload during wizard (photo, document)

---

## Issue #5: No Amount Validation (LOW)

**Problem:** Amount claimed accepts any input including invalid values.

**Current:** `v.replace(/[^0-9.]/g, '')` but doesn't validate result.

**Fix:**
```typescript
const validateAmount = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 100000000;
};
```

---

## Issue #6: Generic Document Selection (HIGH)

**Problem:** Always generates the same document type regardless of dispute.

**Current behavior:** Generates `UK-LBA-GENERAL` for everything.

**Should:** Select appropriate document based on dispute type:

| Dispute Type | Recommended Document |
|--------------|---------------------|
| PARKING | UK-POPLA-PARKING-APPEAL or Parking Challenge Letter |
| CONSUMER_GOODS | UK-REFUND-REQUEST-LETTER → UK-LBA-GENERAL |
| UNPAID_WAGES | UK-GRIEVANCE-LETTER → UK-LBA-GENERAL |
| TENANCY_DEPOSIT | UK-DEMAND-LETTER-GENERAL → UK-LBA-GENERAL |
| INSURANCE | UK-INSURANCE-CLAIM-LETTER → UK-LBA-GENERAL |

**Fix:** Use tier classification system:
```typescript
import { getDocumentsForCategoryAndTier, getRecommendedTier } from '@/lib/legal/tier-classification';

const tier = getRecommendedTier(disputeType);
const documents = getDocumentsForCategoryAndTier(disputeType, tier);
// Generate first appropriate document
```

---

## Issue #7: No Date Validation (LOW)

**Problem:** Incident date accepts free-form text like "last week".

**Fix:** Add date picker or validate format:
```typescript
const isValidDate = (str: string): boolean => {
  // Accept: 15/01/2026, 15 January 2026, 2026-01-15
  const patterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i,
    /^\d{4}-\d{2}-\d{2}$/
  ];
  return patterns.some(p => p.test(str.trim()));
};
```

---

## Issue #8: No Legal Warnings (MEDIUM)

**Problem:** No warnings about time limits or prerequisites.

**Examples:**
- Employment Tribunal: 3 months minus 1 day from dismissal
- ACAS: Required before ET claim
- Parking: Usually 28 days to appeal
- Consumer: 6 years limitation

**Fix:** Add warnings based on dispute type:
```typescript
const LEGAL_WARNINGS = {
  UNFAIR_DISMISSAL: "⚠️ You have 3 months minus 1 day from dismissal to file with Employment Tribunal. ACAS Early Conciliation is required first.",
  PARKING: "⚠️ You typically have 28 days to appeal a parking charge. Check your notice for exact deadline.",
  CONSUMER_GOODS: "⚠️ You have 6 years to bring a claim for faulty goods (5 in Scotland).",
};
```

---

## Issue #9: No Opponent Address Lookup (ENHANCEMENT)

**Problem:** User must manually enter opponent address.

**Enhancement:** Integrate known contacts database:
```typescript
import { KNOWN_CONTACTS } from '@/data/knownContacts';

// Auto-suggest when typing company name
const suggestions = KNOWN_CONTACTS.filter(c => 
  c.name.toLowerCase().includes(opponentName.toLowerCase())
);
```

---

## Issue #10: Missing Case Law Integration (MEDIUM)

**Problem:** Quick letters don't include case law citations.

**Fix:** Already implemented in main generation but not flowing through quick letter path.

Ensure `disputeType` is passed correctly so `getCasesForDisputeType()` returns relevant cases.

---

## Recommended Priority Order

### Immediate (Before Next Release)
1. ❌ **Profile check** - Prevents broken documents
2. ❌ **caseSummary format fix** - Core data flow issue
3. ❌ **Document type selection** - Wrong documents generated

### High Priority
4. ⚠️ **Dispute type inference** - Better document quality
5. ⚠️ **Legal warnings** - User awareness
6. ⚠️ **Case law integration** - Professional documents

### Medium Priority
7. 📝 Evidence handling
8. 📝 Known contacts integration
9. 📝 Date validation

### Low Priority
10. 💡 Amount validation
11. 💡 UI polish

---

## Code Changes Required

### File: `/api/disputes/[id]/quick-submit/route.ts`

```typescript
// ADD: Profile check (lines ~35)
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { firstName: true, lastName: true, addressLine1: true, city: true, postcode: true }
});

if (!user?.firstName || !user?.lastName || !user?.addressLine1 || !user?.city || !user?.postcode) {
  return NextResponse.json({
    error: "Profile incomplete",
    code: "PROFILE_INCOMPLETE",
    message: "Complete your profile before generating documents",
    requiresProfileCompletion: true
  }, { status: 400 });
}

// REPLACE: caseSummary builder (lines ~55-90)
const inferredType = data.disputeType || inferDisputeType(data.incidentDescription);

const caseSummary = {
  disputeType: inferredType,
  parties: {
    counterparty: data.opponentName,
    counterpartyType: inferCounterpartyType(inferredType),
  },
  financialAmount: data.amountClaimed ? parseFloat(data.amountClaimed) : null,
  timeline: {
    issueDate: data.incidentDate || new Date().toISOString().split('T')[0],
    keyEvents: [
      data.incidentDescription.substring(0, 500),
    ],
  },
  keyFacts: [
    `The other party is: ${data.opponentName}`,
    data.opponentAddress ? `Their address is: ${data.opponentAddress}` : null,
    `What happened: ${data.incidentDescription.substring(0, 300)}`,
    data.amountClaimed ? `Amount in dispute: £${data.amountClaimed}` : null,
    data.incidentDate ? `This occurred on: ${data.incidentDate}` : null,
    data.incidentLocation ? `Location: ${data.incidentLocation}` : null,
  ].filter(Boolean),
  desiredOutcome: data.desiredOutcome,
  chosenForum: null,
};
```

### File: `QuickLetterWizardScreen.tsx`

```typescript
// ADD: Handle profile incomplete error in handleSubmit
} catch (error: any) {
  if (error.body?.code === 'PROFILE_INCOMPLETE') {
    Alert.alert(
      'Complete Your Profile',
      'Your name and address are required for legal documents.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Complete Profile', onPress: () => navigation.navigate('ProfileCompletion') }
      ]
    );
    return;
  }
  // ... existing error handling
}

// ADD: Legal warning on Review step
const getLegalWarning = (disputeType: string): string | null => {
  const warnings: Record<string, string> = {
    UNFAIR_DISMISSAL: "⚠️ Time limit: 3 months minus 1 day from dismissal",
    PARKING: "⚠️ Appeals usually must be made within 28 days",
    // ...
  };
  return warnings[disputeType] || null;
};
```

---

## Testing Checklist

After implementing fixes:

- [ ] Quick letter with complete profile → Documents have real name/address
- [ ] Quick letter with incomplete profile → Shows profile completion prompt
- [ ] Parking dispute → Generates parking-specific letter
- [ ] Consumer goods dispute → Generates refund/complaint letter
- [ ] Employment dispute → Shows ACAS warning
- [ ] Amount validation rejects "abc" and negative numbers
- [ ] Known company name auto-suggests address
- [ ] Generated documents include relevant case law

---

## Conclusion

The Quick Letter system has good UX but **poor data quality**. The main issues are:

1. Profile data not validated → broken documents
2. caseSummary format wrong → extraction failures
3. No dispute-specific routing → wrong document types

With the fixes above, document quality should improve significantly.

**Estimated effort:** 4-6 hours for critical fixes, 2-3 days for full implementation.
