-- Delete ALL messages from GUIDED cases to start fresh
DELETE FROM "CaseMessage" 
WHERE "caseId" IN (
  SELECT id FROM "Dispute" WHERE "mode" = 'GUIDED'
);

-- Show remaining message counts
SELECT COUNT(*) as message_count FROM "CaseMessage";
