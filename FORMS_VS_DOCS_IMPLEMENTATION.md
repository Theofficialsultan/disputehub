# OFFICIAL FORMS vs GENERATED DOCUMENTS - IMPLEMENTATION

## Overview

DisputeHub now correctly distinguishes between:

1. **FILLABLE_PDF** - Official government forms (PDFs with form fields)
2. **GENERATED** - Narrative documents written by AI from scratch

## What Changed

### 1. Form Classification System (`/src/lib/legal/form-types.ts`)

Created a comprehensive registry that classifies every form:

**FILLABLE PDFs (Official Forms):**
- ET1 (Employment Tribunal Claim)
- N1 (County Court Claim Form)
- N244 (Application Notice)
- SSCS1 (Benefits Appeal)
- All official government forms with PDF versions

**GENERATED Documents (AI-Written):**
- Particulars of Claim (attached to N1)
- Letter Before Action
- Witness Statements
- Evidence Bundle Index
- Schedule of Damages
- All narrative/supporting documents

### 2. PDF Form Filler (`/src/lib/pdf/pdf-form-filler.ts`)

Created infrastructure for:
- Downloading official blank PDFs
- Extracting form fields
- Mapping case data to PDF fields
- Filling and returning completed PDFs

**Status: PARTIALLY IMPLEMENTED**
- Framework is ready
- Field mappings need to be completed per form
- Integration with System 3 is wired up

### 3. System 3 Updated (`/src/lib/ai/system3-generation.ts`)

Now checks form type at the start:

```typescript
if (isFormFillablePDF(formId)) {
  // For now: Generate guidance document
  // Future: Download PDF, fill it, return filled PDF
  return generatePdfFormGuidance(...);
}

// Otherwise: AI generates from scratch
return generateWithAI(...);
```

### 4. Temporary Solution - Form Guidance

For fillable PDFs (until PDF filling is fully implemented), System 3 now generates:

**Guidance Document** that includes:
- Where to download the official form
- All case data pre-formatted for easy copying
- Section-by-section filling instructions
- Submission instructions (where to file, fees, deadlines)

**Example Output:**
```
═══════════════════════════════════════════════
EMPLOYMENT TRIBUNAL CLAIM FORM (ET1) - GUIDANCE
═══════════════════════════════════════════════

WHERE TO GET THE FORM:
Download from: https://www.gov.uk/employment-tribunals
Or online form: https://www.employmenttribunals.service.gov.uk

YOUR CASE INFORMATION:
Case: Unpaid Wages - 24TM Ltd
Key Facts:
1. Worked as traffic management operative
2. 10 hours on 14 October 2024
3. Employer refused to pay £400

HOW TO COMPLETE:
SECTION 1 - CLAIMANT DETAILS:
[Pre-filled data ready to copy]

SECTION 2 - RESPONDENT:
Name: 24TM Ltd
Address: [From case facts]

... etc ...
```

## Current Status

### ✅ WORKING NOW
- Form classification (FILLABLE vs GENERATED)
- AI-generated documents (Particulars, Letters, Evidence Bundles)
- Guidance documents for official forms
- Legal accuracy rules applied to ALL documents
- System 3 routes correctly based on form type

### 🚧 NEXT STEPS (Future Work)
1. **Extract PDF Field Names** for each official form
   - Use `inspectPdfFields()` utility to list fields
   - Map field names to case data
   
2. **Complete Field Mappings** in `pdf-form-filler.ts`
   - ET1 fields (name, address, ACAS cert, claim details)
   - N1 fields (parties, claim value, brief details)
   - SSCS1 fields (appellant, DWP decision, grounds)
   
3. **Implement Full PDF Pipeline**
   - Download official blank PDF
   - Fill fields using pdf-lib
   - Attach to case as completed PDF
   - Allow user to download filled form
   
4. **Store Official PDFs** (optional)
   - Cache official forms in `/public/official-forms/`
   - Avoid downloading on every generation
   
5. **Hybrid Approach** (forms with narrative sections)
   - N1: Fill form fields + attach AI-generated Particulars
   - ET1: Fill sections 1-4 + AI-generate section 5 narrative

## File Structure

```
src/
├── lib/
│   ├── legal/
│   │   ├── form-registry.ts         # Form metadata & validation
│   │   ├── form-types.ts            # NEW: FILLABLE vs GENERATED classification
│   │   └── routing-types.ts
│   ├── ai/
│   │   ├── system3-generation.ts    # UPDATED: Routes based on form type
│   │   ├── legal-accuracy-rules.ts  # NEW: Legal standards for all docs
│   │   └── form-templates-full.ts   # UPDATED: Legal accuracy integrated
│   └── pdf/
│       └── pdf-form-filler.ts       # NEW: PDF form-filling service
```

## How It Works Now

### For FILLABLE PDFs (ET1, N1, SSCS1, etc.):
1. System 2 (routing) selects "UK-ET1-EMPLOYMENT-TRIBUNAL-2024"
2. System 3 checks: `isFormFillablePDF("UK-ET1-...")` → TRUE
3. System 3 generates **guidance document** (temporary solution)
4. User downloads official ET1 from GOV.UK
5. User fills it using the guidance provided
6. User submits to tribunal

### For GENERATED Documents (Particulars, Letters, etc.):
1. System 2 selects "UK-N1-PARTICULARS-OF-CLAIM"
2. System 3 checks: `isFormGenerated("UK-N1-PARTICULARS-OF-CLAIM")` → TRUE
3. System 3 uses Claude/GPT to **write the document from scratch**
4. Legal accuracy rules enforced (self-employed terminology, quantum meruit, etc.)
5. User downloads ready-to-file Particulars of Claim

## Benefits

✅ Legally accurate - uses official government forms where required
✅ Compliant - doesn't create fake versions of official forms
✅ Scalable - easy to add new forms (just classify in form-types.ts)
✅ Flexible - can fill PDFs OR generate documents as appropriate
✅ User-friendly - provides clear guidance for manual completion (for now)

## Testing

To test the system:

1. **Create a case** (e.g., employment dispute)
2. **Let it route** to ET1 form
3. **Generate documents** - should see guidance document
4. **Check logs** - should see:
   ```
   [System 3] ⚠️  UK-ET1-EMPLOYMENT-TRIBUNAL-2024 is an OFFICIAL FILLABLE PDF FORM
   [System 3] 📝 Generating AI-written guidance document instead
   ```

5. **For generated docs** (Particulars of Claim):
   ```
   [System 3] ✍️  UK-N1-PARTICULARS-OF-CLAIM is a GENERATED DOCUMENT
   [System 3] Selected model: claude-opus-4
   ```

## Summary

DisputeHub now has a **clear separation** between:
- Official forms (respect government PDFs, provide guidance)
- Generated documents (AI writes from scratch with legal accuracy)

This ensures legal compliance while providing maximum automation where appropriate.
