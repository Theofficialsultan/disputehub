# DisputeHub - Complete Case Flow Test

## 🎯 Test Objective
Verify the entire AI conversation → document generation flow works correctly with all Phase 8.6 fixes.

---

## 📋 Pre-Test Checklist

- [ ] Server running on **localhost:3009** (not 3010!)
- [ ] Browser console open (F12) to see any errors
- [ ] Fresh case (not an existing one)

---

## 🧪 Test Script - Employment Payment Dispute

### **Step 1: Start New Case**
1. Go to http://localhost:3009
2. Click "New Dispute"
3. Wait for AI greeting

**Expected**:
```
✅ AI says: "Hello! I'm your AI case assistant..."
```

---

### **Step 2: Describe the Dispute**
**You say**:
```
my employer didn't pay me 145£ for self employed traffic management work on October the 14th as I was meant to be onsite for 12hours but I left 30 mins early and I have pictures every hour so it shows I was there for the 11 hours. I told him no problem don't pay me for the final hour but give me the rest he has refused his name is Marvin and owns 24TM
```

**Expected AI Response**:
```
✅ AI acknowledges the situation
✅ AI asks ONE question (e.g., "What amount are you claiming?")
❌ AI does NOT ask "What specific breach are you claiming?" (lawyer question - blocked)
❌ AI does NOT say "I'm generating documents" (too early)
```

**Check Server Logs**:
```bash
[Sufficiency Check] Score: 50-75/100, Sufficient: false
[Sufficiency Check] Missing: evidence upload
```

---

### **Step 3: Provide Amount**
**You say**:
```
133
```

**Expected AI Response**:
```
✅ AI acknowledges the amount
✅ AI asks about evidence: "Do you have any evidence like emails, photos, or messages from 24TM?"
❌ AI does NOT repeat previous questions
```

**Check Server Logs**:
```bash
[Sufficiency Check] Score: 75/100, Sufficient: false
[Sufficiency Check] Missing: evidence upload
```

---

### **Step 4: Mention Evidence Intent**
**You say**:
```
yes I'll upload them now
```

**Expected AI Response**:
```
✅ AI says: "No rush — I'll continue once something is uploaded."
✅ Amber "Waiting for evidence upload..." banner appears in chat
✅ Status bar above input shows "AI is waiting for evidence upload"
✅ Input placeholder changes to "Upload evidence to continue..."
❌ AI does NOT send multiple "I'm waiting" messages
```

**Check Server Logs**:
```bash
[Chat] AI entered WAITING mode - will remain silent until evidence uploaded
```

**Check UI**:
- [ ] Amber waiting banner visible
- [ ] Status indicator above input
- [ ] Clock icon pulsing

---

### **Step 5: Upload Evidence**
1. Click "Evidence" section on the right
2. Click "Upload Evidence"
3. Upload 2-3 files (email screenshot, photos)
4. Return to case page

**Expected Behavior**:
```
✅ Amber "Waiting" banner DISAPPEARS immediately
✅ AI acknowledges: "I can see you've uploaded [filename]. Thank you."
✅ AI does NOT ask for evidence again
```

**Check Server Logs**:
```bash
[Chat] Evidence detected - clearing waiting mode
[Sufficiency Check] Score: 100/100, Sufficient: true
[Sufficiency Check] ✅ Case sufficient - using final confirmation
[Sufficiency Check] Triggering document generation...
```

---

### **Step 6: AI Final Confirmation**
**Expected AI Response** (exact wording):
```
Thanks — I have everything I need.

I'm now preparing your documents.

You don't need to do anything further.
```

**Expected UI Changes**:
```
✅ Chat input locks (shows system message)
✅ "Analyzing Legal Route" screen appears
✅ Clock icon with "We're determining the best legal pathway..."
```

**Check Server Logs**:
```bash
POST /api/disputes/[id]/documents/generate 200
[System 2] Starting routing engine...
[System 2] Legal relationship: worker (self-employed)
[System 2] Forum: County Court (Small Claims)
```

---

### **Step 7: Routing Decision Display**
**Wait 5-10 seconds**

**Expected UI Update**:
```
✅ "Legal Route Determined" screen appears
✅ Shows:
   - Legal Relationship: Worker
   - Forum: County Court (Small Claims)
   - Why This Route: "Self-employed workers cannot use Employment Tribunal..."
   - Documents to Generate:
     • Letter Before Action
     • Particulars of Claim (N1)
     • Evidence Bundle
   - Status: "Proceeding to document generation..."
```

**Check Server Logs**:
```bash
[System 2] ✅ Routing complete
[System 2] Forum: County Court
[System 2] Confidence: 0.95
[System 3] Starting document generation...
```

---

### **Step 8: Document Generation**
**Wait 30-60 seconds**

**Expected UI Changes**:
```
✅ Phase changes to "GENERATING"
✅ Chat input shows: "Generating Documents - Your legal documents are being created..."
✅ Documents section on right shows:
   - Letter Before Action (GENERATING → COMPLETED)
   - Particulars of Claim (GENERATING → COMPLETED)
   - Evidence Bundle (GENERATING → COMPLETED)
✅ Progress indicators update in real-time
```

**Check Server Logs**:
```bash
[System 3] Generating: Letter Before Action
[System 3] Using model: GPT-4o
[System 3] ✅ Document generated: 2847 chars
[System 3] Validation: PASSED (3 warnings)
[System 3] PDF created: /storage/documents/...
```

---

### **Step 9: Documents Complete**
**Expected Final State**:
```
✅ Phase: COMPLETED
✅ Chat input shows: "Documents Ready - Your documents are complete!"
✅ Documents section shows:
   - All documents with green checkmarks
   - Download buttons active
   - File sizes visible
✅ Timeline shows all events:
   - Case created
   - Evidence uploaded
   - Documents generated
   - Documents completed
```

**Check Documents**:
- [ ] Click download on each document
- [ ] PDFs open correctly
- [ ] Content is NOT empty
- [ ] Content is NOT generic "case summary"
- [ ] Content matches the case facts

---

## ✅ Success Criteria

### **Conversation Quality**
- [ ] AI asked 2-3 questions maximum
- [ ] No "lawyer questions" (justify, specify breach, etc.)
- [ ] No repeated questions
- [ ] Evidence acknowledged correctly
- [ ] Final confirmation message was exact wording
- [ ] AI went silent after confirmation

### **Evidence Handling**
- [ ] Waiting mode activated when user said "I'll upload"
- [ ] Waiting UI appeared (amber banner + status)
- [ ] Waiting mode cleared immediately after upload
- [ ] AI acknowledged uploaded files by name
- [ ] AI never asked for evidence again

### **Sufficiency Check**
- [ ] Documents did NOT trigger before evidence upload
- [ ] Documents triggered automatically after evidence
- [ ] Score reached 100/100 before triggering
- [ ] No duplicate document generation

### **Routing Display**
- [ ] "Analyzing Legal Route" screen appeared
- [ ] Routing decision details showed:
   - Legal relationship
   - Forum selection
   - Reasoning
   - Document list
- [ ] Transition to generation was smooth

### **Document Generation**
- [ ] All documents generated successfully
- [ ] No validation failures
- [ ] PDFs are not empty
- [ ] Content is form-specific (not generic summaries)
- [ ] File sizes > 10KB

### **UI/UX**
- [ ] No white screens
- [ ] No "AI response failed" errors
- [ ] No webpack errors in console
- [ ] Smooth transitions between phases
- [ ] Timeline updated correctly
- [ ] Notifications appeared

---

## 🐛 Common Issues & Fixes

### Issue: "Waiting" banner stuck
**Fix**: Refresh page, evidence should clear it

### Issue: AI repeating final message
**Fix**: This is a bug - AI should go silent. Report this.

### Issue: Documents not generating
**Check**:
```bash
# In terminal, check logs:
grep "Sufficiency Check" terminals/833019.txt
grep "System 2" terminals/833019.txt
grep "System 3" terminals/833019.txt
```

### Issue: Empty PDFs
**Check**:
```bash
# Validation should show warnings, not errors:
grep "Validation" terminals/833019.txt
```

---

## 📊 Expected Server Log Summary

```
[Sufficiency Check] Score: 50/100 (missing evidence)
[Sufficiency Check] Score: 75/100 (missing evidence)
[Sufficiency Check] Score: 100/100, Sufficient: true
[Sufficiency Check] ✅ Case sufficient - using final confirmation
[Sufficiency Check] Triggering document generation...

[System 2] Starting routing engine...
[System 2] Legal relationship: worker
[System 2] Forum: County Court
[System 2] ✅ Routing complete

[System 3] Generating: Letter Before Action
[System 3] ✅ Document generated
[System 3] Validation: PASSED
[System 3] PDF created

[System 3] Generating: Particulars of Claim
[System 3] ✅ Document generated
[System 3] Validation: PASSED
[System 3] PDF created

[System 3] Generating: Evidence Bundle
[System 3] ✅ Document generated
[System 3] Validation: PASSED
[System 3] PDF created
```

---

## 📝 Test Results Template

**Date**: ___________  
**Tester**: ___________  
**Server Port**: ___________

### Results:
- [ ] **PASS** - All steps completed successfully
- [ ] **FAIL** - Issues found (list below)

### Issues Found:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Notes:
___________________________________________
___________________________________________
___________________________________________

---

**Run this test and let me know which step fails (if any)!** 🚀
