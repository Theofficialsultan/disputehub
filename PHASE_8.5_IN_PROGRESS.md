# 📎 PHASE 8.5 — EVIDENCE UPLOAD, MAPPING & PDF EMBEDDING — IN PROGRESS

**Status:** IMPLEMENTING  
**Date:** 2026-01-25  
**Phase:** 8.5 - Court-Grade Evidence System

---

## ✅ COMPLETED SO FAR

### 1. DATABASE MODEL ✅

**Added `EvidenceItem` model:**
```prisma
model EvidenceItem {
  id            String       @id
  caseId        String
  fileUrl       String       // Supabase Storage URL
  fileType      EvidenceType // IMAGE | PDF
  fileName      String
  fileSize      Int
  title         String
  description   String?
  evidenceDate  DateTime?
  evidenceIndex Int          // Permanent index #1, #2, #3...
  uploadedAt    DateTime
  uploadedBy    String
  
  @@unique([caseId, evidenceIndex]) // Permanent numbering per case
}
```

**Key Features:**
- ✅ Permanent evidence index (immutable)
- ✅ Unique constraint per case
- ✅ Automatic index assignment (1, 2, 3...)
- ✅ File metadata storage
- ✅ System-owned, not AI-owned

**Added `EvidenceType` enum:**
- `IMAGE` - JPG, PNG
- `PDF` - PDF documents

**Added `CaseEventType` entries:**
- `EVIDENCE_UPLOADED`
- `EVIDENCE_ATTACHED_TO_DOCUMENT`

---

### 2. EVIDENCE SERVICE ✅

**Created `src/lib/evidence/service.ts`**

**Functions:**
- `createEvidence()` - Create evidence with automatic index assignment
- `getCaseEvidence()` - Get all evidence for a case (ordered by index)
- `getEvidenceById()` - Get specific evidence item
- `getEvidenceByIndex()` - Get evidence by case and index number
- `updateEvidenceMetadata()` - Update title, description, date
- `deleteEvidence()` - Remove evidence (with timeline event)

**Permanent Index Logic:**
- `getNextEvidenceIndex()` - Atomic index assignment
- Starts at 1, increments forever
- Never reuses numbers (even after deletion)

**Timeline Integration:**
- Auto-creates `EVIDENCE_UPLOADED` event
- Includes evidence index in description

---

### 3. EVIDENCE UPLOAD API ✅

**POST `/api/evidence/upload`**

**Handles:**
- File upload to Supabase Storage
- File validation (type, size)
- Ownership verification
- Evidence record creation
- Timeline event creation

**Validations:**
- Max file size: 10MB
- Allowed types: JPG, PNG, PDF
- User must own the case

**Storage:**
- Path: `cases/{caseId}/evidence/{timestamp}-{random}.{ext}`
- Public URLs for PDF embedding
- Supabase Storage integration

**GET `/api/evidence/[caseId]`**

**Returns:**
- All evidence items for a case
- Ordered by evidence index (ascending)
- Ownership verified

---

## 🚧 IN PROGRESS

### 4. EVIDENCE SCHEDULE PDF GENERATION

Need to implement:
- New document type: `EVIDENCE_SCHEDULE`
- HTML template for Evidence Schedule
- Image embedding (inline at readable width)
- PDF merging/appending logic
- Regeneration when evidence changes

### 5. MAIN LETTER UPDATES

Need to update AI prompts to:
- Reference evidence by index: "Evidence Item #3"
- NOT embed images inline
- NOT attach raw files
- Follow format: "Evidence Item #X (Title) dated DD/MM/YYYY"

### 6. UI COMPONENTS

Need to create:
- Evidence upload section in case page
- Evidence list with thumbnails
- Evidence preview modal
- Evidence attachment indicators

---

## 📋 REMAINING TASKS

1. ✅ Database model
2. ✅ Event types
3. ✅ Evidence service
4. ✅ Upload API
5. ⏳ Evidence Schedule PDF template
6. ⏳ PDF embedding logic
7. ⏳ Main letter prompt updates
8. ⏳ Upload UI component
9. ⏳ Evidence list UI
10. ✅ Timeline integration

---

## 🔒 LOCKED RULES (BEING FOLLOWED)

✅ Evidence is system-owned, not AI-owned  
✅ Evidence index is permanent and immutable  
✅ Evidence numbering starts at 1  
✅ Files stored in Supabase Storage  
✅ Timeline events created automatically  
✅ No AI behavior changes  
✅ No chat continuation logic  

---

## 📁 FILE STRUCTURE

```
src/
├── lib/
│   └── evidence/
│       └── service.ts          # Evidence CRUD operations
│
├── app/
│   └── api/
│       └── evidence/
│           ├── upload/route.ts # File upload endpoint
│           └── [caseId]/route.ts # Get evidence endpoint
│
└── prisma/
    └── schema.prisma          # EvidenceItem model
```

---

## 🎯 NEXT STEPS

1. Create Evidence Schedule PDF template
2. Update PDF generation to embed images
3. Update main letter AI prompts
4. Create evidence upload UI
5. Create evidence list UI
6. Test end-to-end flow

---

**Phase 8.5 implementation continuing...**
