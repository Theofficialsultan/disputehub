# Full AI Generation Flow

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: CREATE DISPUTE                   │
└─────────────────────────────────────────────────────────────┘

User fills wizard
  ↓
POST /api/disputes/new
  ↓
Dispute created (status: DRAFT)
  ↓
Redirect to /disputes/[id]


┌─────────────────────────────────────────────────────────────┐
│                  PHASE 2: GENERATE PREVIEW                   │
└─────────────────────────────────────────────────────────────┘

User clicks "Generate Preview"
  ↓
POST /api/disputes/[id]/analyze
  ↓
Check if aiPreview exists
  ├─ EXISTS → Return cached
  └─ NULL → Generate via AI
       ↓
       OpenAI GPT-4o-mini
       ↓
       Parse response
       ↓
       Save to dispute.aiPreview
  ↓
Redirect to /disputes/[id]/preview
  ↓
Show: Summary + 3 key points + locked sections
  ↓
Cost: £0.002


┌─────────────────────────────────────────────────────────────┐
│              PHASE 3A: UNLOCK (PAYMENT)                      │
└─────────────────────────────────────────────────────────────┘

User clicks "Unlock Full Analysis"
  ↓
POST /api/disputes/[id]/checkout
  ↓
Create Stripe session
  ↓
Redirect to Stripe
  ↓
User pays £9.99
  ↓
Stripe webhook → Payment.status = COMPLETED
  ↓
Redirect to /disputes/[id]/preview?success=true


┌─────────────────────────────────────────────────────────────┐
│            PHASE 3B: UNLOCK (BYPASS - DEV ONLY)              │
└─────────────────────────────────────────────────────────────┘

BYPASS_PAYWALL=true in .env
  ↓
All content unlocked immediately
  ↓
No Stripe interaction


┌─────────────────────────────────────────────────────────────┐
│                PHASE 4: GENERATE FULL ANALYSIS               │
└─────────────────────────────────────────────────────────────┘

Page loads with isUnlocked=true
  ↓
FullAnalysisLoader component mounts
  ↓
Check if aiFullAnalysis exists
  ├─ EXISTS → Display cached content
  └─ NULL → Trigger generation
       ↓
       Show loader: "Generating your full dispute letter..."
       ↓
       POST /api/disputes/[id]/generate-full
       ↓
       Check authorization:
         - Payment COMPLETED?
         - OR BYPASS_PAYWALL=true?
       ↓
       Generate via AI:
         - Full letter (800-1500 words)
         - Legal grounds (3-5 items)
         - Legal references (3-5 items)
         - Next steps (5-7 items)
       ↓
       OpenAI GPT-4o-mini (2500 tokens)
       ↓
       Parse response
       ↓
       Save to dispute.aiFullAnalysis
       ↓
       Return updated dispute
       ↓
       Page auto-refreshes
       ↓
       Display real content
  ↓
Cost: £0.005


┌─────────────────────────────────────────────────────────────┐
│                  PHASE 5: VIEW CONTENT                       │
└─────────────────────────────────────────────────────────────┘

User sees:
  ✓ Full professional dispute letter
  ✓ Legal grounds (3-5 expanded arguments)
  ✓ Legal references (3-5 UK laws)
  ✓ Next steps (5-7 actionable items)

User can:
  ✓ Copy letter for submission
  ✓ Review legal grounds
  ✓ Follow next steps
  ✓ (Future: Download PDF)


┌─────────────────────────────────────────────────────────────┐
│                   PHASE 6: REVISIT                           │
└─────────────────────────────────────────────────────────────┘

User returns to /disputes/[id]/preview
  ↓
Check aiFullAnalysis
  ↓
EXISTS (cached)
  ↓
Display content immediately (<100ms)
  ↓
No AI call, no cost
```

---

## Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHORIZATION CHECK (CRITICAL)                  │
└─────────────────────────────────────────────────────────────┘

Request to generate-full endpoint
  ↓
Check 1: User authenticated?
  ├─ NO → 401 Unauthorized
  └─ YES → Continue
       ↓
Check 2: User owns dispute?
  ├─ NO → 403 Forbidden
  └─ YES → Continue
       ↓
Check 3: Payment completed?
  ├─ Query Payment table
  ├─ WHERE disputeId = [id]
  ├─ AND status = COMPLETED
  ├─ Result: isUnlocked = true/false
  └─ Continue
       ↓
Check 4: Bypass enabled?
  ├─ process.env.BYPASS_PAYWALL === "true"
  └─ bypassEnabled = true/false
       ↓
Final Check: isUnlocked OR bypassEnabled?
  ├─ NO → 403 Payment required
  └─ YES → Generate full analysis
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LOGIC                             │
└─────────────────────────────────────────────────────────────┘

Request 1 (First time):
  ↓
  Check dispute.aiFullAnalysis
  ↓
  NULL (not cached)
  ↓
  Generate via AI
    - Cost: £0.005
    - Time: 10-15 seconds
  ↓
  Save to database
  ↓
  Return content

Request 2+ (Subsequent):
  ↓
  Check dispute.aiFullAnalysis
  ↓
  EXISTS (cached)
  ↓
  Return cached content
    - Cost: £0.00
    - Time: <100ms
  ↓
  Display immediately

Savings: 99% cost reduction on revisits
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA STRUCTURE                          │
└─────────────────────────────────────────────────────────────┘

Dispute Model:
{
  id: "clx123...",
  title: "Parking Fine Appeal",
  description: "User's detailed description...",
  type: "parking_fine",
  evidenceFiles: [
    { name: "permit.jpg", size: 123456, ... },
    { name: "timestamp.jpg", size: 234567, ... }
  ],
  
  // Preview (Phase 2)
  aiPreview: {
    summary: "4-5 sentence analysis...",
    keyPoints: ["Point 1", "Point 2", ...],
    strength: "strong",
    fullLetterPreview: "Dear Sir/Madam...",
    lockedContent: { ... }
  },
  
  // Full Analysis (Phase 4)
  aiFullAnalysis: {
    fullLetter: "800-1500 word professional letter...",
    legalGrounds: [
      "Ground 1: Valid permit displayed...",
      "Ground 2: Photographic evidence...",
      "Ground 3: Enforcement error...",
      "Ground 4: Procedural breach...",
      "Ground 5: Administrative mistake..."
    ],
    legalReferences: [
      "Traffic Management Act 2004 - governs...",
      "Civil Enforcement Regulations - requires...",
      "British Parking Code - states..."
    ],
    nextSteps: [
      "Step 1: Review letter for accuracy",
      "Step 2: Attach evidence files",
      "Step 3: Submit via official portal",
      "Step 4: Keep copies of submission",
      "Step 5: Follow up within 14 days",
      "Step 6: Escalate if no response",
      "Step 7: Consider independent review"
    ],
    generatedAt: "2026-01-23T22:30:00.000Z"
  }
}
```

---

## AI Generation Details

```
┌─────────────────────────────────────────────────────────────┐
│                  AI GENERATION PROCESS                       │
└─────────────────────────────────────────────────────────────┘

Input to AI:
  - Dispute type
  - User description
  - Evidence file names
  - Preview context (summary, key points, strength)
  - User name (from Clerk)

AI Prompt:
  - System: Expert dispute letter writer
  - Requirements:
    * Confidence framing sentence
    * Professional structure
    * 800-1500 words
    * Do NOT reuse preview verbatim
    * Expand naturally
    * No legal jargon
    * No hedging language
    * 3-5 legal references (concise)

AI Processing:
  - Model: GPT-4o-mini
  - Temperature: 0.6
  - Max tokens: 2500
  - Response format: JSON

Output from AI:
{
  "fullLetter": "Complete letter...",
  "legalGrounds": ["Ground 1", ...],
  "legalReferences": ["Ref 1 - explanation", ...],
  "nextSteps": ["Step 1", ...]
}

Post-Processing:
  - Clean text (remove hedging)
  - Limit references to 5
  - Limit steps to 7
  - Validate structure
  - Add timestamp
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                           │
└─────────────────────────────────────────────────────────────┘

Error 1: User not authenticated
  → 401 Unauthorized
  → Redirect to login

Error 2: User doesn't own dispute
  → 403 Forbidden
  → Redirect to /disputes

Error 3: Payment not completed + bypass disabled
  → 403 Payment required
  → Show error message

Error 4: Preview not generated
  → 400 Bad Request
  → Message: "Preview must be generated first"

Error 5: AI generation fails
  → Catch error
  → Generate fallback template
  → Log error
  → Return fallback content

Error 6: Network timeout
  → Show error in loader
  → "Failed to generate. Please refresh."
  → User can retry
```

---

## Loading States

```
┌─────────────────────────────────────────────────────────────┐
│                    LOADING STATES                            │
└─────────────────────────────────────────────────────────────┘

State 1: Not Unlocked
  → Show preview only
  → Locked sections blurred
  → "Unlock" CTA visible

State 2: Unlocked + Generating
  → Show loader component
  → Spinner animation
  → "Generating your full dispute letter..."
  → "This may take 10-15 seconds. Please wait."

State 3: Unlocked + Generated
  → Hide loader
  → Show real content
  → Full letter visible
  → Legal grounds visible
  → References visible
  → Next steps visible

State 4: Error
  → Show error message
  → "Failed to generate. Please refresh."
  → User can retry
```

---

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                  PERFORMANCE TARGETS                         │
└─────────────────────────────────────────────────────────────┘

Preview Generation:
  - Time: 2-3 seconds
  - Cost: £0.002
  - Success rate: >95%

Full Analysis Generation:
  - Time: 10-15 seconds
  - Cost: £0.005
  - Success rate: >95%

Cached Content:
  - Time: <100ms
  - Cost: £0.00
  - Success rate: 100%

Total Per Dispute:
  - First visit: 12-18 seconds
  - Subsequent: <1 second
  - Total cost: £0.007
  - Net margin: 99.93%
```

---

## Quality Assurance

```
┌─────────────────────────────────────────────────────────────┐
│                   QUALITY CHECKLIST                          │
└─────────────────────────────────────────────────────────────┘

Letter Quality:
  ✓ 800-1500 words
  ✓ Confidence framing present
  ✓ Professional structure
  ✓ Does NOT reuse preview verbatim
  ✓ Expands naturally
  ✓ Specific to user's case
  ✓ References evidence files
  ✓ No legal jargon
  ✓ No hedging language
  ✓ Ready for submission

Legal Grounds:
  ✓ 3-5 items
  ✓ Expanded from preview
  ✓ Clear and actionable
  ✓ Specific arguments

Legal References:
  ✓ 3-5 items max
  ✓ UK-specific laws
  ✓ Plain English
  ✓ Brief explanations
  ✓ Authoritative but concise

Next Steps:
  ✓ 5-7 items
  ✓ Clear and actionable
  ✓ Chronological order
  ✓ Specific instructions
```

---

**Status:** ✅ Complete and ready for testing

**Test with:** `BYPASS_PAYWALL=true` in `.env`
