-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseMode" AS ENUM ('QUICK', 'GUIDED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'WAITING', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseLifecycleStatus" AS ENUM ('DRAFT', 'DOCUMENT_SENT', 'AWAITING_RESPONSE', 'RESPONSE_RECEIVED', 'DEADLINE_MISSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CasePhase" AS ENUM ('GATHERING', 'ROUTING', 'GENERATING', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ChatState" AS ENUM ('GATHERING_FACTS', 'WAITING_FOR_UPLOAD', 'CONFIRMING_SUMMARY', 'ROUTING_DECISION', 'DOCUMENTS_PREPARING', 'GUIDANCE_ONLY', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED', 'REQUIRES_CLARIFICATION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageIntent" AS ENUM ('QUESTION', 'ANSWER', 'INSTRUCTION', 'UPDATE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "CaseComplexity" AS ENUM ('SIMPLE', 'COMPLEX');

-- CreateEnum
CREATE TYPE "DocumentStructureType" AS ENUM ('SINGLE_LETTER', 'MULTI_DOCUMENT_DOCKET');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CaseEventType" AS ENUM ('DOCUMENT_GENERATED', 'DOCUMENT_SENT', 'RESPONSE_RECEIVED', 'DEADLINE_SET', 'DEADLINE_MISSED', 'FOLLOW_UP_GENERATED', 'ESCALATION_TRIGGERED', 'CASE_CLOSED', 'STRATEGY_FINALISED', 'DOCUMENT_PLAN_CREATED', 'DOCUMENTS_GENERATING', 'EVIDENCE_UPLOADED', 'EVIDENCE_ATTACHED_TO_DOCUMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOCUMENT_READY', 'DOCUMENT_SENT', 'DEADLINE_APPROACHING', 'DEADLINE_MISSED', 'FOLLOW_UP_GENERATED', 'CASE_CLOSED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "evidenceFiles" JSONB,
    "aiPreview" JSONB,
    "aiFullAnalysis" JSONB,
    "strengthScore" TEXT,
    "mode" "CaseMode" NOT NULL DEFAULT 'QUICK',
    "conversationStatus" "ConversationStatus",
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "lifecycleStatus" "CaseLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "waitingUntil" TIMESTAMP(3),
    "strategyLocked" BOOLEAN NOT NULL DEFAULT false,
    "phase" "CasePhase" NOT NULL DEFAULT 'GATHERING',
    "chatState" "ChatState" NOT NULL DEFAULT 'GATHERING_FACTS',
    "chatLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "factsSummary" JSONB,
    "summaryConfirmedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseMessage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "intent" "MessageIntent" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStrategy" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "disputeType" TEXT,
    "keyFacts" JSONB NOT NULL,
    "evidenceMentioned" JSONB NOT NULL,
    "desiredOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPlan" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "complexity" "CaseComplexity" NOT NULL,
    "complexityScore" INTEGER NOT NULL,
    "complexityBreakdown" JSONB NOT NULL,
    "documentType" "DocumentStructureType" NOT NULL,
    "routingStatus" "RoutingStatus" NOT NULL DEFAULT 'PENDING',
    "routingConfidence" DOUBLE PRECISION,
    "routingReason" TEXT,
    "jurisdiction" TEXT,
    "legalRelationship" TEXT,
    "counterparty" TEXT,
    "domain" TEXT,
    "forum" TEXT,
    "forumReasoning" TEXT,
    "allowedDocuments" TEXT[],
    "blockedDocuments" TEXT[],
    "prerequisitesMet" BOOLEAN NOT NULL DEFAULT false,
    "prerequisitesList" JSONB,
    "timeLimitDeadline" TIMESTAMP(3),
    "timeLimitMet" BOOLEAN,
    "timeLimitDescription" TEXT,
    "alternativeRoutes" JSONB,
    "blockType" TEXT,
    "nextAction" TEXT,
    "canResolve" BOOLEAN,
    "resolutionSteps" JSONB,
    "routingCompletedAt" TIMESTAMP(3),
    "generationStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "caseId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "validationWarnings" JSONB,
    "validatedAt" TIMESTAMP(3),
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "CaseEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "relatedDocumentId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "EvidenceType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidenceDate" TIMESTAMP(3),
    "evidenceIndex" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Dispute_userId_idx" ON "Dispute"("userId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_type_idx" ON "Dispute"("type");

-- CreateIndex
CREATE INDEX "Dispute_createdAt_idx" ON "Dispute"("createdAt");

-- CreateIndex
CREATE INDEX "Dispute_mode_idx" ON "Dispute"("mode");

-- CreateIndex
CREATE INDEX "Dispute_conversationStatus_idx" ON "Dispute"("conversationStatus");

-- CreateIndex
CREATE INDEX "Dispute_lifecycleStatus_idx" ON "Dispute"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "Dispute_waitingUntil_idx" ON "Dispute"("waitingUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_disputeId_idx" ON "Payment"("disputeId");

-- CreateIndex
CREATE INDEX "Payment_stripeSessionId_idx" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "CaseMessage_caseId_idx" ON "CaseMessage"("caseId");

-- CreateIndex
CREATE INDEX "CaseMessage_createdAt_idx" ON "CaseMessage"("createdAt");

-- CreateIndex
CREATE INDEX "CaseMessage_role_idx" ON "CaseMessage"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CaseStrategy_caseId_key" ON "CaseStrategy"("caseId");

-- CreateIndex
CREATE INDEX "CaseStrategy_caseId_idx" ON "CaseStrategy"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPlan_caseId_key" ON "DocumentPlan"("caseId");

-- CreateIndex
CREATE INDEX "DocumentPlan_caseId_idx" ON "DocumentPlan"("caseId");

-- CreateIndex
CREATE INDEX "DocumentPlan_complexity_idx" ON "DocumentPlan"("complexity");

-- CreateIndex
CREATE INDEX "DocumentPlan_routingStatus_idx" ON "DocumentPlan"("routingStatus");

-- CreateIndex
CREATE INDEX "DocumentPlan_forum_idx" ON "DocumentPlan"("forum");

-- CreateIndex
CREATE INDEX "GeneratedDocument_caseId_idx" ON "GeneratedDocument"("caseId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_planId_idx" ON "GeneratedDocument"("planId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_status_idx" ON "GeneratedDocument"("status");

-- CreateIndex
CREATE INDEX "GeneratedDocument_order_idx" ON "GeneratedDocument"("order");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvent_type_idx" ON "CaseEvent"("type");

-- CreateIndex
CREATE INDEX "CaseEvent_occurredAt_idx" ON "CaseEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_caseId_idx" ON "Notification"("caseId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_caseId_type_createdAt_idx" ON "Notification"("caseId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EvidenceItem_caseId_idx" ON "EvidenceItem"("caseId");

-- CreateIndex
CREATE INDEX "EvidenceItem_evidenceIndex_idx" ON "EvidenceItem"("evidenceIndex");

-- CreateIndex
CREATE INDEX "EvidenceItem_uploadedAt_idx" ON "EvidenceItem"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceItem_caseId_evidenceIndex_key" ON "EvidenceItem"("caseId", "evidenceIndex");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStrategy" ADD CONSTRAINT "CaseStrategy_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPlan" ADD CONSTRAINT "DocumentPlan_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DocumentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_relatedDocumentId_fkey" FOREIGN KEY ("relatedDocumentId") REFERENCES "GeneratedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
