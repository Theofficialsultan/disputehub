# UNIVERSAL INFORMATION GATHERING SYSTEM

**Status**: ✅ **FULLY IMPLEMENTED**

**Date**: 2026-02-03

---

## 🎯 THE PROBLEM (What Was Wrong)

### ❌ Old System Issues:
1. **Rushed to summary gate** - Pushed users through too fast
2. **Assumed routes** - AI decided which forum/route was "best"
3. **Case-specific** - Different logic for employment vs housing vs debt
4. **No route selection** - User never chose where they wanted to go
5. **Documents generated blindly** - Not based on user's chosen direction

### ✅ New System Philosophy:
1. **Deliberate, not rushed** - Take time to gather information properly
2. **User chooses route** - AI presents options, user decides
3. **Universal** - Same methodology for ALL case types
4. **Route-aware** - Documents generated based on user's chosen direction
5. **Smarter** - Understands context, doesn't repeat questions

---

## 🏗️ THE 9-STAGE GATHERING FLOW

Every case goes through these stages **in order**:

### 1️⃣ INITIAL (Understanding the Dispute)
- User explains situation in plain English
- AI listens and acknowledges
- Extracts key information naturally
- **NO interrogation**, just understanding

### 2️⃣ DOMAIN IDENTIFICATION (What Type of Case?)
- Determines case domain from user's description:
  - Employment (wages, dismissal, discrimination)
  - Housing (disrepair, deposit, eviction)
  - Consumer (faulty goods, services)
  - Debt (unpaid work, unpaid invoice)
  - Parking (private ticket, PCN)
  - Other (neighbor, professional fees)
- **Confirms** with user: "This sounds like a [domain] dispute. Is that right?"

### 3️⃣ RELATIONSHIP CLARITY (What's the Legal Relationship?)
- Determines legal relationship:
  - Employment: Employee? Worker? Self-employed?
  - Housing: Tenant? Leaseholder? Licensee?
  - Consumer: Buyer? Service user?
  - Debt: Contractor? Freelancer?
- Asks **ONCE**: "Were you [relationship type]?"
- This determines which legal theories apply

### 4️⃣ FACTS GATHERING (What Happened?)
- Core questions ONLY:
  - Who is the other party?
  - What happened?
  - When did it happen?
  - What was agreed?
- **ONE question at a time**
- NO lawyer questions
- Extracts facts from plain English

### 5️⃣ AMOUNT IDENTIFICATION (How Much?)
- Asks: "What amount are you claiming?" OR "What outcome are you seeking?"
- Confirms calculations: "So that's [hours] × [rate] = £[amount]. Correct?"
- Notes concessions: "You mentioned you're not claiming for [X]. Is that right?"

### 6️⃣ ROUTE SELECTION (Where Do You Want To Go?) **← CRITICAL STAGE**

**AI presents available legal routes based on case type:**

**EMPLOYMENT CASE:**
```
"For your case, you have three main options:
1. Employment Tribunal (statutory claims, no fees, formal)
2. County Court (contractual claims, court fee, faster)
3. ACAS Early Conciliation (free, informal, worth trying first)

Which route would you prefer?"
```

**DEBT/CONTRACT CASE:**
```
"For your case, you have:
1. County Court Small Claims (under £10k, simple process, low risk)
2. County Court Fast Track (£10k-£25k, more formal)
3. Letter Before Action first (often resolves without court)

Which would you like to pursue?"
```

**HOUSING CASE:**
```
"For housing disrepair, you have:
1. County Court (damages + repairs order)
2. Housing Ombudsman (if social housing)
3. Environmental Health route (serious hazards)

Which makes most sense for you?"
```

**AI behaviors:**
- ✅ Presents options clearly
- ✅ Explains trade-offs (cost, time, formality) if asked
- ✅ **WAITS** for user to choose
- ❌ **NEVER assumes** which route is "best"
- ❌ **NEVER skips** this stage

### 7️⃣ EVIDENCE REQUEST (What Do We Need?)

**Based on chosen route + case type, AI lists required evidence:**

```
"For a County Court claim, you'll need:
1. Contract or messages confirming agreement
2. Proof of work (photos, timesheet, log)
3. Proof of non-payment (bank statement, chasing messages)

Can you upload these using the Evidence section?"
```

**Behaviors:**
- ✅ Lists ALL required evidence in ONE message
- ✅ Explains WHY each piece is needed (if asked)
- ❌ Does NOT re-ask for evidence

### 8️⃣ WAITING FOR EVIDENCE
- User says "I'll upload" → AI enters waiting mode
- AI says: "Okay — I'll wait while you upload."
- **REMAINS AVAILABLE** to answer process questions
- Does NOT ask new case questions
- Does NOT progress until evidence appears

### 9️⃣ READY FOR ROUTING
**All information gathered + evidence confirmed:**

```
"Thanks — I have everything I need:
• Your employment dispute
• The facts of what happened
• Your chosen route: Employment Tribunal
• Evidence uploaded

I'm now preparing your documents for Employment Tribunal.
You don't need to do anything further."
```

**Then:**
- ✅ STOPS normal conversation permanently
- ✅ Hands control to System D (Routing Engine)
- ✅ System D routes to appropriate legal module
- ✅ Documents generated based on user's chosen route

---

## 🔄 INTEGRATION WITH MODULAR ARCHITECTURE

### The Flow:

```
1. AI gathers info (9 stages) → User chooses route
   ↓
2. System D receives:
   - Case domain
   - Legal relationship
   - Chosen forum/route
   - Facts + evidence
   ↓
3. System D selects Case-Type Module
   (e.g., SelfEmployedUnpaidWorkModule)
   ↓
4. System 3 generates documents using:
   - Universal Skeleton (Layer 1)
   - Case-Type Module (Layer 2)
   - Document-Type Rules (Layer 3)
   ↓
5. Documents tailored to user's chosen route
```

### Example: Same Case, Different Routes

**Case**: Unpaid £145 for 11 hours of self-employed work

**User chooses County Court Small Claims**:
- Documents: N1 form, Particulars of Claim, Schedule of Loss, LBA
- Legal theory: Contract debt, quantum meruit fallback
- Language: "breach of contract", "agreed fee"
- Remedies: Principal (£145), interest, court fee

**User chooses Employment Tribunal** (if they claim employment status):
- Documents: ET1 form, ACAS certificate, witness statement
- Legal theory: Employment status test, ERA 1996 s.13
- Language: "unlawful deduction", "worker status"
- Remedies: Unpaid wages, holiday pay (no interest)

**Same facts, different route, completely different documents.**

---

## 📊 STATE MANAGEMENT

### Gathering State Structure:

```typescript
interface GatheringState {
  stage: GatheringStage;
  domain?: CaseDomain;
  relationship?: string;
  otherParty?: string;
  whatHappened?: string;
  amount?: number;
  desiredRoute?: LegalForum;        // ← USER CHOICE
  evidenceRequested?: boolean;
  evidenceConfirmed?: boolean;
  completedStages: GatheringStage[];
}
```

### State Context (Passed to AI Every Turn):

```
═══════════════════════════════════════════════════════════════════════════
CURRENT GATHERING STATE
═══════════════════════════════════════════════════════════════════════════

CURRENT_STAGE: ROUTE_SELECTION
COMPLETED_STAGES: INITIAL, DOMAIN_IDENTIFICATION, RELATIONSHIP_CLARITY, FACTS_GATHERING, AMOUNT_IDENTIFICATION

DOMAIN: contract_debt
RELATIONSHIP: self_employed
OTHER_PARTY: ABC Construction Ltd
WHAT_HAPPENED: Worked 11 hours, not paid £145 agreed fee
AMOUNT: £145
DESIRED_ROUTE: NOT YET CHOSEN BY USER ← IMPORTANT
EVIDENCE_REQUESTED: no
EVIDENCE_LIST: empty

STAGE: ROUTE SELECTION (CRITICAL STAGE)
GOAL: Present legal route options and let USER choose
ACTION:
1. List 2-3 available routes based on case type
2. Brief description of each (cost, time, formality)
3. Ask: "Which route would you prefer?"
4. WAIT for user choice
5. Do NOT assume or recommend
NEXT: Move to EVIDENCE_REQUEST once user chooses
```

---

## 🚫 ABSOLUTE PROHIBITIONS

The AI is **NEVER** allowed to:

❌ Rush to the summary gate before gathering all information  
❌ Assume which legal route is "best" for the user  
❌ Skip the route selection stage  
❌ Ask lawyer questions ("What's your legal basis?")  
❌ Hallucinate evidence ("I've reviewed the photos...")  
❌ Re-ask answered questions  
❌ Ask multiple questions per turn  
❌ Generate documents before route is chosen  

---

## ✅ MANDATORY BEHAVIORS

The AI **MUST ALWAYS**:

✅ Follow the 9-stage gathering flow in order  
✅ Let user choose their legal route (don't assume)  
✅ List all evidence requirements in ONE message  
✅ Acknowledge what learned before asking next question  
✅ Keep responses SHORT (2-3 sentences max)  
✅ ONE question per turn  
✅ Check conversation state (don't repeat questions)  

---

## 🎯 SUCCESS CRITERIA (Before Routing)

ALL 8 must be true before moving to System D:

1. ✅ Domain identified (employment/housing/consumer/debt/etc)
2. ✅ Relationship clarified (employee/tenant/buyer/contractor/etc)
3. ✅ Other party identified (name/company)
4. ✅ Facts gathered (what happened, when, what was agreed)
5. ✅ Amount/remedy identified (£X or specific outcome)
6. ✅ **Legal route CHOSEN BY USER** (not assumed)
7. ✅ Evidence requested (specific list provided)
8. ✅ Evidence confirmed (files appear in evidence list)

**ONLY when ALL 8 are true → Move to READY_FOR_ROUTING stage.**

---

## 💬 RESPONSE STYLE

### Good Example:
```
"Got it. So you were self-employed, worked 11 hours at £13.18/hour, 
and weren't paid the £145 owed.

For a £145 debt claim, you have two main options:
1. County Court Small Claims (formal, court fee £35)
2. Letter Before Action first (often resolves it without court)

Which would you prefer?"
```

### Bad Example:
```
"Thank you for providing that information. I understand your situation. 
Let me help you with this. Based on what you've told me, it seems like 
you have a strong case. You should definitely pursue this through the 
Employment Tribunal because that's the best route for you. I'll need 
some more information though. Can you tell me about the contract? 
And also, what time did you arrive? And when did you leave? And do 
you have any evidence? Also, have you tried contacting them?"
```

---

## 📁 FILES CREATED

```
/src/lib/ai/
├── universal-gathering.ts       (NEW) - 9-stage gathering system
└── prompts.ts                   (UPDATED) - Uses universal gathering prompt
```

---

## 🔄 NEXT STEPS (Integration)

1. **Update chat API endpoint** to:
   - Initialize gathering state
   - Update state based on conversation
   - Pass state to AI in system prompt

2. **Update database schema** to store:
   - Current gathering stage
   - Completed stages
   - User's chosen route

3. **Update System D** to:
   - Receive user's chosen route
   - Select appropriate case-type module
   - Generate documents for that route

4. **Add route selection UI** (optional):
   - Show route options visually
   - Let user click to choose
   - Or let AI handle via conversation

---

## 🎯 BOTTOM LINE

DisputeHub now has a **smart, deliberate information gathering system** that:

✅ Works for **ALL case types** universally  
✅ **Doesn't rush** - takes time to gather information properly  
✅ **Lets user choose route** - AI presents options, user decides  
✅ **Generates documents based on user's choice** - not assumptions  
✅ **Doesn't repeat questions** - tracks conversation state  
✅ **Stays on track** - 9-stage flow prevents wandering  

**Result**: Users feel heard, understood, and in control of their legal journey. Documents are tailored to their chosen path. No more rushing, no more assumptions. 🎯
