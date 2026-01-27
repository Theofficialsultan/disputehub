# Document Generation System V2 - Fully Rebuilt (2026-01-27)

## ✨ How It Works

### **Simple & Automatic Flow:**

1. **User chats with AI** → AI asks questions and extracts case information
2. **AI builds strategy** → Automatically extracts key facts, dispute type, desired outcome
3. **When ready** → System automatically triggers document generation (user sees nothing)
4. **Documents appear** → User sees documents in the UI with download buttons

### **No Buttons, No Manual Triggers**

- ✅ Fully automatic based on conversation
- ✅ AI doesn't mention documents
- ✅ System decides when to generate
- ✅ Clean, simple UX

---

## 📁 File Structure

### Backend (API)
```
/src/app/api/disputes/[id]/documents/
├── route.ts                    # GET: Fetch all documents
└── generate/
    └── route.ts                # POST: Generate documents (auto-triggered)

/src/lib/ai/
└── document-content.ts         # AI content generation for each document type
```

### Frontend (UI)
```
/src/components/documents/
└── DocumentStatus.tsx          # Shows document generation status & download buttons
```

### Integration Points
- `/src/app/api/disputes/[id]/messages/route.ts` - Triggers generation after strategy extraction
- `/src/app/(dashboard)/disputes/[id]/case/components/CaseChatClient.tsx` - Displays DocumentStatus component

---

## 🔧 How Document Generation Triggers

### Automatic Trigger Conditions

In `/src/app/api/disputes/[id]/messages/route.ts`:

```typescript
function checkIfReadyForDocuments(strategy: any): boolean {
  // Must have dispute type
  if (!strategy.disputeType) return false;
  
  // Must have at least 5 key facts
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  if (facts.length < 5) return false;
  
  // Must have a desired outcome (at least 20 characters)
  const outcome = strategy.desiredOutcome || "";
  if (outcome.length < 20) return false;
  
  return true;
}
```

**After each AI message:**
1. Strategy is extracted from conversation
2. `checkIfReadyForDocuments()` checks if complete
3. If complete → Calls `/api/disputes/[id]/documents/generate`
4. Generation happens in background
5. UI polls for updates and shows documents when ready

---

## 📄 Document Types Generated

### Base Documents (Always Generated)
1. **Demand Letter** - Formal demand to opposing party
2. **Case Summary** - Comprehensive case overview

### Dispute-Specific Documents

**Employment Disputes:**
- Employment Claim Document
- Evidence List & Analysis

**Contract Disputes:**
- Breach Analysis
- Remedy Calculation

**Consumer Disputes:**
- Complaint Letter
- Evidence List

**Property Disputes:**
- Property Dispute Notice
- Evidence List

**Debt Disputes:**
- Debt Validation Letter
- Dispute Letter

---

## 🎨 UI Components

### DocumentStatus Component

**Location:** Right sidebar (below Strategy Summary, above Evidence)

**Features:**
- 🔄 Auto-polls every 3 seconds when documents are generating
- ✅ Shows completion status with icons
- 📥 Download button for completed documents
- 🎯 Clean, minimal design

**States:**
1. **Hidden** - No documents, not locked → Shows nothing
2. **Preparing** - Locked but no docs yet → Shows "Preparing Documents..."
3. **Generating** - Docs exist but generating → Shows progress with spinner
4. **Complete** - All docs generated → Shows download buttons

---

## 🔐 Security & Permissions

- ✅ All endpoints verify user ownership of case
- ✅ Only case owner can generate/view documents
- ✅ Documents stored in database (not filesystem)
- ✅ `strategyLocked` flag prevents duplicate generation

---

## 📊 Database Schema (Used)

### GeneratedDocument Table
```prisma
model GeneratedDocument {
  id         String   @id @default(cuid())
  caseId     String
  type       String   // "demand_letter", "case_summary", etc.
  title      String   // Human-readable title
  content    String   @db.Text // Full document content
  status     DocumentStatus // PENDING, GENERATING, COMPLETED, FAILED
  lastError  String?  // Error message if failed
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Dispute.strategyLocked
- `false` → Documents not generated yet
- `true` → Documents generated (prevent duplicates)

---

## 🚀 Testing the System

### Test Flow:

1. **Start a new case** (or use existing)
2. **Chat with AI** - Answer 5-6 questions thoroughly:
   - Dispute type (e.g., "employment")
   - What happened (detailed facts)
   - Desired outcome (specific)
   - Evidence (upload files)
3. **Wait for auto-generation** - After ~5-7 messages, system auto-triggers
4. **Watch Documents appear** - UI polls and shows documents as they generate
5. **Download documents** - Click download buttons

### What You Should See:

**Before Generation:**
- Right sidebar shows: Strategy Summary → Evidence Section
- No "Documents" section

**During Generation:**
- Documents section appears with "Preparing Documents..." or spinners
- Polls every 3 seconds for updates

**After Generation:**
- Documents section shows completed docs with green checkmarks
- Download buttons active
- Chat continues to work (not locked)

---

## 🐛 Debugging

### Check Terminal Logs:

**Successful flow:**
```
[API] ✅ Strategy complete! Triggering document generation...
[Generate Docs] Starting generation for case cmk...
[Generate Docs] Strategy found: { disputeType: 'employment', keyFacts: 5, ... }
[Generate Docs] Found 1 evidence items
[Generate Docs] Will generate: demand_letter, case_summary, employment_claim, evidence_list
[AI Content] Generating demand_letter...
[AI Content] ✅ Generated 1234 characters for demand_letter
[Generate Docs] ✅ Saved demand_letter to database
...
[Generate Docs] ✅ All done! Generated 4/4 documents
```

### Common Issues:

**Documents not generating:**
- Check: Are there 5+ key facts in strategy?
- Check: Is desired outcome at least 20 characters?
- Check: Is dispute type set?
- Check terminal for "[API] Strategy not yet complete" message

**Empty documents:**
- Check: OpenAI API key is set in `.env`
- Check: AI content generation logs show errors
- Check: `lastError` field in database

**UI not updating:**
- Check: Is polling working? (every 3 seconds)
- Check: Browser console for errors
- Refresh page manually

---

## 🔄 How to Modify

### Add New Document Type:

1. **Add to `getDocumentTypesForDispute()`** in `generate/route.ts`
2. **Add prompt to `buildDocumentPrompt()`** in `document-content.ts`
3. **Add title to `getDocumentTitle()`** in `generate/route.ts`

### Change Trigger Conditions:

Edit `checkIfReadyForDocuments()` in `/src/app/api/disputes/[id]/messages/route.ts`

Example - require 8 facts instead of 5:
```typescript
if (facts.length < 8) return false;
```

### Change Poll Interval:

Edit `DocumentStatus.tsx`:
```typescript
const interval = setInterval(() => {
  loadDocuments();
}, 3000); // Change to 5000 for 5 seconds
```

---

## ✅ System Health Checklist

- [x] Documents generate automatically
- [x] UI shows status in real-time
- [x] Download buttons work
- [x] AI doesn't mention documents
- [x] No manual buttons needed
- [x] Works for all dispute types
- [x] Error handling in place
- [x] Logging throughout
- [x] Database properly locked after generation
- [x] Chat remains usable during/after generation

---

## 🎯 Key Design Decisions

1. **Automatic over Manual** - No "Generate" button; system decides
2. **AI-Driven** - Strategy extraction drives everything
3. **Non-Blocking** - Documents generate in background, chat stays open
4. **Simple State** - Just one boolean: `strategyLocked`
5. **Polling over Websockets** - Simpler, more reliable for MVP
6. **Text Download** - Store as text, download as `.txt` (can upgrade to PDF later)
7. **Database Storage** - Not filesystem, easier to manage
8. **Idempotent** - Can't generate twice (locked flag)

---

**System rebuilt and tested: 2026-01-27**
