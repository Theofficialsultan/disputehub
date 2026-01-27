# Document Generation System Architecture
## Phase 7.2 Block 3A

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                              │
│                                                                     │
│  GET /api/disputes/[id]/documents/plan                             │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API ROUTE HANDLER                              │
│  /api/disputes/[id]/documents/plan/route.ts                        │
│                                                                     │
│  1. Authenticate user (Clerk)                                      │
│  2. Verify dispute ownership                                       │
│  3. Fetch CaseStrategy from database                               │
│  4. Call tryComputeDocumentPlan()                                  │
│  5. Return plan or validation errors                               │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PLAN GENERATOR                                   │
│  src/lib/documents/plan-generator.ts                               │
│                                                                     │
│  tryComputeDocumentPlan()                                          │
│  ├─ Step 1: Validate strategy completeness                         │
│  ├─ Step 2: Calculate complexity score                             │
│  ├─ Step 3: Determine document structure                           │
│  ├─ Step 4: Route documents                                        │
│  └─ Step 5: Return complete plan                                   │
└───┬───────────────────┬─────────────────┬──────────────────────────┘
    │                   │                 │
    ▼                   ▼                 ▼
┌───────────┐  ┌─────────────────┐  ┌──────────────┐
│ VALIDATOR │  │ COMPLEXITY      │  │   ROUTING    │
│           │  │ SCORER          │  │              │
│ ✓ 2 facts │  │                 │  │ • Simple     │
│   OR      │  │ Base weights:   │  │   → 1 doc    │
│ ✓ 1 fact  │  │ • Dispute type  │  │              │
│   + 1 ev  │  │ • Fact count    │  │ • Complex    │
│           │  │ • Evidence      │  │   → N docs   │
│ ✓ Outcome │  │ • Outcome       │  │              │
│           │  │                 │  │ Dispute-     │
│ ✓ Type    │  │ Threshold: 10   │  │ specific     │
└───────────┘  └─────────────────┘  └──────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ OUTCOME CLASSIFIER    │
            │                       │
            │ Keywords → Complexity │
            │ • Simple: refund      │
            │ • Medium: compensate  │
            │ • Complex: tribunal   │
            └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DOCUMENT PLAN OUTPUT                            │
│                     (In-Memory Only)                                │
│                                                                     │
│  {                                                                  │
│    complexity: "SIMPLE" | "COMPLEX",                               │
│    complexityScore: number,                                        │
│    complexityBreakdown: {                                          │
│      disputeTypeScore: 3,                                          │
│      disputeTypeReason: "Consumer has weight 3",                   │
│      factCountScore: 2,                                            │
│      factCountReason: "5 facts - medium complexity",               │
│      evidenceScore: 1,                                             │
│      evidenceReason: "2 evidence items - basic",                   │
│      outcomeScore: 1,                                              │
│      outcomeReason: "Refund (simple)",                             │
│      totalScore: 7,                                                │
│      threshold: 10,                                                │
│      classification: "SIMPLE"                                      │
│    },                                                              │
│    documentType: "SINGLE_LETTER" | "MULTI_DOCUMENT_DOCKET",       │
│    documents: [                                                    │
│      {                                                             │
│        type: "FORMAL_LETTER",                                      │
│        title: "Consumer Dispute Letter",                           │
│        description: "Formal letter...",                            │
│        order: 1,                                                   │
│        required: true                                              │
│      }                                                             │
│    ]                                                               │
│  }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
CaseStrategy (Database)
    ↓
[Fetch from Prisma]
    ↓
CaseStrategyInput (In-Memory)
    ↓
[Validate Completeness]
    ↓
ComplexityBreakdown (Computed)
    ↓
[Score >= Threshold?]
    ↓
DocumentStructureType (Determined)
    ↓
[Route Based on Type + Complexity]
    ↓
PlannedDocument[] (Generated)
    ↓
DocumentPlan (Complete)
    ↓
[Serialize to JSON]
    ↓
API Response
```

## Complexity Decision Tree

```
                    [CaseStrategy]
                          │
                          ▼
              ┌──────────────────────┐
              │ Calculate Base Score │
              └──────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
  [Score < 10]                        [Score >= 10]
  SIMPLE CASE                         COMPLEX CASE
        │                                   │
        ▼                                   ▼
  ┌───────────┐                    ┌─────────────┐
  │ 1 Document│                    │ N Documents │
  └───────────┘                    └─────────────┘
        │                                   │
        └─────────────┬─────────────────────┘
                      ▼
              [Document Plan]
```

## Document Routing Logic

```
IF complexity === "SIMPLE":
    RETURN [ FORMAL_LETTER ]

ELSE IF complexity === "COMPLEX":
    documents = [ COVER_LETTER, FORMAL_LETTER ]
    
    IF evidence exists:
        ADD EVIDENCE_SCHEDULE
    
    IF facts >= 5:
        ADD TIMELINE
    
    SWITCH disputeType:
        CASE "employment":
            IF has witnesses: ADD WITNESS_STATEMENT
            IF needs appeal: ADD APPEAL_FORM
        
        CASE "benefits":
            ADD APPEAL_FORM (required)
            IF medical evidence: ADD STATUTORY_DECLARATION
        
        CASE "immigration":
            ADD EVIDENCE_SCHEDULE (required)
            IF has witnesses: ADD WITNESS_STATEMENT
        
        CASE "landlord":
            ADD TIMELINE (required)
        
        CASE "speeding_ticket":
            IF not driver: ADD STATUTORY_DECLARATION
    
    RETURN documents
```

## Key Design Decisions

### 1. In-Memory Computation
- **Why:** No persistence overhead, instant calculation
- **Benefit:** Can be called repeatedly without side effects
- **Trade-off:** Must recompute each time (but fast: ~1ms)

### 2. Configurable Threshold
- **Why:** Easy tuning without code deployment
- **Benefit:** A/B testing, per-user customization
- **Implementation:** `ComplexityConfig` parameter

### 3. Keyword-Based Classification
- **Why:** Deterministic, no AI cost, fast
- **Benefit:** Same outcome always classified the same
- **Trade-off:** Limited to predefined keywords

### 4. Extensible Document Types
- **Why:** Avoid enum explosion as new types added
- **Benefit:** Can add custom document types dynamically
- **Implementation:** `DocumentType = string`

### 5. Transparent Scoring
- **Why:** Users/support can understand why plan generated
- **Benefit:** Debug, audit, compliance
- **Implementation:** `ComplexityBreakdown` object

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Validate Strategy | <1ms | Pure logic, no I/O |
| Calculate Complexity | <1ms | Arithmetic + keyword search |
| Route Documents | <1ms | Conditional logic |
| **Total Computation** | **~3ms** | **In-memory only** |
| Database Fetch | ~50ms | Fetch CaseStrategy |
| **API Response** | **~100ms** | **Including auth + DB** |

## Future Enhancements (Not in Block 3A)

### Block 3B: Persistence
- Add `DocumentPlan` table to database
- POST endpoint to save plans
- Track plan history/changes

### Block 3C: Content Generation
- AI-powered document drafting
- HTML formatting and styling
- Template system

### Block 3D: User Interface
- Plan preview component
- Progress tracking
- Document download

### Advanced Features
- ML-based complexity prediction
- User feedback loop for tuning
- Historical success rate by plan type
- Custom document templates
- Multi-language support

## Error Handling

```
API Request
    ↓
Authentication ─[FAIL]→ 401 Unauthorized
    ↓
Ownership Check ─[FAIL]→ 404 Not Found
    ↓
Strategy Fetch ─[NONE]→ { plan: null, reason: "No strategy" }
    ↓
Validation ─[FAIL]→ { plan: null, validation: {...errors} }
    ↓
Computation ─[ERROR]→ 500 Server Error
    ↓
Success → { plan: {...}, validation: {complete: true} }
```

## Testing Strategy

### Unit Tests
- `validateStrategyCompleteness()` with various inputs
- `classifyOutcomeComplexity()` with edge cases
- `calculateComplexityScore()` with known scores
- `routeDocuments()` for each dispute type

### Integration Tests
- API endpoint with mock strategies
- End-to-end plan generation
- Error cases (incomplete, missing, invalid)

### Manual Testing
- Create cases with different complexities
- Verify scores match expectations
- Check document routing accuracy
- Test configuration overrides
