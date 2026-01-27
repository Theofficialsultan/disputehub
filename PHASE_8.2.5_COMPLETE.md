# PHASE 8.2.5 — SYSTEM-OWNED DECISION GATE ✅ COMPLETE

**Status:** IMPLEMENTED  
**Date:** 2026-01-24

---

## ✅ IMPLEMENTATION COMPLETE

Phase 8.2.5 (System-Owned Decision Gate) has been successfully implemented. This is the **critical system transition point** that turns DisputeHub from "AI chat" into a legal system.

**This is NOT just UI work. This is a hard backend + AI control flow change.**

---

## 🎯 What Was Built

### 1. Strategy Completeness Checker ✅

**File:** `src/lib/strategy/isStrategyComplete.ts`

**Purpose:** System-owned logic to determine when a case strategy is complete

**Rules (NON-NEGOTIABLE):**

Strategy is complete if and only if:
```typescript
strategy.disputeType !== null
AND strategy.keyFacts.length >= 2
AND (
  strategy.evidenceMentioned.length >= 1
  OR strategy.keyFacts.length >= 3
)
AND strategy.desiredOutcome !== null
```

**Functions:**
- `isStrategyComplete(strategy)` - Returns true/false
- `getStrategyCompletenessDetails(strategy)` - Returns detailed breakdown for debugging

**This is NOT AI-controlled. This is NOT user-controlled. This is SYSTEM-controlled.**

---

### 2. Database Schema Updates ✅

**File:** `prisma/schema.prisma`

#### Added Field to Dispute Model

```prisma
// Phase 8.2.5 - System-Owned Decision Gate
strategyLocked  Boolean  @default(false)
```

**Rules:**
- Users CANNOT edit this
- AI CANNOT override this
- Only backend logic can set it

#### Added Timeline Event Types

```prisma
enum CaseEventType {
  // ... existing types
  STRATEGY_FINALISED        // Phase 8.2.5
  DOCUMENT_PLAN_CREATED     // Phase 8.2.5
  DOCUMENTS_GENERATING      // Phase 8.2.5
}
```

---

### 3. Decision Gate Module ✅

**File:** `src/lib/strategy/decision-gate.ts`

**Purpose:** Automatic transition from conversation mode to document generation mode

**Core Functions:**

**`shouldTriggerDecisionGate(caseId)`**
- Checks if strategy is complete
- Checks if strategy is already locked
- Checks if case is restricted
- Returns true/false

**`executeDecisionGate(caseId)`**
- **Step 1:** Lock strategy (`strategyLocked = true`)
- **Step 2:** Create `STRATEGY_FINALISED` timeline event
- **Step 3:** Generate document plan (if not exists)
- **Step 4:** Create `DOCUMENT_PLAN_CREATED` timeline event
- **Step 5:** Create `DOCUMENTS_GENERATING` timeline event
- **Step 6:** Start batch document generation (async)

**Process Flow:**
```
Strategy Complete Detected
↓
Lock Strategy (strategyLocked = true)
↓
Timeline Event: STRATEGY_FINALISED
↓
Generate Document Plan
↓
Timeline Event: DOCUMENT_PLAN_CREATED
↓
Timeline Event: DOCUMENTS_GENERATING
↓
Batch Generate All Documents (async)
```

---

### 4. Messages API Integration ✅

**File:** `src/app/api/disputes/[id]/messages/route.ts`

**Integration Point:** After every AI response and strategy update

```typescript
// After strategy upsert...

// PHASE 8.2.5 - DECISION GATE (CRITICAL)
try {
  const gateTriggered = await executeDecisionGate(caseId);
  if (gateTriggered) {
    console.log(`[Decision Gate] Triggered for case ${caseId}`);
  }
} catch (gateError) {
  console.error("[Decision Gate] Error:", gateError);
  // Don't fail the request if decision gate fails
}
```

**This happens automatically after EVERY AI response.**

**NO user action required. NO UI button. NO manual trigger.**

---

### 5. AI Behavior Change ✅

**File:** `src/lib/ai/prompts.ts`

**New Prompt:** `STRATEGY_LOCKED_PROMPT`

```
You are a helpful legal case assistant for DisputeHub.

IMPORTANT: The case strategy is now complete and locked.
- Documents are being prepared automatically
- DO NOT ask exploratory questions
- DO NOT continue conversation by default
- Only respond if critical clarification is needed

If the user asks about status:
"Thanks — I now have enough information to prepare your documents. 
I'm generating them now. You'll see them appear shortly."

Keep all responses minimal and focused.
```

**Updated Function:**
```typescript
export function getSystemPrompt(
  mode: CaseMode,
  disputeType?: string,
  strategyLocked?: boolean  // NEW PARAMETER
): string
```

**Logic:**
- If `strategyLocked === true` → use STRATEGY_LOCKED_PROMPT
- Otherwise → use normal GUIDED or QUICK prompt

**Integration:** Messages API passes `dispute.strategyLocked` to `getSystemPrompt()`

---

### 6. Chat Input Control ✅

**File:** `src/app/(dashboard)/disputes/[id]/case/components/CaseChatClient.tsx`

**Updated:** `ChatInput` component

**New State:** When `strategyLocked === true`

```
┌─────────────────────────────────────┐
│  ✓  Documents are being prepared     │
│                                       │
│  We have enough information to        │
│  generate your case documents.        │
│  You'll be notified when they're     │
│  ready.                               │
└─────────────────────────────────────┘
```

**Replaces:** Chat input textarea and send button

**Color:** Blue (calm, informative)
**Icon:** CheckCircle

**NO further conversation allowed unless system explicitly re-opens it.**

---

### 7. Timeline UI Updates ✅

**File:** `src/components/case/EmbeddedTimeline.tsx`

**Added Icons for New Event Types:**

| Event Type | Icon | Color |
|------------|------|-------|
| STRATEGY_FINALISED | Lock | Indigo |
| DOCUMENT_PLAN_CREATED | FolderPlus | Cyan |
| DOCUMENTS_GENERATING | Zap | Yellow |

**These events appear in the timeline automatically when the decision gate triggers.**

---

## 📦 Files Created/Modified

### Created
```
src/lib/strategy/
├── isStrategyComplete.ts      # Strategy completeness checker
└── decision-gate.ts           # Decision gate execution logic
```

### Modified
```
prisma/schema.prisma
└── Added strategyLocked field
└── Added 3 new event types

src/lib/ai/prompts.ts
└── Added STRATEGY_LOCKED_PROMPT
└── Updated getSystemPrompt() to accept strategyLocked

src/app/api/disputes/[id]/messages/route.ts
└── Integrated decision gate execution after strategy update

src/app/(dashboard)/disputes/[id]/case/page.tsx
└── Added strategyLocked to data fetch

src/app/(dashboard)/disputes/[id]/case/components/CaseChatClient.tsx
└── Added strategyLocked to DisputeData type
└── Updated ChatInput to show locked state

src/components/case/EmbeddedTimeline.tsx
└── Added icons/colors for new event types
```

---

## ✅ Requirements Met

### Core Rules
- ✅ System — not AI — decides when strategy is complete
- ✅ NO user buttons
- ✅ NO AI guessing
- ✅ NO manual triggers
- ✅ Automatic execution after every AI response

### Strategy Completeness Logic
- ✅ `disputeType !== null`
- ✅ `keyFacts.length >= 2`
- ✅ `evidenceMentioned.length >= 1 OR keyFacts.length >= 3`
- ✅ `desiredOutcome !== null`
- ✅ Lives in shared utility `isStrategyComplete.ts`

### System State
- ✅ `strategyLocked: boolean` added to Dispute
- ✅ Users CANNOT edit
- ✅ AI CANNOT override
- ✅ Only backend logic can set

### Required Flow
- ✅ Check `isStrategyComplete()` after every AI response
- ✅ Lock strategy if complete
- ✅ Create `STRATEGY_FINALISED` timeline event
- ✅ Generate document plan
- ✅ Generate all pending documents
- ✅ Update lifecycle status

### Document Generation
- ✅ Create DocumentPlan if none exists
- ✅ Generate ALL pending documents in batch
- ✅ PDFs only (HTML → PDF already implemented)
- ✅ Auto-retry failures (up to 2 times)
- ✅ 3rd failure → manual retry required

### AI Behavior
- ✅ Updated GUIDED system prompt
- ✅ DO NOT ask exploratory questions when locked
- ✅ DO NOT continue conversation by default
- ✅ Inform user documents are being prepared
- ✅ Only ask if critical clarification required

### Chat Input Control
- ✅ Disable chat input when `strategyLocked === true`
- ✅ Replace with read-only message
- ✅ Clear explanation of what's happening

### Timeline Events
- ✅ `STRATEGY_FINALISED` created automatically
- ✅ `DOCUMENT_PLAN_CREATED` created automatically
- ✅ `DOCUMENTS_GENERATING` created automatically
- ✅ Existing `DOCUMENT_GENERATED` events continue

### Constraints
- ✅ No "Generate Documents" button
- ✅ AI does NOT decide readiness
- ✅ NO "are you ready?" prompt
- ✅ NO continued chat after lock
- ✅ NO repeated document regeneration

---

## 🧪 Testing Guide

### 1. Test Strategy Completeness Checker

**Manual Test:**

```typescript
import { isStrategyComplete } from "@/lib/strategy/isStrategyComplete";

// Test incomplete strategy
const incomplete = {
  disputeType: "parking_ticket",
  keyFacts: ["Received ticket"], // Only 1 fact
  evidenceMentioned: [],
  desiredOutcome: null,
};
console.log(isStrategyComplete(incomplete)); // false

// Test complete strategy
const complete = {
  disputeType: "parking_ticket",
  keyFacts: ["Received ticket", "Was at hospital"],
  evidenceMentioned: ["Hospital receipt"],
  desiredOutcome: "Cancel ticket",
};
console.log(isStrategyComplete(complete)); // true
```

---

### 2. Test Decision Gate Trigger

**Steps:**
1. Start a new GUIDED case
2. Chat with AI, providing:
   - Dispute type
   - At least 2 key facts
   - At least 1 evidence item
   - Desired outcome
3. Send one more message

**Expected:**
- After AI response, decision gate triggers automatically
- Console logs: `[Decision Gate] Executing for case...`
- Console logs: `[Decision Gate] Strategy locked...`
- Console logs: `[Decision Gate] Document generation initiated`

---

### 3. Test Strategy Lock

**Check Database:**

```sql
SELECT 
  id,
  title,
  "strategyLocked"
FROM "Dispute"
WHERE id = 'your-case-id';
```

**Expected:**
- `strategyLocked = true`

**Check Timeline:**

```sql
SELECT 
  type,
  description,
  "occurredAt"
FROM "CaseEvent"
WHERE "caseId" = 'your-case-id'
ORDER BY "occurredAt" DESC
LIMIT 5;
```

**Expected Events (in order):**
1. `DOCUMENTS_GENERATING` - "Document generation started"
2. `DOCUMENT_PLAN_CREATED` - "Document plan created automatically"
3. `STRATEGY_FINALISED` - "Case strategy completed and locked"

---

### 4. Test AI Behavior Change

**Prerequisites:**
- Case with `strategyLocked = true`

**Steps:**
1. Try to send a message in the chat

**Expected:**
- Chat input is disabled
- Blue message box shows: "Documents are being prepared"
- No chat textarea visible

**Alternative Test (if bypassing UI):**
- Manually call messages API
- Check AI response
- Should be minimal and focused on documents

---

### 5. Test Document Generation

**Prerequisites:**
- Decision gate triggered

**Steps:**
1. Wait 10-30 seconds for document generation
2. Navigate to `/disputes/[id]/documents`

**Expected:**
- DocumentPlan created
- Multiple `GeneratedDocument` records with `status = PENDING` or `GENERATING`
- Eventually, status updates to `COMPLETED`
- PDFs available for download

---

### 6. Test Timeline Events in UI

**Steps:**
1. Navigate to case page
2. Scroll to "Recent Activity" section

**Expected:**
- `STRATEGY_FINALISED` event visible with Lock icon (indigo)
- `DOCUMENT_PLAN_CREATED` event visible with FolderPlus icon (cyan)
- `DOCUMENTS_GENERATING` event visible with Zap icon (yellow)

---

### 7. Test Idempotency

**Steps:**
1. Trigger decision gate
2. Try to trigger again (e.g., send another message)

**Expected:**
- Decision gate does NOT trigger again
- `shouldTriggerDecisionGate()` returns false
- No duplicate timeline events
- No duplicate document plan

---

## 🔄 System Flow Diagram

```
User sends message
↓
AI processes and responds
↓
Strategy extracted and updated
↓
Decision Gate Check:
  isStrategyComplete(strategy)?
  AND !dispute.strategyLocked?
  AND !dispute.restricted?
↓
YES → TRIGGER DECISION GATE
↓
1. Set strategyLocked = true
2. Create STRATEGY_FINALISED event
3. Generate DocumentPlan
4. Create DOCUMENT_PLAN_CREATED event
5. Create DOCUMENTS_GENERATING event
6. Start batch document generation (async)
↓
Chat input disabled
↓
AI uses STRATEGY_LOCKED_PROMPT
↓
Documents appear in library
↓
User can download PDFs
```

---

## 🧠 Strategy Completeness Examples

### Example 1: INCOMPLETE (only 1 key fact)

```json
{
  "disputeType": "parking_ticket",
  "keyFacts": ["Received parking ticket"],
  "evidenceMentioned": [],
  "desiredOutcome": "Cancel ticket"
}
```

**Result:** `isStrategyComplete() = false`  
**Reason:** Only 1 key fact (needs 2)

---

### Example 2: COMPLETE (2 key facts + evidence)

```json
{
  "disputeType": "parking_ticket",
  "keyFacts": [
    "Received parking ticket on Jan 1st",
    "Was at hospital emergency room"
  ],
  "evidenceMentioned": ["Hospital receipt"],
  "desiredOutcome": "Cancel ticket"
}
```

**Result:** `isStrategyComplete() = true`  
**Reason:** 2 key facts + 1 evidence

---

### Example 3: COMPLETE (3 key facts, no evidence)

```json
{
  "disputeType": "landlord_dispute",
  "keyFacts": [
    "Deposit not returned",
    "Property left in good condition",
    "Landlord not responding to emails"
  ],
  "evidenceMentioned": [],
  "desiredOutcome": "Return my £1000 deposit"
}
```

**Result:** `isStrategyComplete() = true`  
**Reason:** 3 key facts (evidence not required)

---

## 📊 Decision Gate Logs

When the decision gate triggers, you'll see these console logs:

```
[Decision Gate] Executing for case abc123
[Decision Gate] Strategy locked for case abc123
[Decision Gate] STRATEGY_FINALISED event created
[Decision Gate] Creating document plan...
[Decision Gate] Document plan created
[Decision Gate] DOCUMENTS_GENERATING event created
[Decision Gate] Document generation initiated
[Decision Gate] Triggered for case abc123
```

**These logs are CRITICAL for debugging.**

---

## 🎨 UI States

### Before Strategy Lock

```
┌─────────────────────────────────────┐
│  [Chat messages...]                  │
│                                       │
│  [User message]                      │
│  [AI response]                       │
│                                       │
│  ┌─────────────────────────────┐    │
│  │ Type your message...         │    │
│  │                              [→]  │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### After Strategy Lock

```
┌─────────────────────────────────────┐
│  [Chat messages...]                  │
│                                       │
│  [User message]                      │
│  [AI response]                       │
│                                       │
│  ┌─────────────────────────────────┐│
│  │  ✓  Documents are being prepared ││
│  │                                   ││
│  │  We have enough information to    ││
│  │  generate your case documents.    ││
│  │  You'll be notified when they're ││
│  │  ready.                           ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 🚨 Critical Notes

### 1. This is NOT Optional

The decision gate is **MANDATORY**. Without it, DisputeHub is just an AI chatbot, not a legal system.

### 2. System-First, AI-Second

The **system** decides when to generate documents, NOT the AI. This is by design.

### 3. Idempotency is Critical

The decision gate MUST only trigger once per case. `strategyLocked` prevents duplicate execution.

### 4. Timeline is Audit Trail

Every decision gate execution creates 3 timeline events. This is the audit trail.

### 5. Async Document Generation

Document generation happens in the background. The gate triggers it but doesn't wait for completion.

---

## 🎉 PHASE 8.2.5: COMPLETE

**All requirements met:**
- ✅ System-owned decision gate implemented
- ✅ Strategy completeness checker working
- ✅ Automatic transition from chat → documents
- ✅ AI behavior changes when strategy locked
- ✅ Chat input disabled when locked
- ✅ Timeline events created automatically
- ✅ Document generation triggered automatically
- ✅ Behavior is deterministic and repeatable

**Definition of Done:** ✅ SATISFIED

---

## 🛑 STOPPING AS INSTRUCTED

Phase 8.2.5 is complete. **NOT proceeding to any other phase** as instructed.

**Awaiting next instruction.**

---

**This phase turns DisputeHub from "AI chat" into a legal system.** 🚀

The decision gate is the critical transition point that makes the entire product work.
