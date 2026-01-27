# Preview Caching Flow

## Request Flow with Caching

```
┌─────────────────────────────────────────────────────────────┐
│                    First Request (No Cache)                  │
└─────────────────────────────────────────────────────────────┘

User clicks "Generate Preview"
  ↓
POST /api/disputes/[id]/analyze
  ↓
Check dispute.aiPreview
  ↓
NULL (no cache)
  ↓
Generate AI Preview
  ├─ Call OpenAI API
  ├─ Parse response
  └─ Format output
  ↓
Save to dispute.aiPreview
  ↓
Return preview to user
  ↓
⏱️ Time: 2-3 seconds
💰 Cost: £0.001-0.002


┌─────────────────────────────────────────────────────────────┐
│              Subsequent Requests (Cached)                    │
└─────────────────────────────────────────────────────────────┘

User refreshes page / revisits
  ↓
POST /api/disputes/[id]/analyze
  ↓
Check dispute.aiPreview
  ↓
EXISTS (cached)
  ↓
Return cached preview immediately
  ↓
⏱️ Time: <100ms
💰 Cost: £0.00


┌─────────────────────────────────────────────────────────────┐
│                     Cost Comparison                          │
└─────────────────────────────────────────────────────────────┘

Without Caching:
  1st view:  £0.002
  2nd view:  £0.002
  3rd view:  £0.002
  ...
  100 views: £0.20
  ❌ Expensive, wasteful

With Caching:
  1st view:  £0.002
  2nd view:  £0.00
  3rd view:  £0.00
  ...
  100 views: £0.002
  ✅ Cost-effective, fast
```

## Cache Invalidation

Currently, previews are cached permanently (until manually regenerated).

### Future: Cache Invalidation Triggers

```typescript
// Potential future triggers to regenerate preview:

1. User edits dispute description
   → Clear cache, regenerate on next request

2. User adds new evidence files
   → Clear cache, regenerate on next request

3. Manual "Regenerate" button
   → Force new AI call

4. Time-based expiry (optional)
   → Regenerate if older than X days
```

### Implementation Example (Future)

```typescript
// In dispute update route
if (descriptionChanged || evidenceChanged) {
  await prisma.dispute.update({
    where: { id },
    data: {
      description: newDescription,
      aiPreview: null, // Clear cache
      strengthScore: null
    }
  });
}
```

## Database Impact

### Storage
- Preview stored as JSON in `dispute.aiPreview`
- Typical size: 1-2KB per preview
- 1000 disputes: ~1-2MB (negligible)

### Performance
- Cache hit: Single DB query (~10-50ms)
- Cache miss: DB query + AI call + DB write (~2-3s)
- 99% of requests will be cache hits

## Security Considerations

### Cache Isolation
```typescript
// Authorization checked BEFORE returning cache
if (dispute.userId !== userId) {
  return { error: "Unauthorized" }; // 403
}

// Only then return cached preview
if (dispute.aiPreview) {
  return dispute;
}
```

### No Cross-User Pollution
- Each dispute has its own cache
- User ownership verified on every request
- No shared cache between users

## Monitoring

### Metrics to Track

```typescript
// Log cache hits vs misses
console.log({
  event: dispute.aiPreview ? "cache_hit" : "cache_miss",
  disputeId: id,
  userId: userId,
  timestamp: new Date()
});

// Track cost savings
const costSaved = cacheHits * 0.002; // £0.002 per avoided call
```

### Expected Metrics (Production)

```
Cache Hit Rate: 90-95%
Average Response Time: <200ms
Cost per Dispute: £0.001-0.002 (one-time)
Monthly Savings: 90-95% of potential AI costs
```

## Edge Cases

### 1. Concurrent Requests
```
User double-clicks "Generate Preview"
  ↓
Request 1: No cache, starts AI generation
Request 2: No cache yet, starts AI generation
  ↓
Both complete, last one wins
  ↓
Result: Two AI calls (rare, acceptable)
```

**Future Fix (Optional):**
```typescript
// Use database lock or flag
if (dispute.isGenerating) {
  return { status: "generating", retry: true };
}
```

### 2. Failed Generation
```
AI call fails
  ↓
Fallback preview generated
  ↓
Saved to cache
  ↓
User gets fallback (cached)
```

**Future Fix:**
```typescript
// Mark fallback previews
aiPreview: {
  ...preview,
  isFallback: true
}

// Allow regeneration of fallback
if (dispute.aiPreview?.isFallback) {
  // Try real AI again
}
```

### 3. Preview Quality Issues
```
User reports poor preview quality
  ↓
Admin/User clicks "Regenerate"
  ↓
Clear cache, generate new preview
```

**Implementation:**
```typescript
// Add force parameter
POST /api/disputes/[id]/analyze?force=true

if (force || !dispute.aiPreview) {
  // Generate new preview
}
```

## Benefits Summary

### Performance
- ✅ 95%+ faster response time
- ✅ Reduced server load
- ✅ Better user experience

### Cost
- ✅ 90-95% cost reduction
- ✅ Predictable costs per dispute
- ✅ Scales efficiently

### Reliability
- ✅ Consistent previews
- ✅ No rate limit issues on revisits
- ✅ Offline-friendly (once cached)

---

**Status:** Implemented and ready for testing.
