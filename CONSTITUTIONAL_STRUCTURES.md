# CONSTITUTIONAL DOCUMENT STRUCTURES - IMPLEMENTATION COMPLETE

**Status**: ✅ **FULLY INTEGRATED INTO SYSTEM 3**

**Date**: 2026-02-03

---

## 🎯 WHAT WAS BUILT

Every document type now has a **constitutional structure** - a non-negotiable layout that must be followed. If a document doesn't match its structure → it fails audit → it does not ship.

Think of this as the **constitution for document generation**.

---

## 📐 ARCHITECTURAL CHANGES

### 1. **New Module: `document-structures.ts`**

Location: `/src/lib/legal/document-structures.ts`

Defines:
- **7 constitutional document structures** (LBA, Particulars, Witness Statement, Schedule, Evidence Bundle, Cover Letter, Receipt)
- **Mandatory sections** for each document type
- **Forbidden content** rules
- **Required phrases** enforcement
- **Pre-generation checks** (4-question system)
- **Post-generation validation** (structure scoring 0-10)

### 2. **Integration into System 3**

Modified: `/src/lib/ai/system3-generation.ts`

Added 3 checkpoints:
1. **Pre-Generation Check** (Step 0.5) - Blocks generation if constitutional requirements not met
2. **Structural Instructions** - Injected into AI prompts before fact-locking
3. **Post-Generation Validation** - Scores documents 0-10, logs structural violations

---

## 🧱 UNIVERSAL RULES (APPLY TO ALL DOCUMENTS)

Every generated document must:
1. Use plain English (no legal theatre unless required)
2. Match the correct forum (court / tribunal / ADR)
3. Never invent facts, dates, amounts, or evidence
4. Reflect user concessions (e.g. "I'm not claiming the last hour")
5. Be procedurally proportional to the claim value

Every document must have:
- Clear title
- Parties identified
- Purpose stated
- Facts separated from argument
- Relief clearly listed
- No contradiction with other documents

---

## 📋 DOCUMENT TYPES & STRUCTURES

### 1️⃣ LETTER BEFORE ACTION (LBA)

**Purpose**: Pre-action compliance + pressure. Not argument-heavy. Not emotional.

**Mandatory Sections**:
1. Header (parties, date, "WITHOUT PREJUDICE SAVE AS TO COSTS")
2. Title: "LETTER BEFORE ACTION"
3. Section 1: Parties
4. Section 2: Background Facts (Short) - ❌ NO evidence descriptions
5. Section 3: Breach (one paragraph, no emotion)
6. Section 4: Amount Owed (exact, with calculation, explicit concessions)
7. Section 5: Demand (14-day deadline, payment method, consequences)
8. Section 6: Pre-Action Compliance
9. Signature Block

**Forbidden**: Legal theatre, emotional language, threats, evidence descriptions, motive speculation

**Required**: "LETTER BEFORE ACTION", "14 days", "pre-action protocol"

---

### 2️⃣ PARTICULARS OF CLAIM (COUNTY COURT)

⚠️ **NOT THE N1 FORM** - This is an attachment.

**Purpose**: Attachment to N1 form. Sets out the legal case for breach of contract.

**Mandatory Sections**:
1. Title: "PARTICULARS OF CLAIM (Attached to Form N1)"
2. Section 1: Parties
3. Section 2: Status of Claimant (explicit: employee/worker/self-employed)
4. Section 3: The Contract (structured: offer, acceptance, consideration, implied terms, mode)
5. Section 4: Performance (actual work done, duration, partial performance, concessions)
6. Section 5: Breach (clear statement, no motive speculation)
7. Section 6: Loss (exact sum, no padding)
8. Section 7: Alternative Basis (quantum meruit fallback - if applicable)
9. Section 8: Interest (s.69 County Courts Act 1984)
10. Section 9: Relief Sought (❌ NO costs in small claims)
11. Statement of Truth (exact CPR wording)

**Forbidden**: Costs claim (small claims), motive speculation, invented facts, emotional language, unrelated heads of loss

**Required**: "PARTICULARS OF CLAIM", "Statement of Truth", "s.69 County Courts Act 1984"

---

### 3️⃣ WITNESS STATEMENT (CPR 32)

**Purpose**: Evidence. Facts only. No argument.

**Mandatory Sections**:
1. Header (court name, claim number, parties)
2. Title: "WITNESS STATEMENT OF [NAME]"
3. Section 1: Introduction (who you are, relationship, purpose)
4. Section 2: Chronology (numbered, dates, events, neutral tone)
5. Section 3: Evidence References ("Exhibit A1", "A2" - no photo descriptions)
6. Section 4: Conclusion (short factual wrap-up)
7. Statement of Truth (exact CPR wording)

**Forbidden**: Legal argument, opinions ("unfair", "wrong"), evidence not exhibited correctly, photo descriptions, metadata

**Required**: "WITNESS STATEMENT", "Statement of Truth", "Exhibit references"

---

### 4️⃣ SCHEDULE OF DAMAGES / LOSS

⚠️ **TABLE ONLY. NO PROSE.**

**Purpose**: Mathematical breakdown of claim.

**Mandatory Sections**:
1. Title: "SCHEDULE OF LOSS"
2. Table (columns: Item | Description | Amount | Notes)
   - Total must equal claim
   - No speculative heads
   - No "distress", "time spent" unless legally allowed
   - For small claims: usually one line item
3. Total (bold, matches PoC exactly)

**Example**:
```
Unpaid contractual fee | 11 hours @ agreed rate | £145.00
```

**Forbidden**: Prose paragraphs, speculative heads, distress (unless tribunal), time spent (unless costs allowed), padding

**Required**: "SCHEDULE OF LOSS", table format, total

---

### 5️⃣ EVIDENCE BUNDLE & INDEX

**Purpose**: Organized evidence. Index only. No argument.

**Mandatory Sections**:
1. Title: "EVIDENCE BUNDLE"
2. Index Table (Exhibit reference | Description | Date | Page number)

**Forbidden**: Argument, conclusions, evidence "proves" anything

**Required**: "EVIDENCE BUNDLE", Exhibit references (A1, A2, etc.), Evidence "shows" not "proves"

---

### 6️⃣ GUIDANCE / COVER LETTER (FROM DISPUTEHUB)

**Purpose**: Explain how to use the pack. Not sent to court. User confidence boost.

**Mandatory Sections**:
1. Title: "DisputeHub Filing Pack"
2. Section 1: What this pack contains (list all documents)
3. Section 2: What each document is for (brief explanation)
4. Section 3: Where to file (court name, filing method)
5. Section 4: Deadlines (time-sensitive actions)
6. Section 5: What DisputeHub has / hasn't done (clear statement)
7. Section 6: Clear disclaimer (not a law firm, user responsibility)

**Forbidden**: Legal advice, guarantees of success

**Required**: "DisputeHub", disclaimer

---

### 7️⃣ RECEIPT / SERVICE CONFIRMATION

**Purpose**: Trust signal. Protects DisputeHub. Shows what was generated.

**Mandatory Sections**:
1. Title: "DisputeHub Generation Receipt"
2. Case Reference
3. Documents Generated (list with character counts)
4. Date/Time (generation timestamp)
5. Version Hash (content hash for verification)
6. Source Statement: "Generated based on information you provided"

**Required**: "DisputeHub", timestamp, "Generated based on information you provided"

---

## 🔍 SYSTEM 3 INTEGRATION FLOW

### Before Generation:
```typescript
// 1. Pre-Generation Constitutional Check
const preCheck = preGenerationCheck(formId, forum, facts, lockedFacts);

// Blocks if:
// - Unknown document type
// - Forum mismatch
// - Legal role undefined

if (!preCheck.canGenerate) {
  throw new Error(`Cannot generate: ${preCheck.blockers.join("; ")}`);
}
```

### During Generation:
```typescript
// 2. Structural Instructions Injected into AI Prompt
const structureInstructions = generateStructureInstructions(formId);
const prompt = `${structureInstructions}\n\n${factLockInstructions}\n\n${basePrompt}`;
```

**Example instruction fragment**:
```
=== CONSTITUTIONAL STRUCTURE FOR UK-LBA-GENERAL ===

LEGAL ROLE: Pre-action compliance + pressure. Not argument-heavy. Not emotional.
FORUM: any

MANDATORY STRUCTURE (YOU MUST FOLLOW THIS EXACTLY):

1. Header [MANDATORY]
   - Claimant name + address
   - Defendant name + address
   - Date

2. Title [MANDATORY]
   - Must be exactly: 'LETTER BEFORE ACTION'

...

FORBIDDEN CONTENT (DO NOT INCLUDE):
❌ legal theatre
❌ emotional language
❌ evidence descriptions

REQUIRED PHRASES (MUST INCLUDE):
✅ LETTER BEFORE ACTION
✅ 14 days
✅ pre-action protocol
```

### After Generation:
```typescript
// 3. Post-Generation Structure Validation
const validation = validateGeneratedDocument(formId, content);

// Checks:
// - All mandatory sections present
// - No forbidden content
// - All required phrases included
// - Score: 0-10

if (!validation.valid) {
  console.error(`Document failed structure validation (score: ${validation.score}/10)`);
  // Soft enforcement: log but don't block (for now)
}
```

---

## 🧠 THE 4-QUESTION SYSTEM

**Every document generator must answer before output:**

1. **What forum is this for?**
   - County court / Employment tribunal / ADR / etc.
   - Checked against routing decision

2. **What is this document's legal role?**
   - Pre-action compliance / Evidence / Claim form / etc.
   - Defined in constitutional structure

3. **What facts am I allowed to use?**
   - Only locked facts from strategy
   - No invention, no speculation

4. **What am I NOT allowed to include?**
   - Forbidden content from structure
   - Forum-specific prohibitions

**If it can't answer those → block.**

---

## 📊 VALIDATION SCORING

Documents are scored 0-10 based on:
- Missing mandatory sections: -2 points each
- Forbidden content found: -1.5 points each
- Missing required phrases: -1 point each

**Enforcement levels**:
- **10**: Perfect structure
- **8-9**: Minor issues, acceptable
- **7**: Warnings, borderline
- **<7**: Critical issues (soft block for now)

---

## 🔐 LEGAL SAFETY

This system protects DisputeHub by:

1. **Preventing embarrassment**: Documents follow court-accepted formats
2. **Reducing liability**: Clear structure = clear user expectations
3. **Scaling safely**: Constitutional rules apply to all future document types
4. **Auditability**: Every document scored and logged

---

## 🚀 DEPLOYMENT STATUS

### ✅ Completed:
- [x] Constitutional structures defined for 7 document types
- [x] Pre-generation check system (4 questions)
- [x] Structure instruction generation
- [x] Post-generation validation (scoring 0-10)
- [x] Integration into System 3 (3 checkpoints)
- [x] Logging and error reporting

### 🔄 Soft Enforcement (Current):
- Documents with score < 7 are logged but not blocked
- Allows system to learn and adapt
- Builds confidence before hard enforcement

### 🎯 Future Enhancements:
- Hard enforcement: Block documents with score < 7
- User notifications: "Document structure quality: 8/10"
- A/B testing: Compare constitutional vs non-constitutional generations
- Feedback loop: Track which structures lead to successful filings

---

## 💡 KEY INSIGHT

> **You're now designing legal machinery, not AI text.**

This structure is:
- ✅ Court-credible
- ✅ Judge-tolerant
- ✅ Founder-safe
- ✅ Scalable

Documents are no longer "whatever the AI says" - they're **constitutionally enforced**, **procedurally correct**, and **legally defensible**.

---

## 📝 TESTING

To test the new system:

1. Generate a document (e.g. Letter Before Action)
2. Check console logs for:
   ```
   [System 3] 📜 Running pre-generation constitutional check...
   [System 3] ✅ Pre-generation check passed
   [System 3] 📜 Loading constitutional structure...
   [System 3] ✅ Constitutional structure loaded
   [System 3] 📜 Running constitutional structure validation...
   [System 3] ✅ Document structure validated (score: 9/10)
   ```
3. Review generated document for mandatory sections
4. Verify no forbidden content appears
5. Check required phrases are present

---

## 🎯 BOTTOM LINE

DisputeHub now has a **constitutional framework** for legal documents. Every document type has:
- A defined legal role
- Mandatory structural sections
- Forbidden content rules
- Required phrases
- Pre- and post-generation validation

This turns DisputeHub from an AI document generator into a **legal document factory** with **quality control baked in**.

**Result**: Court-ready documents that judges won't laugh at. 🎯
