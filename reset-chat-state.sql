-- Reset ALL GUIDED cases to use new 4-layer system
UPDATE "Dispute" 
SET 
  "chatState" = 'GATHERING_FACTS',
  "caseSummary" = NULL,
  "summaryConfirmed" = false,
  "summaryConfirmedAt" = NULL,
  "chatLocked" = false,
  "lockReason" = NULL,
  "phase" = 'GATHERING'
WHERE "mode" = 'GUIDED';

-- Show what was updated
SELECT id, title, "chatState", "phase", "chatLocked" FROM "Dispute" WHERE "mode" = 'GUIDED';
