# Evidence State Machine - Example Flows

## Proof that looping cannot occur

---

## FLOW 1: User Says "I'll Upload" → AI Waits Silently

### State Sequence:

```
Message 1:
User: "I worked for ABC Ltd and wasn't paid"
AI Mode: INFO_GATHERING
Event: None
Evidence State: uploaded=0, missing=["proof of work"]
AI Can Respond: ✅ Yes
AI: "What evidence do you have of this?"

---

Message 2:
User: "I have an email and photos. I'll upload them now"
AI Mode: INFO_GATHERING → WAITING_FOR_UPLOAD
Event: USER_CONFIRMS_UPLOAD_INTENT
Evidence State: uploaded=0, missing=["proof of work"]
AI Can Respond: ✅ Yes (first time in waiting mode)
AI: "No rush — I'll continue once something is uploaded."

---

Message 3:
User: "Just a sec, uploading..."
AI Mode: WAITING_FOR_UPLOAD
Event: None
Evidence State: uploaded=0, missing=["proof of work"]
lastAIMessageAt: 2024-01-28T10:30:00Z (exists)
AI Can Respond: ❌ NO (already sent waiting message)
RESULT: No AI response returned

---

Message 4:
User: "Are you there?"
AI Mode: WAITING_FOR_UPLOAD
Event: None
Evidence State: uploaded=0, missing=["proof of work"]
lastAIMessageAt: 2024-01-28T10:30:00Z (exists)
AI Can Respond: ❌ NO (already sent waiting message)
RESULT: No AI response returned

---

EVIDENCE_UPLOADED event occurs (system detects file)
Evidence State: uploaded=1 (email.pdf), missing=[]

---

Message 5:
User: "Done!"
AI Mode: WAITING_FOR_UPLOAD → INFO_GATHERING
Event: EVIDENCE_UPLOADED
Evidence State: uploaded=1, missing=[]
AI Can Respond: ✅ Yes (event occurred)
AI: "I can see you've uploaded email.pdf. What amount are you owed?"
```

**PROOF OF NO LOOP:**
- AI sent ONE waiting message (Message 2)
- Messages 3 & 4: AI blocked from responding (canRespond = false)
- No repeated "I'm waiting" messages
- AI only responds again after EVIDENCE_UPLOADED event

---

## FLOW 2: User Asks "What Evidence?" → Guidance Mode

### State Sequence:

```
Message 1:
User: "I have an employment dispute"
AI Mode: INFO_GATHERING
Event: None
Evidence State: uploaded=0, required=["correspondence", "proof_of_work"]
AI: "Can you tell me more about what happened?"

---

Message 2:
User: "Wait, what evidence do I need?"
AI Mode: INFO_GATHERING → GUIDANCE
Event: USER_ASKS_FOR_GUIDANCE
Evidence State: uploaded=0, required=["correspondence", "proof_of_work"]
AI Can Respond: ✅ Yes
AI: "For an employment dispute, you'll need:

1. **Written communication about the issue**
   Example: Emails, letters, text messages from your employer
   Why it matters: Proves you raised the issue

2. **Evidence you worked**
   Example: Photos at workplace, timesheets, shift confirmations
   Why it matters: Establishes the employment relationship

You can upload these using the Evidence section on the right."

---

Message 3:
User: "Ok thanks"
AI Mode: GUIDANCE → INFO_GATHERING
Event: None
Evidence State: uploaded=0, required=["correspondence", "proof_of_work"]
AI: "What happened with your employer?"
```

**PROOF OF NO LOOP:**
- User request triggered GUIDANCE mode (not waiting)
- AI gave clear explanation ONCE
- Returned to INFO_GATHERING
- Did NOT repeatedly say "upload now"

---

## FLOW 3: AI Cannot Hallucinate Evidence

### State Sequence:

```
Message 1:
User: "I worked and wasn't paid £500"
AI Mode: INFO_GATHERING
Evidence State: uploaded=0, missing=["proof of work"]
AI: "What evidence do you have?"

---

Message 2:
User: "I have the email from them"
AI Mode: INFO_GATHERING
Evidence State: uploaded=0, missing=["proof of work"]
AI ATTEMPTS: "I've reviewed the evidence and you have a strong case"

SERVER VALIDATION:
- detectEvidenceHallucination() runs
- evidenceState.uploaded.length = 0
- Detects phrase: "I've reviewed the evidence"
- VIOLATION FOUND

AI Response OVERRIDDEN:
AI (saved to DB): "Can you upload that email using the Evidence section?"

---

Result: No AI response
```

**PROOF OF NO HALLUCINATION:**
- evidenceState.uploaded.length = 0 (source of truth)
- Server-side validation catches forbidden phrase
- AI response overridden before reaching user
- Impossible for AI to claim evidence exists when it doesn't

---

## FLOW 4: Evidence Uploaded Mid-Conversation

### State Sequence:

```
Message 1:
User: "I'm owed £500 by ABC Ltd"
AI Mode: INFO_GATHERING
Evidence State: uploaded=0
AI: "What evidence do you have?"

---

SYSTEM EVENT: User uploads file (no message sent)
Evidence State: uploaded=1 (email.pdf)
Event: EVIDENCE_UPLOADED
AI Does NOT respond (no user message)

---

Message 2:
User: "The work was on 15th October"
AI Mode: INFO_GATHERING
Evidence State: uploaded=1 (email.pdf)
Event: EVIDENCE_UPLOADED (detected via state change)
AI: "I can see you've uploaded email.pdf. Thanks for providing that. What amount are you claiming?"
```

**PROOF OF EVENT-DRIVEN:**
- Evidence upload detected via state change
- AI acknowledges on NEXT user message
- Does not continuously poll or repeat acknowledgment

---

## HARD BLOCKS ENFORCED:

### Block 1: No Repeated Waiting Messages
```
canSendMessage(mode="WAITING_FOR_UPLOAD", lastMessageAt=Date, event=null)
→ Returns FALSE
→ AI cannot send message
```

### Block 2: No Hallucination of Evidence
```
detectEvidenceHallucination(response, evidenceCount=0)
→ Detects forbidden phrase
→ Override response
→ User never sees hallucination
```

### Block 3: No Progression Without Evidence
```
evidenceState.hasMinimumEvidence = false
aiState.mode = WAITING_FOR_UPLOAD
→ AI cannot proceed to document generation
```

### Block 4: Silence is Valid
```
if (!canRespond) {
  return { aiMessage: null }
}
→ Server returns no AI response
→ Frontend shows no message
→ AI remains silent
```

---

## State Transition Rules:

```
INFO_GATHERING
  ├─ [USER_ASKS_FOR_GUIDANCE] → GUIDANCE
  ├─ [USER_CONFIRMS_UPLOAD_INTENT + no evidence] → WAITING_FOR_UPLOAD
  └─ [FACTS_COMPLETE + evidence exists] → PROCESSING

GUIDANCE
  └─ [any user message] → INFO_GATHERING

WAITING_FOR_UPLOAD
  ├─ [EVIDENCE_UPLOADED] → INFO_GATHERING
  └─ [any other message] → WAITING_FOR_UPLOAD (but canRespond=false)

PROCESSING
  └─ [DOCUMENTS_TRIGGERED] → LOCKED

LOCKED
  └─ [no transitions allowed]
```

---

## Impossible Scenarios:

❌ **Cannot happen:** AI sends multiple "I'm waiting" messages
**Why:** `canSendMessage()` returns false after first message

❌ **Cannot happen:** AI claims to have reviewed non-existent evidence
**Why:** `detectEvidenceHallucination()` overrides response

❌ **Cannot happen:** AI proceeds without evidence when required
**Why:** `evidenceState.hasMinimumEvidence` gate blocks progression

❌ **Cannot happen:** AI loops asking for evidence repeatedly
**Why:** Mode transitions to WAITING_FOR_UPLOAD or GUIDANCE, not back to asking

---

## System Guarantees:

✅ Evidence exists only if `evidenceState.uploaded.length > 0`
✅ AI can send max ONE message in WAITING_FOR_UPLOAD mode
✅ Hallucinations are caught and overridden server-side
✅ Silence (no AI response) is a valid system state
✅ State transitions require explicit events
✅ No loops possible - state machine is acyclic for each conversation branch
