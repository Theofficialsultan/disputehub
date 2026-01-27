# Testing Guide - Real AI Preview

## Pre-Testing Setup

### 1. Configure API Key
```bash
# Edit .env
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Verify Connection
Check terminal for any errors on startup.

---

## Test Cases

### Test Case 1: Basic Speeding Ticket

**Input:**
```
Type: speeding_ticket
Title: M25 Speeding Ticket
Description: I was driving on the M25 and received a speeding ticket 
for allegedly going 85mph in a 70mph zone. I believe the speed camera 
was not properly calibrated.
Evidence: 0 files
```

**Expected Output:**
- Summary mentions calibration concerns
- Key points reference speed camera accuracy
- Strength: likely "moderate" (limited evidence)
- Preview generates in 2-5 seconds

**Verify:**
- [ ] Summary is contextual (mentions M25, 85mph, 70mph)
- [ ] Key points are specific to speed cameras
- [ ] Strength assessment makes sense
- [ ] No errors in console

---

### Test Case 2: Detailed Parking Fine

**Input:**
```
Type: parking_fine
Title: Resident Permit Parking Fine
Description: I received a parking fine on January 15th for parking in 
a resident-only bay on High Street. However, I am a resident of the 
area and had my valid permit (number RES-12345) clearly displayed on 
my dashboard. I have taken photos showing the permit was visible through 
the windscreen. The permit is valid until March 2026. The parking 
attendant issued the ticket at 2:30 PM, and my photos are timestamped 
at 2:15 PM showing the permit in place. I believe this is an enforcement 
error where the attendant failed to properly check my vehicle.
Evidence: 2 files
```

**Expected Output:**
- Summary mentions displayed permit and enforcement error
- Key points reference specific details (permit number, timestamps)
- Strength: likely "strong" (clear evidence)
- Specific dates and times mentioned

**Verify:**
- [ ] Summary references the displayed permit
- [ ] Key points mention specific details (RES-12345, timestamps)
- [ ] Strength is "strong" (good evidence + clear case)
- [ ] More detailed than Test Case 1

---

### Test Case 3: Landlord Dispute

**Input:**
```
Type: landlord
Title: Heating System Failure
Description: My landlord has failed to repair the heating system in 
my flat for the past 6 weeks. I first reported the issue on December 
1st via email. The temperature in my flat has been below 15°C. I have 
sent 3 follow-up emails and called twice, but no action has been taken. 
I have temperature readings and photos of the broken boiler.
Evidence: 3 files
```

**Expected Output:**
- Summary mentions repair obligations and timeline
- Key points reference specific dates and attempts to contact
- Strength: likely "strong" (documented evidence)
- Legal references to landlord obligations

**Verify:**
- [ ] Summary acknowledges the timeline (6 weeks)
- [ ] Key points mention communication attempts
- [ ] Strength reflects good documentation
- [ ] Temperature details included

---

### Test Case 4: Minimal Description

**Input:**
```
Type: speeding_ticket
Title: Speeding Ticket
Description: I got a speeding ticket but I wasn't speeding.
Evidence: 0 files
```

**Expected Output:**
- Summary still generated but may note limited information
- Key points are more general
- Strength: likely "weak" (insufficient detail)
- Graceful handling of short input

**Verify:**
- [ ] Preview still generates (doesn't fail)
- [ ] Strength is "weak" or "moderate"
- [ ] Key points are reasonable despite limited input
- [ ] No errors

---

### Test Case 5: Very Detailed Description

**Input:**
```
Type: benefits
Title: Universal Credit Sanction Appeal
Description: [Paste a 1000+ word detailed description with dates, 
references, evidence, timeline, etc.]
Evidence: 5 files
```

**Expected Output:**
- Summary extracts main issues effectively
- Key points prioritize most important factors
- Strength: likely "strong" (comprehensive case)
- Handles long input without truncation issues

**Verify:**
- [ ] Summary is coherent (not overwhelmed)
- [ ] Key points focus on strongest arguments
- [ ] Strength reflects comprehensive documentation
- [ ] Response time still reasonable (<5s)

---

### Test Case 6: Different Dispute Types

Test each type to verify type-specific analysis:

**Types to Test:**
- [ ] speeding_ticket
- [ ] parking_fine
- [ ] landlord
- [ ] benefits
- [ ] immigration
- [ ] other

**Verify:**
- Each type gets contextually appropriate analysis
- Legal references match the dispute type
- Key points are relevant to that category

---

## Error Testing

### Test Case 7: Invalid API Key

**Setup:**
```bash
# Temporarily set invalid key in .env
OPENAI_API_KEY=sk-invalid-key-12345
```

**Expected:**
- Fallback preview generated
- Error logged to console
- User still sees a preview (not broken)

**Verify:**
- [ ] Preview page loads successfully
- [ ] Fallback preview is shown
- [ ] No user-facing error
- [ ] Error logged in terminal

**Cleanup:**
```bash
# Restore valid API key
```

---

### Test Case 8: Network Error Simulation

**Setup:**
```bash
# Disconnect internet or block OpenAI API
```

**Expected:**
- Fallback preview generated
- Graceful error handling
- User experience not broken

**Verify:**
- [ ] Fallback works
- [ ] User sees preview
- [ ] Error logged appropriately

---

## Performance Testing

### Test Case 9: Response Time

**Measure:**
1. Note timestamp when clicking "Generate Preview"
2. Note timestamp when preview appears
3. Calculate difference

**Expected:**
- First request: 3-5 seconds (cold start)
- Subsequent requests: 2-3 seconds

**Verify:**
- [ ] Response time acceptable (<5s)
- [ ] No timeout errors
- [ ] Consistent performance

---

### Test Case 10: Concurrent Requests

**Test:**
1. Open 3 browser tabs
2. Create dispute in each
3. Generate preview simultaneously

**Expected:**
- All previews generate successfully
- No rate limit errors (initially)
- Each gets unique analysis

**Verify:**
- [ ] All succeed
- [ ] No conflicts
- [ ] Unique responses

---

## Cost Monitoring

### Test Case 11: Cost Tracking

**Process:**
1. Note starting usage: https://platform.openai.com/usage
2. Generate 10 previews
3. Check usage again
4. Calculate cost per preview

**Expected:**
- ~500-800 tokens per request
- ~£0.001-0.002 per preview
- Total for 10: ~£0.01-0.02

**Verify:**
- [ ] Costs match expectations
- [ ] No runaway token usage
- [ ] Model is gpt-4o-mini (not gpt-4)

---

## Quality Assessment

### Test Case 12: Preview Quality

**Criteria:**
1. **Specificity**: Does it reference actual case details?
2. **Relevance**: Are key points pertinent to the case?
3. **Actionability**: Does it identify specific issues?
4. **Confidence**: Is the strength assessment justified?
5. **Professionalism**: Is the tone appropriate?

**Scoring (1-5 for each):**
- [ ] Specificity: ___/5
- [ ] Relevance: ___/5
- [ ] Actionability: ___/5
- [ ] Confidence: ___/5
- [ ] Professionalism: ___/5

**Target**: Average 4+/5 across all criteria

---

## UI/UX Testing

### Test Case 13: Preview Page Rendering

**Verify:**
- [ ] Summary displays correctly
- [ ] Key points are numbered
- [ ] Strength indicator shows
- [ ] Letter preview has blur effect
- [ ] Locked content sections visible
- [ ] Unlock button appears
- [ ] No layout issues

---

### Test Case 14: Locked vs Unlocked

**Test Locked State:**
- [ ] Only first 3 key points shown
- [ ] Letter preview is blurred
- [ ] Legal references are blurred
- [ ] Submission steps are blurred
- [ ] Unlock CTA is prominent

**Test Unlocked State:**
(After payment simulation)
- [ ] All 5 key points shown
- [ ] Full letter visible
- [ ] Legal references visible
- [ ] Submission steps visible
- [ ] No unlock button

---

## Regression Testing

### Test Case 15: Existing Disputes

**Test:**
1. Create dispute with mock AI (if any exist)
2. Verify old previews still display
3. Create new dispute with real AI
4. Verify new previews work

**Verify:**
- [ ] Backward compatible
- [ ] Old data still renders
- [ ] New data works correctly
- [ ] No migration issues

---

## Edge Cases

### Test Case 16: Special Characters

**Input:**
```
Description: I received a ticket for £50. The officer's name was 
O'Brien. The location was "High Street" (near the café).
```

**Verify:**
- [ ] Special characters handled correctly
- [ ] No parsing errors
- [ ] Preview generates normally

---

### Test Case 17: Very Long Key Points

**Test:**
If AI generates very long key points (>200 chars)

**Verify:**
- [ ] UI handles long text
- [ ] No overflow issues
- [ ] Readable on mobile

---

### Test Case 18: Empty Evidence

**Input:**
```
Evidence: 0 files
```

**Verify:**
- [ ] Doesn't break preview generation
- [ ] Strength adjusted accordingly
- [ ] Key points don't reference non-existent evidence

---

## Mobile Testing

### Test Case 19: Mobile Responsiveness

**Test on mobile device or DevTools mobile view:**

**Verify:**
- [ ] Preview page is readable
- [ ] Key points display correctly
- [ ] Unlock button is accessible
- [ ] No horizontal scrolling
- [ ] Touch targets are adequate

---

## Security Testing

### Test Case 20: Authorization

**Test:**
1. Create dispute as User A
2. Try to access as User B (different account)

**Expected:**
- Access denied (403)
- Redirected appropriately

**Verify:**
- [ ] Ownership verified
- [ ] No unauthorized access
- [ ] Proper error handling

---

## Checklist Summary

### Critical Tests (Must Pass)
- [ ] Test Case 1: Basic functionality
- [ ] Test Case 2: Detailed input
- [ ] Test Case 7: Error handling (invalid key)
- [ ] Test Case 11: Cost monitoring
- [ ] Test Case 13: UI rendering
- [ ] Test Case 20: Security

### Important Tests (Should Pass)
- [ ] Test Case 3-6: Various types
- [ ] Test Case 9: Performance
- [ ] Test Case 12: Quality assessment
- [ ] Test Case 14: Locked/unlocked states

### Nice to Have Tests
- [ ] Test Case 10: Concurrent requests
- [ ] Test Case 15-19: Edge cases
- [ ] Mobile testing

---

## Reporting Issues

### If Something Fails

**Document:**
1. Test case number
2. Input used
3. Expected behavior
4. Actual behavior
5. Error messages (console/terminal)
6. Screenshots (if UI issue)

**Check:**
- API key is correct
- OpenAI account has credits
- Server is running
- No network issues

---

## Success Criteria

### Minimum Viable
- ✅ Previews generate successfully
- ✅ No breaking errors
- ✅ Cost per preview <£0.005
- ✅ Response time <10s

### Target
- ✅ Quality score 4+/5
- ✅ Cost per preview <£0.002
- ✅ Response time <5s
- ✅ 95%+ success rate

### Excellent
- ✅ Quality score 4.5+/5
- ✅ Cost per preview <£0.001
- ✅ Response time <3s
- ✅ 99%+ success rate

---

## Next Steps After Testing

### If Tests Pass
1. Monitor costs for a week
2. Gather user feedback
3. Plan Phase 6 (full letter generation)
4. Consider A/B testing

### If Tests Fail
1. Review error logs
2. Check API configuration
3. Verify OpenAI account status
4. Consult documentation

---

## Automated Testing (Future)

### Unit Tests
```typescript
describe("generateAIPreview", () => {
  it("should return valid preview structure")
  it("should handle errors gracefully")
  it("should respect token limits")
})
```

### Integration Tests
```typescript
describe("POST /api/disputes/[id]/analyze", () => {
  it("should generate preview for valid dispute")
  it("should require authentication")
  it("should verify ownership")
})
```

### E2E Tests
```typescript
describe("Dispute Preview Flow", () => {
  it("should create dispute and generate preview")
  it("should display preview correctly")
  it("should handle unlock flow")
})
```

---

Happy Testing! 🧪
