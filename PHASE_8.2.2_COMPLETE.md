# PHASE 8.2.2 — WAITING STATES & DEADLINE ENGINE ✅ COMPLETE

**Status:** IMPLEMENTED  
**Date:** 2026-01-24

---

## ✅ IMPLEMENTATION COMPLETE

Phase 8.2.2 (Waiting States & Deadline Engine) has been successfully implemented. The system now owns time and automatically tracks deadlines.

---

## 🎯 What Was Built

### 1. Database Schema ✅

#### Extended Dispute Model
```prisma
model Dispute {
  // ... existing fields
  
  // Phase 8.2.2 additions
  lifecycleStatus  CaseLifecycleStatus @default(DRAFT)
  waitingUntil     DateTime?
  
  @@index([lifecycleStatus])
  @@index([waitingUntil])
}
```

#### CaseLifecycleStatus Enum
```prisma
enum CaseLifecycleStatus {
  DRAFT
  DOCUMENT_SENT
  AWAITING_RESPONSE
  RESPONSE_RECEIVED
  DEADLINE_MISSED
  CLOSED
}
```

**All lifecycle states defined upfront for future blocks.**

---

### 2. Deadline Engine ✅

**File:** `src/lib/deadlines/deadline-engine.ts`

**Core Functions:**

**`markDocumentAsSent(documentId, userId)`**
- Validates ownership
- Marks document as SENT (does NOT regenerate)
- Updates Dispute:
  - `lifecycleStatus = AWAITING_RESPONSE`
  - `waitingUntil = now() + 14 days`
- Creates `DOCUMENT_SENT` timeline event

**`checkMissedDeadlines()`**
- Finds disputes where:
  - `lifecycleStatus = AWAITING_RESPONSE`
  - `waitingUntil < now()`
- For each match:
  - Sets `lifecycleStatus = DEADLINE_MISSED`
  - Creates `DEADLINE_MISSED` timeline event
- Returns count of updated disputes
- **Designed for cron job** (not scheduled yet)
- **Can be called manually** for now

**`getWaitingStatus(caseId)`**
- Returns:
  - `lifecycleStatus`
  - `waitingUntil`
  - `daysRemaining` (calculated)

---

### 3. System Rules Enforced ✅

**Lifecycle Ownership:**
- ✅ Lifecycle status is system-owned
- ✅ Users cannot set or edit it
- ✅ AI cannot set or edit it
- ✅ Changes only via backend logic

**Deadline Rules:**
- ✅ Default deadline: 14 calendar days
- ✅ Automatic calculation: `waitingUntil = sentAt + 14 days`
- ✅ Automatic lifecycle transition to `AWAITING_RESPONSE`

---

### 4. API Endpoints ✅

#### POST /api/documents/[documentId]/sent

**Mark a document as sent**

**Process:**
1. Validate ownership
2. Verify document is COMPLETED
3. Update dispute lifecycle
4. Set deadline (now + 14 days)
5. Create timeline event

**Response:**
```json
{
  "message": "Document marked as sent"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Not document owner
- `404` - Document not found
- `400` - Only completed documents can be marked as sent

**File:** `src/app/api/documents/[documentId]/sent/route.ts`

---

#### GET /api/disputes/[id]/waiting-status

**Get case waiting status**

**Authorization:**
- User must own the case

**Response:**
```json
{
  "lifecycleStatus": "AWAITING_RESPONSE",
  "waitingUntil": "2026-02-07T12:00:00Z",
  "daysRemaining": 9
}
```

**File:** `src/app/api/disputes/[id]/waiting-status/route.ts`

---

### 5. Timeline Integration ✅

**New Events Created:**

**DOCUMENT_SENT:**
```
type: DOCUMENT_SENT
description: "Document '{documentType}' was sent"
relatedDocumentId: <document.id>
occurredAt: now()
```

**DEADLINE_MISSED:**
```
type: DEADLINE_MISSED
description: "Response deadline missed"
occurredAt: now()
```

Both events are automatically created by the deadline engine.

---

### 6. UI Updates ✅

#### Document Library - "Mark as Sent" Button

**Location:** `/disputes/[id]/documents`

**Features:**
- ✅ "Mark as Sent" button appears on COMPLETED documents
- ✅ Button has loading state while processing
- ✅ Triggers deadline engine
- ✅ Updates case lifecycle
- ✅ Creates timeline event
- ✅ Shows success message

**Updated File:** `src/app/(dashboard)/disputes/[id]/documents/components/DocumentLibraryClient.tsx`

---

#### Waiting Status Display Component

**Component:** `WaitingStatusDisplay`

**Features:**
- ✅ Shows lifecycle status badge
- ✅ **AWAITING_RESPONSE**: Blue badge, "Waiting for response", days remaining
- ✅ **DEADLINE_MISSED**: Red badge, "Response deadline has passed"
- ✅ **RESPONSE_RECEIVED**: Green badge, "Response has been received"
- ✅ Auto-hides for DRAFT and DOCUMENT_SENT states
- ✅ Mobile-responsive design

**File:** `src/components/WaitingStatusDisplay.tsx`

---

## 📦 Files Created/Modified

### Created
```
src/lib/deadlines/
└── deadline-engine.ts            # Deadline management engine

src/app/api/documents/[documentId]/sent/
└── route.ts                      # POST mark as sent endpoint

src/app/api/disputes/[id]/waiting-status/
└── route.ts                      # GET waiting status endpoint

src/components/
└── WaitingStatusDisplay.tsx      # Status display component
```

### Modified
```
prisma/schema.prisma              # Added lifecycleStatus, waitingUntil
src/app/(dashboard)/disputes/[id]/documents/components/
└── DocumentLibraryClient.tsx     # Added "Mark as Sent" button
```

---

## ✅ Requirements Met

### Database
- ✅ `lifecycleStatus` field added to Dispute
- ✅ `waitingUntil` field added to Dispute
- ✅ `CaseLifecycleStatus` enum with all 6 states
- ✅ Proper indexes on both fields

### System Rules
- ✅ Lifecycle status is system-owned
- ✅ Users cannot modify it directly
- ✅ AI cannot modify it directly
- ✅ All changes via backend logic only

### Deadline Rules
- ✅ Default deadline: 14 days
- ✅ Automatic calculation on document sent
- ✅ Automatic lifecycle transition

### Event Triggers
- ✅ Mark document as sent endpoint
- ✅ Automatic lifecycle update
- ✅ Automatic deadline calculation
- ✅ Timeline event creation (DOCUMENT_SENT)
- ✅ Deadline check function
- ✅ Missed deadline detection
- ✅ Timeline event creation (DEADLINE_MISSED)

### API
- ✅ POST /api/documents/[id]/sent
- ✅ GET /api/disputes/[id]/waiting-status
- ✅ Proper authorization
- ✅ Error handling

### UI
- ✅ "Mark as Sent" button in document library
- ✅ Lifecycle status badge display
- ✅ Days remaining display
- ✅ Deadline missed warning
- ✅ Read-only (no user editing)

### Constraints
- ✅ No follow-up generation
- ✅ No escalation logic
- ✅ No notifications
- ✅ No cron jobs (function ready, not scheduled)
- ✅ No user deadline modification
- ✅ Deadlines stored in Dispute, not only in CaseEvent

---

## 🧪 Testing Guide

### 1. Mark Document as Sent

**Prerequisites:**
- At least one document with status = COMPLETED

**Steps:**
1. Navigate to `/disputes/[case-id]/documents`
2. Find a completed document
3. Click "Mark as Sent" button
4. Wait for success message

**Expected:**
- Button shows loading state
- Success message appears
- Case lifecycle updates to AWAITING_RESPONSE
- Timeline shows DOCUMENT_SENT event
- waitingUntil set to today + 14 days

---

### 2. View Waiting Status

**Prerequisites:**
- Document marked as sent

**Steps:**
1. Navigate to `/disputes/[case-id]/timeline`
2. Check for DOCUMENT_SENT event
3. Navigate to case overview
4. View WaitingStatusDisplay component

**Expected:**
- Timeline shows "Document 'X' was sent"
- Status display shows "Awaiting Response"
- Days remaining displayed correctly
- Blue badge with clock icon

---

### 3. Check Missed Deadlines (Manual)

**Prerequisites:**
- Case in AWAITING_RESPONSE state
- waitingUntil in the past (need to manually update DB for testing)

**Steps:**
1. Manually call `checkMissedDeadlines()` function
2. Check timeline
3. Check waiting status display

**Expected:**
- lifecycleStatus updated to DEADLINE_MISSED
- Timeline shows "Response deadline missed"
- Status display shows red badge "Deadline Missed"

---

### 4. Calculate Days Remaining

**Prerequisites:**
- Case in AWAITING_RESPONSE state

**Steps:**
1. Call GET `/api/disputes/[id]/waiting-status`
2. Check `daysRemaining` value

**Expected:**
- Accurate calculation of days until deadline
- Positive number for future deadlines
- 0 for today
- Negative for past deadlines (before check runs)

---

## 📊 Lifecycle Flow

```
DRAFT
  ↓
User marks document as sent
  ↓
DOCUMENT_SENT (momentary)
  ↓
Automatic transition
  ↓
AWAITING_RESPONSE
(waitingUntil = now + 14 days)
  ↓
[Time passes...]
  ↓
checkMissedDeadlines() runs
  ↓
[If waitingUntil < now()]
  ↓
DEADLINE_MISSED
```

---

## 🔐 System Ownership

**What Users CAN Do:**
- ✅ Mark completed documents as sent
- ✅ View lifecycle status
- ✅ View waiting deadline
- ✅ View days remaining

**What Users CANNOT Do:**
- ❌ Set lifecycle status directly
- ❌ Modify waiting deadline
- ❌ Skip waiting period
- ❌ Force deadline missed state

**What AI CAN Do:**
- ✅ Read lifecycleStatus
- ✅ Reference timeline events
- ✅ Explain what system has detected

**What AI CANNOT Do:**
- ❌ Guess deadlines
- ❌ Invent states
- ❌ Advance lifecycle

---

## 🎨 UI Components Used

From `@/components/ui`:
- `Button` - Mark as sent action
- `Badge` - Status indicators

Icons from `lucide-react`:
- `Send` - Mark as sent button
- `Clock` - Awaiting response
- `AlertTriangle` - Deadline missed
- `CheckCircle` - Response received
- `Loader2` - Loading state

---

## ⏰ Deadline Calculation

**Formula:**
```
waitingUntil = sentAt + (14 * 24 * 60 * 60 * 1000)
```

**Days Remaining:**
```typescript
const diffMs = waitingUntil.getTime() - now.getTime();
const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
```

**Default Period:** 14 calendar days (configurable in code)

---

## 🚀 Manual Deadline Check

To manually check for missed deadlines (for testing or future cron):

```typescript
import { checkMissedDeadlines } from "@/lib/deadlines/deadline-engine";

// Returns number of disputes updated
const count = await checkMissedDeadlines();
console.log(`Updated ${count} disputes`);
```

This function is **ready for scheduling** but not scheduled yet (future block).

---

## 📊 Status Summary

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| Deadline Engine | ✅ Complete |
| Mark as Sent Endpoint | ✅ Complete |
| Waiting Status Endpoint | ✅ Complete |
| Timeline Integration | ✅ Complete |
| Mark as Sent Button | ✅ Complete |
| Waiting Status Display | ✅ Complete |
| Deadline Check Function | ✅ Complete (not scheduled) |
| System Ownership | ✅ Enforced |

---

## 🎉 PHASE 8.2.2: COMPLETE

**All requirements met:**
- ✅ Dispute lifecycle status exists
- ✅ Documents can be marked as sent
- ✅ Waiting deadlines set automatically (14 days)
- ✅ Missed deadlines detected
- ✅ Timeline records DOCUMENT_SENT and DEADLINE_MISSED
- ✅ Waiting status queryable via API
- ✅ UI reflects waiting/missed states

**Definition of Done:** ✅ SATISFIED

---

## 🛑 STOPPING (AS INSTRUCTED)

Phase 8.2.2 is complete. **NOT proceeding to Block 8.2.3** as instructed.

**Awaiting next instruction.**

---

## 📝 Notes for Future Blocks

**Ready for Scheduling:**
- `checkMissedDeadlines()` function is ready for cron job scheduling
- Recommended: Run daily or hourly

**Unused Lifecycle States** (for future blocks):
- DOCUMENT_SENT (transitional)
- RESPONSE_RECEIVED (manual or future automation)
- CLOSED (future block)

**Future Enhancements** (NOT in this block):
- Notifications when deadline approaching
- Follow-up generation when deadline missed
- Escalation triggers
- Custom deadline periods
- Response received tracking

The deadline infrastructure is now in place and ready for expansion.
