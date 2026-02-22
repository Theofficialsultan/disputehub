# MODULAR DOCUMENT ARCHITECTURE - THE RIGHT MENTAL MODEL

**Status**: ✅ **FULLY IMPLEMENTED**

**Date**: 2026-02-03

---

## 🧠 THE CRITICAL INSIGHT

### ❌ Wrong Approach (What I Built First)
- "One N1 layout"
- "One LBA layout"  
- "One witness statement layout"

**Why it fails**:
- Different forums → different rules
- Different legal tests → different content
- Different remedies → different claims
- Different evidential burdens → different requirements

### ✅ Correct Approach (What's Now Built)

**You build**: Universal skeleton + domain-specific inserts

**Structure is fixed, content logic adapts per case type.**

---

## 🏗️ THE 3-LAYER ARCHITECTURE

### LAYER 1: UNIVERSAL DOCUMENT SKELETON (NEVER CHANGES)

Every document, in every case type, follows this order:

1. **Header** (parties, date)
2. **Parties** (claimant, defendant)
3. **Purpose of document** (what this document does)
4. **Facts (chronological)** ← Populated from locked facts
5. **Legal basis (domain-specific)** ← Populated by Case-Type Module
6. **Relief / Outcome sought** ← Filtered by Case-Type Module
7. **Evidence reference** (exhibit list)
8. **Statement of truth / closing** (CPR wording or signature)

**This NEVER changes.**

**What changes**: What goes inside sections 4-6.

**File**: `/src/lib/legal/universal-skeleton.ts`

---

### LAYER 2: CASE-TYPE LOGIC MODULES (THE KEY)

Each case type plugs into the skeleton with **domain-specific rules**.

**File**: `/src/lib/legal/case-type-modules.ts`

#### Example: Self-Employed Unpaid Work (Contract Debt)

**Legal theory module**:
- Contract formation
- Substantial performance
- Quantum meruit fallback

**Allowed remedies**:
- ✅ Principal sum
- ✅ Interest (s.69 CCA 1984, optional)
- ❌ NO distress
- ❌ NO costs (small claims)

**Evidence expectations**:
- Critical: Agreement proof, attendance proof, non-payment proof
- Recommended: Bank statement, chasing messages

**Language rules**:
- Use: "breach of contract", "agreed fee", "services rendered"
- Avoid: "unfair dismissal", "unlawful deduction", "employment rights"

---

#### Example: Employment – Unpaid Wages

**Legal theory module**:
- Employment status test
- Unlawful deduction (ERA 1996 s.13)
- ACAS early conciliation prerequisite

**Allowed remedies**:
- ✅ Unpaid wages
- ✅ Unpaid holiday pay
- ✅ Notice pay (if applicable)
- ❌ NO interest (usually)
- ❌ NO county court language

**Evidence expectations**:
- Critical: Contract, payslips, timesheets, ACAS certificate
- Recommended: Shift patterns, messages about shifts

**Language rules**:
- Use: "unlawful deduction", "worker", "employment status", "ERA 1996"
- Avoid: "breach of contract", "quantum meruit", "common law"

---

#### Example: Housing Disrepair

**Legal theory module**:
- Landlord repairing obligations (LTA 1985 s.11)
- Fitness for human habitation (HFHH Act 2018)
- Notice given requirement

**Allowed remedies**:
- ✅ Rent abatement (proportional)
- ✅ Damages for discomfort
- ✅ Damages for property damage
- ✅ Repairs order

**Evidence expectations**:
- Critical: Photos of disrepair, notice to landlord
- Recommended: Environmental health report, doctor's note

**Language rules**:
- Use: "disrepair", "landlord's repairing obligations", "s.11 LTA 1985"
- Avoid: Generic "breach of contract"

---

#### Example: Private Parking Ticket

**Legal theory module**:
- Contractual signage
- Authority to contract
- Keeper liability (POFA 2012)

**Allowed remedies**:
- ✅ Appeal
- ✅ Cancellation
- ❌ NO money claim (this is defense, not claim)

**Evidence expectations**:
- Critical: Photos of signage (or lack thereof)
- Recommended: NTK timeline, entry/exit times

**Language rules**:
- Use: "Notice to Keeper", "POFA 2012", "contractual signage"
- Avoid: "criminal offense", "penalty", "fine" (it's a "charge")

---

### LAYER 3: DOCUMENT-TYPE RULES (ORTHOGONAL)

**File**: `/src/lib/legal/document-type-rules.ts`

Document-type rules apply **REGARDLESS of case type**. They define what each document type CAN and CANNOT do.

| Document | What it can do | What it must NOT do |
|----------|----------------|---------------------|
| **LBA** | Demand + deadline | Argue law |
| **PoC** | Plead facts + law | Describe evidence |
| **Witness Statement** | Facts only | Legal argument |
| **Schedule** | Numbers only | Narrative |
| **Evidence Bundle** | Index only | Opinion |

---

#### Letter Before Action Rules

**Allowed**:
- State facts briefly
- Make clear demand
- Set deadline (14 days)
- State consequences
- Reference pre-action protocol

**Forbidden**:
- Legal argument
- Detailed evidence description
- Emotional language
- Threats
- Speculation about motive

**Validation**:
- ✅ Must contain "14 days"
- ✅ Must reference "pre-action protocol"
- ❌ Must NOT contain "exhibit", "photo", "evidence bundle"

---

#### Particulars of Claim Rules

**Allowed**:
- Plead facts
- State legal basis
- Claim relief
- Reference statutory provisions
- Alternative legal theories

**Forbidden**:
- Describe evidence (that's for witness statement)
- Argue interpretation (that's for trial)
- Personal opinions
- Emotional language

**Validation**:
- ✅ Must contain "Statement of Truth"
- ✅ Must state precise monetary amount
- ❌ Must NOT contain "I believe" or "I think"

---

#### Witness Statement Rules

**Allowed**:
- State facts only
- Chronological narrative
- Reference exhibits
- Personal observations

**Forbidden**:
- Legal argument
- Opinions about law
- Conclusions about what evidence proves
- Describing photos (exhibit them, don't describe)
- Emotional language ("unfair", "wrong", "unjust")

**Validation**:
- ✅ Must contain "Statement of Truth"
- ✅ Should reference exhibits (A1, A2, etc.)
- ❌ Must NOT contain "unfair", "wrong", "clearly", "obviously"

---

#### Schedule of Loss Rules

**Allowed**:
- Numbers only
- Table format
- Clear calculation
- Line-by-line breakdown

**Forbidden**:
- Narrative prose
- Legal argument
- Speculation
- Padding

**Validation**:
- ✅ Must be in table format
- ✅ Must have clear total
- ⚠️ Length < 2 pages for claims under £1000

---

## 🔄 HOW THE SYSTEM WORKS

### Architecture Flow

```
CASE TYPE → LEGAL THEORY → ALLOWED REMEDIES → DOCUMENT RULES
```

### The 5-Question Pre-Generation Check

**Before generating ANY document**, the system must answer:

1. **What domain is this case?** (contract_debt, employment_wages, housing_disrepair, etc.)
2. **What legal theory applies?** (Contract formation, ERA 1996, LTA 1985, etc.)
3. **What forum will read this?** (County court, Employment tribunal, etc.)
4. **What document role am I playing?** (LBA, PoC, Witness statement, etc.)
5. **What am I forbidden from including?** (Costs, interest, distress damages, etc.)

**If it can't answer all five → hard stop. Document generation blocked.**

---

### Generation Steps

#### Step 1: Pre-Generation Check
```typescript
const preCheck = runPreGenerationCheck(caseProfile, documentType, lockedFacts);
if (!preCheck.canGenerate) {
  throw new Error(`Cannot generate: ${preCheck.blockers.join("; ")}`);
}
```

#### Step 2: Load Modules
```typescript
const caseModule = selectCaseTypeModule(caseProfile); // e.g. SelfEmployedUnpaidWorkModule
const documentRules = DOCUMENT_TYPE_RULES_REGISTRY[documentType]; // e.g. LETTER_BEFORE_ACTION_RULES
```

#### Step 3: Build Context
```typescript
const context: DocumentContext = {
  caseModule,         // Legal theories, allowed remedies, evidence requirements
  lockedFacts,        // Immutable user-confirmed facts
  documentType,       // LBA, PoC, witness statement, etc.
  caseDetails,        // Parties, claim value, forum
  evidence           // Available exhibits
};
```

#### Step 4: Generate from Skeleton
```typescript
const content = generateFromSkeleton(context);
// Combines: Universal skeleton + Case-type module + Document-type rules
```

#### Step 5: Validate
```typescript
const skeletonValidation = validateSkeletonCompliance(content, documentType);
const documentTypeValidation = validateDocumentTypeRules(content, documentType);
// Score: 0-10 for each layer
```

---

## 🔒 WHY THIS SOLVES THE PROBLEMS

### ✅ No More £50k Schedules
**How**: Schedule module checks proportionality vs claim value.

**Rule**: `claim_value < £1000` → `maxLength: "2 pages"`

### ✅ No Wrong Language
**How**: Forum language guard runs before output.

**Rule**: `employment_wages` → use "unlawful deduction", avoid "breach of contract"

### ✅ No Hallucinated Facts
**How**: Fact-lock feeds every generator.

**Rule**: All facts must come from `lockedFacts`, no invention allowed.

### ✅ No Judge-Annoying Fluff
**How**: Document role rules strip it out.

**Rule**: LBA → forbidden: "legal argument", "evidence descriptions"

---

## 🧨 THE POWER MOVE (FUTURE)

This architecture unlocks:

### 1. Multi-Route Simulation
```
"If you go tribunal vs court, here's what changes..."
```
- Same facts → different legal theories
- Same evidence → different evidential burdens
- Different remedies → different claim values

### 2. Auto-Downgrade Claims
```
"Your claim is £145. County court small claims is cheapest and fastest."
```
- System suggests optimal forum
- Prevents over-claiming
- Minimizes cost/risk

### 3. Lawyer-Grade Credibility Without Lawyer Cost
- Proper structure = credibility
- Proper language = professionalism
- Proper remedies = judge-tolerance

**That's how this becomes dangerous (in a good way).**

---

## 📁 FILE STRUCTURE

```
/src/lib/legal/
├── case-type-modules.ts        ← Layer 2: Domain-specific legal logic
├── universal-skeleton.ts       ← Layer 1: Immutable document structure
├── document-type-rules.ts      ← Layer 3: Orthogonal document restrictions
└── modular-generator.ts        ← Master orchestrator combining all layers
```

---

## 🎯 IMPLEMENTATION STATUS

### ✅ Completed

1. **Case-Type Modules** (4 modules implemented):
   - Self-Employed Unpaid Work (Contract Debt)
   - Employment – Unpaid Wages
   - Housing Disrepair
   - Private Parking Ticket

2. **Universal Skeleton** (8 sections):
   - Header, Parties, Purpose, Facts, Legal Basis, Relief, Evidence, Closing

3. **Document-Type Rules** (5 document types):
   - Letter Before Action
   - Particulars of Claim
   - Witness Statement
   - Schedule of Loss
   - Evidence Bundle

4. **Modular Generator**:
   - 5-question pre-generation check
   - Module loader
   - Skeleton generator
   - Dual validation (skeleton + document-type)

### 🔄 Next Steps

1. **Integration with System 3**:
   - Wire modular generator into `system3-generation.ts`
   - Replace old document-structures system
   - Use case-type detection from routing decision

2. **Additional Case Modules**:
   - Consumer goods (Sale of Goods Act)
   - Professional fees
   - Landlord/tenant deposit disputes
   - Neighbor disputes

3. **Advanced Features**:
   - Multi-route simulation
   - Auto-downgrade suggestions
   - Cost/risk analysis per route

---

## 🧪 TESTING

### Test Case 1: Self-Employed Unpaid Work → LBA

**Input**:
```typescript
caseProfile = {
  domain: "contract_debt",
  forum: "county_court_small_claims",
  relationship: "self_employed",
  claimValue: 145
}
documentType = "letter_before_action"
```

**Expected Output**:
- ✅ Universal skeleton structure (8 sections)
- ✅ Contract debt legal theories (contract formation, substantial performance, quantum meruit)
- ✅ Allowed remedies only (principal, interest, court fee)
- ✅ LBA document rules (no legal argument, no evidence description)
- ✅ Pre-action protocol reference
- ✅ 14-day deadline
- ✅ Validation score: 9-10/10

---

### Test Case 2: Employment → Particulars of Claim

**Input**:
```typescript
caseProfile = {
  domain: "employment_wages",
  forum: "employment_tribunal",
  claimValue: 500
}
documentType = "particulars_of_claim"
```

**Expected Output**:
- ✅ Universal skeleton structure
- ✅ Employment legal theories (employment status test, ERA 1996 s.13, ACAS)
- ✅ Tribunal-specific language ("unlawful deduction", NOT "breach of contract")
- ✅ No interest claim (forbidden in ET)
- ✅ Statement of Truth
- ✅ Validation score: 9-10/10

---

## 🎯 BOTTOM LINE

DisputeHub now has the **RIGHT mental model**:

**❌ Before**: One layout per document type (inflexible, breaks across domains)

**✅ Now**: Universal skeleton + pluggable modules (scales to infinite case types)

This is **legal machinery**, not AI text. The structure is **constitutional**, the logic is **domain-specific**, and the rules are **enforceable**.

**Result**: Court-ready documents that adapt to ANY case type, ANY forum, ANY document type. 🎯
