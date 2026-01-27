# DisputeHub AI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DisputeHub                            │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   API Route  │───▶│  AI Service  │  │
│  │  (Next.js)   │    │  (analyze)   │    │  (OpenAI)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Preview    │    │   Database   │    │   Fallback   │  │
│  │     Page     │◀───│   (Prisma)   │    │   Handler    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow (Phase 5)

### 1. User Submits Dispute
```
User fills wizard
  ↓
POST /api/disputes/new
  ↓
Dispute saved to DB (status: DRAFT)
  ↓
Redirect to /disputes/[id]
```

### 2. Generate Preview
```
User clicks "Generate Preview"
  ↓
POST /api/disputes/[id]/analyze
  ↓
Fetch dispute from DB
  ↓
Call generateAIPreview()
  ├─ Success → OpenAI API
  │   ↓
  │   GPT-4o-mini analyzes
  │   ↓
  │   Returns structured JSON
  │   ↓
  │   Save to dispute.aiPreview
  │
  └─ Error → Fallback preview
      ↓
      Save basic preview
  ↓
Return updated dispute
  ↓
Redirect to /disputes/[id]/preview
```

### 3. Display Preview
```
Preview page loads
  ↓
Fetch dispute with aiPreview
  ↓
Check if unlocked (payment status)
  ├─ Locked → Show preview + blur
  └─ Unlocked → Show full content
  ↓
Render UI
```

## Data Structure

### Dispute Model
```typescript
{
  id: string
  title: string
  description: string (TEXT)
  type: string
  status: DisputeStatus
  evidenceFiles: Json? // [{name, size, type, url}]
  aiPreview: Json?     // Preview structure below
  strengthScore: string? // "weak" | "moderate" | "strong"
  userId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### AI Preview Structure
```typescript
{
  summary: string
  keyPoints: string[] // 5 items
  strength: "weak" | "moderate" | "strong"
  fullLetterPreview: string
  lockedContent: {
    fullLetter: string
    legalReferences: string[]
    submissionSteps: string[]
  }
}
```

## AI Service Architecture

### generateAIPreview()
```
Input:
  - type: string (dispute type)
  - description: string (user's case)
  - evidenceCount: number

Process:
  1. Build prompt with system + user message
  2. Call OpenAI API (gpt-4o-mini)
  3. Parse JSON response
  4. Generate letter preview from AI lines
  5. Add locked content (templates)
  6. Return complete preview structure

Output:
  - AIPreview object (matches mock shape)

Error Handling:
  - Try/catch around OpenAI call
  - On error → generateFallbackPreview()
  - Always returns valid preview
```

### Cost Control Mechanisms
```
1. Model Selection
   └─ gpt-4o-mini (10x cheaper than gpt-4)

2. Token Limits
   └─ max_tokens: 800 (hard cap)

3. Structured Output
   └─ JSON mode (no wasted tokens)

4. Preview Only
   └─ Full letter generation later (post-payment)

5. Caching (Future)
   └─ Similar disputes → cached responses
```

## Phase Progression

### Phase 5 (Current) - Preview Generation
```
User Input → AI Analysis → Preview
                ↓
         [LOCKED CONTENT]
```

**What's Generated:**
- Summary (2-3 sentences)
- Key points (5 items)
- Strength assessment
- Letter preview (first 3-4 lines)

**What's Locked:**
- Full letter (template placeholder)
- Legal references (static list)
- Submission steps (static list)

### Phase 6 (Future) - Full Generation
```
User Pays → Unlock → Full AI Generation
                        ↓
                  Complete Letter
                  + Evidence Integration
                  + Legal Arguments
```

**What Will Be Generated:**
- Complete formal letter (1000-2000 tokens)
- Evidence-specific arguments
- Legal precedent references
- Personalized recommendations

### Phase 7 (Future) - Advanced Features
```
Evidence Files → OCR/Vision Analysis
                      ↓
                 Enhanced Preview
                      ↓
              Precedent Matching
                      ↓
           Success Probability Score
```

## Security Architecture

### API Key Protection
```
Environment Variable (.env)
  ↓
Server-side only (API route)
  ↓
Never exposed to client
  ↓
Not in git (.gitignore)
```

### User Authorization
```
Request → Get userId from Clerk
  ↓
Fetch dispute from DB
  ↓
Verify dispute.userId === userId
  ↓
If not → 403 Forbidden
  ↓
If yes → Process request
```

### Payment Verification
```
Preview page loads
  ↓
Check Payment table
  ↓
WHERE disputeId = [id]
  AND status = COMPLETED
  ↓
If found → isUnlocked = true
If not → isUnlocked = false
  ↓
Render accordingly
```

## Error Handling Strategy

### API Route Level
```typescript
try {
  const preview = await generateAIPreview(...)
  // Save and return
} catch (error) {
  console.error("Error generating preview:", error)
  return { error: "Failed to generate preview" }
}
```

### AI Service Level
```typescript
try {
  const completion = await openai.chat.completions.create(...)
  // Parse and return
} catch (error) {
  console.error("AI generation error:", error)
  return generateFallbackPreview(...) // Always succeeds
}
```

### Frontend Level
```typescript
// Preview page
if (!preview) {
  redirect(`/disputes/${id}`) // Back to dispute detail
}

// Analyze API call
const response = await fetch(...)
if (!response.ok) {
  toast.error("Failed to generate preview")
}
```

## Performance Considerations

### Current (Phase 5)
- **API Call**: ~2-3 seconds (OpenAI latency)
- **Token Processing**: ~500-800 tokens output
- **Database Write**: ~100ms
- **Total**: ~3-4 seconds per preview

### Optimizations (Future)
1. **Caching**: Store common patterns
2. **Streaming**: Show partial results as they arrive
3. **Batching**: Process multiple disputes together
4. **Edge Functions**: Reduce latency with edge deployment

## Monitoring & Observability

### Key Metrics to Track
```
1. Success Rate
   - AI generation success vs fallback rate
   - Target: >95% success

2. Response Time
   - Time from request to preview saved
   - Target: <5 seconds

3. Cost per Preview
   - OpenAI API costs
   - Target: <£0.002

4. User Satisfaction
   - Preview quality ratings
   - Conversion to payment
```

### Logging Strategy
```typescript
console.log({
  event: "ai_preview_generated",
  disputeId,
  model: "gpt-4o-mini",
  inputTokens: completion.usage?.prompt_tokens,
  outputTokens: completion.usage?.completion_tokens,
  duration: Date.now() - startTime,
  success: true
})
```

## Deployment Considerations

### Environment Variables
```bash
# Development
OPENAI_API_KEY=sk-test-...

# Production
OPENAI_API_KEY=sk-prod-...
```

### Rate Limiting (Future)
```typescript
// Per user rate limit
const userPreviews = await prisma.dispute.count({
  where: {
    userId,
    createdAt: { gte: startOfDay }
  }
})

if (userPreviews >= 10) {
  return { error: "Daily limit reached" }
}
```

### Monitoring
- OpenAI Dashboard: Usage tracking
- Application Logs: Error rates
- Database Metrics: Query performance
- User Analytics: Conversion rates

## Testing Strategy

### Unit Tests (Future)
```typescript
describe("generateAIPreview", () => {
  it("should generate valid preview structure")
  it("should handle short descriptions")
  it("should handle long descriptions")
  it("should fall back on API errors")
  it("should respect token limits")
})
```

### Integration Tests (Future)
```typescript
describe("POST /api/disputes/[id]/analyze", () => {
  it("should require authentication")
  it("should verify ownership")
  it("should save preview to database")
  it("should return updated dispute")
})
```

### Manual Testing (Current)
- Create disputes of different types
- Test with varying description lengths
- Verify preview quality
- Check cost per request
- Test error scenarios

## Scalability Path

### Current Capacity
- Single OpenAI API key
- No rate limiting
- Sequential processing
- ~100 requests/day comfortably

### Scale to 1000s/day
1. **Multiple API Keys**: Rotate for higher limits
2. **Queue System**: Bull/BullMQ for job processing
3. **Caching Layer**: Redis for common patterns
4. **Load Balancing**: Distribute across regions

### Scale to 10000s/day
1. **Dedicated Infrastructure**: Separate AI service
2. **Model Fine-tuning**: Custom model for disputes
3. **Edge Deployment**: Global distribution
4. **Advanced Caching**: ML-based similarity matching

---

This architecture is designed for:
- ✅ Easy development and testing
- ✅ Cost-controlled operations
- ✅ Graceful error handling
- ✅ Future scalability
- ✅ User privacy and security
