# AI Prompt Strategy

## Current Implementation (Phase 5)

### Model Selection
- **Model**: `gpt-4o-mini`
- **Reason**: Best cost/performance ratio for structured output
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

### Prompt Design

#### System Prompt
```
You are a legal assistant analyzing dispute cases for UK citizens.
```

**Purpose**: Sets context and jurisdiction (UK-specific)

#### Task Instructions
1. Brief summary (2-3 sentences)
2. 5 key points identified
3. Strength assessment (weak/moderate/strong)
4. Preview of dispute letter (first 3-4 lines only)

**Purpose**: Clear, structured output that matches UI expectations

#### Considerations
- UK legal context and regulations
- Evidence quality and quantity
- Clarity of dispute description
- Procedural requirements

**Purpose**: Guides AI to focus on relevant factors

### Response Format
```json
{
  "summary": "string",
  "keyPoints": ["string", "string", "string", "string", "string"],
  "strength": "weak" | "moderate" | "strong",
  "letterPreviewLines": ["line1", "line2", "line3"]
}
```

**Benefits**:
- Structured JSON ensures reliable parsing
- Type-safe integration with TypeScript
- Easy to validate and transform

### Token Management

#### Input (~200-400 tokens)
- System prompt: ~150 tokens
- User data: ~50-250 tokens (varies by description length)

#### Output (500-800 tokens max)
- `max_tokens: 800` enforces cost control
- Typical response: 400-600 tokens
- Prevents runaway costs

### Temperature Setting
- **Value**: `0.7`
- **Reason**: Balance between creativity and consistency
- **Effect**: Varied but relevant responses

## Future Enhancements (Phase 6+)

### Full Letter Generation (Post-Unlock)
When user pays, generate complete letter:

```typescript
// Separate function for full generation
async function generateFullLetter(dispute: Dispute) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or gpt-4o for higher quality
    messages: [
      {
        role: "system",
        content: `You are a professional legal letter writer specializing in UK dispute resolution...`
      },
      {
        role: "user",
        content: `Generate a complete, formal dispute letter...`
      }
    ],
    max_tokens: 2000, // Allow longer output for full letter
  });
}
```

**Cost**: ~£0.005-0.01 per full letter (acceptable post-payment)

### Evidence Analysis
Integrate vision capabilities:

```typescript
// For uploaded images/PDFs
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this evidence document..." },
        { type: "image_url", image_url: { url: evidenceUrl } }
      ]
    }
  ]
});
```

### Legal Precedent Matching
Use embeddings for similarity search:

```typescript
// Create embeddings for case descriptions
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: dispute.description,
});

// Match against precedent database
// Return most similar cases
```

## Prompt Engineering Best Practices

### 1. Be Specific
❌ "Analyze this dispute"
✅ "Analyze this UK dispute and provide summary, key points, strength, and letter preview"

### 2. Provide Context
❌ Just the description
✅ Description + dispute type + evidence count

### 3. Request Structure
❌ Free-form text response
✅ JSON with defined schema

### 4. Set Constraints
❌ No limits
✅ "2-3 sentences", "5 key points", "first 3-4 lines only"

### 5. Handle Edge Cases
```typescript
// Always include fallback
try {
  const preview = await generateAIPreview(...);
} catch (error) {
  const preview = generateFallbackPreview(...);
}
```

## Testing Prompts

### Test Cases to Validate

1. **Short Description** (< 100 chars)
   - Should still generate meaningful output
   - Strength likely "weak" due to lack of detail

2. **Long Description** (> 1000 chars)
   - Should extract key points effectively
   - Not overwhelmed by information

3. **Multiple Evidence Files**
   - Should factor into strength assessment
   - Mentioned in key points

4. **Different Dispute Types**
   - Speeding ticket vs landlord vs benefits
   - Context-appropriate analysis

5. **Edge Cases**
   - Empty description → fallback
   - Invalid type → default handling
   - Special characters → proper escaping

## Cost Optimization Strategies

### Current (Phase 5)
- ✅ Use gpt-4o-mini
- ✅ Limit max_tokens to 800
- ✅ Generate preview only
- ✅ Fallback on errors

### Future Optimizations
- Cache common patterns
- Batch similar requests
- Use embeddings for classification
- Progressive disclosure (preview → full)

## Monitoring & Metrics

### Track These Metrics
1. **Cost per preview**: Target < £0.002
2. **Success rate**: Target > 95%
3. **Fallback rate**: Target < 5%
4. **Response time**: Target < 3s
5. **User satisfaction**: Qualitative feedback

### Logging
```typescript
console.log({
  disputeId,
  model: "gpt-4o-mini",
  inputTokens: completion.usage?.prompt_tokens,
  outputTokens: completion.usage?.completion_tokens,
  cost: calculateCost(completion.usage),
  duration: Date.now() - startTime,
});
```

## Compliance & Safety

### Content Filtering
- OpenAI has built-in moderation
- Disputes should be legitimate use case
- Monitor for abuse patterns

### Data Privacy
- No PII stored in prompts unnecessarily
- User data only sent to OpenAI (review their DPA)
- Consider data retention policies

### Legal Disclaimer
Ensure users understand:
- AI-generated content is assistance, not legal advice
- Users responsible for reviewing and submitting
- No guarantee of dispute success

## Resources

- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [JSON Mode](https://platform.openai.com/docs/guides/structured-outputs)
- [Token Counting](https://platform.openai.com/tokenizer)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
