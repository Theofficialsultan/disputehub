#!/usr/bin/env npx tsx
/**
 * DOCUMENT QUALITY ANALYZER
 * 
 * Analyzes generated documents for quality issues and provides improvement suggestions.
 * Run: npx tsx scripts/analyze-document-quality.ts [disputeId]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// QUALITY CRITERIA
// ============================================================================

interface QualityCheck {
  name: string;
  check: (content: string, docType: string) => { passed: boolean; message: string; severity: "error" | "warning" | "info" };
}

const QUALITY_CHECKS: QualityCheck[] = [
  // STRUCTURE CHECKS
  {
    name: "Has proper header",
    check: (content, docType) => {
      const hasHeader = content.includes("═══") || content.includes("───") || content.includes("IN THE");
      return {
        passed: hasHeader,
        message: hasHeader ? "Document has proper header structure" : "Missing proper document header",
        severity: "warning"
      };
    }
  },
  {
    name: "Has sections",
    check: (content, docType) => {
      const sectionCount = (content.match(/SECTION \d|PART \d|^\d+\./gm) || []).length;
      const passed = sectionCount >= 2;
      return {
        passed,
        message: passed ? `Found ${sectionCount} sections` : "Document lacks clear sections",
        severity: "warning"
      };
    }
  },
  {
    name: "Has signature/declaration",
    check: (content, docType) => {
      const hasSig = content.toLowerCase().includes("signed") || 
                     content.toLowerCase().includes("signature") ||
                     content.toLowerCase().includes("declaration") ||
                     content.includes("I confirm");
      return {
        passed: hasSig,
        message: hasSig ? "Has signature/declaration section" : "Missing signature or declaration section",
        severity: docType.includes("LBA") || docType.includes("N1") || docType.includes("ET1") ? "error" : "warning"
      };
    }
  },

  // CONTENT QUALITY CHECKS
  {
    name: "No undefined values",
    check: (content) => {
      const hasUndefined = content.includes("undefined") || content.includes("null");
      return {
        passed: !hasUndefined,
        message: hasUndefined ? "Contains 'undefined' or 'null' values - data extraction failed" : "No undefined values",
        severity: "error"
      };
    }
  },
  {
    name: "No empty brackets",
    check: (content) => {
      const hasEmpty = /\[\s*\]/.test(content) || /\{\s*\}/.test(content);
      return {
        passed: !hasEmpty,
        message: hasEmpty ? "Contains empty brackets - missing data" : "No empty brackets",
        severity: "warning"
      };
    }
  },
  {
    name: "Minimum length",
    check: (content, docType) => {
      const minLengths: Record<string, number> = {
        "UK-ET1": 3000,
        "UK-N1": 2000,
        "UK-LBA": 1500,
        "UK-EVIDENCE": 800,
        "UK-SCHEDULE": 600,
        "DEFAULT": 500
      };
      const prefix = Object.keys(minLengths).find(k => docType.startsWith(k)) || "DEFAULT";
      const minLength = minLengths[prefix];
      const passed = content.length >= minLength;
      return {
        passed,
        message: passed ? `Length OK (${content.length} chars)` : `Too short (${content.length}/${minLength} chars)`,
        severity: "error"
      };
    }
  },

  // LEGAL ACCURACY CHECKS
  {
    name: "Has date",
    check: (content) => {
      const hasDate = /\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(content) ||
                      /Date:\s*\S/.test(content);
      return {
        passed: hasDate,
        message: hasDate ? "Document is dated" : "Missing date",
        severity: "warning"
      };
    }
  },
  {
    name: "Has monetary amount",
    check: (content, docType) => {
      if (!docType.includes("SCHEDULE") && !docType.includes("LBA") && !docType.includes("N1")) {
        return { passed: true, message: "N/A for this document type", severity: "info" };
      }
      const hasAmount = /£[\d,]+(\.\d{2})?/.test(content);
      return {
        passed: hasAmount,
        message: hasAmount ? "Has monetary amount" : "Missing monetary amount (£) in financial document",
        severity: "error"
      };
    }
  },
  {
    name: "Has party names",
    check: (content) => {
      const hasClaimant = content.toLowerCase().includes("claimant") || content.toLowerCase().includes("complainant");
      const hasDefendant = content.toLowerCase().includes("defendant") || content.toLowerCase().includes("respondent");
      const passed = hasClaimant || hasDefendant;
      return {
        passed,
        message: passed ? "Has party identifications" : "Missing party identifications (Claimant/Defendant)",
        severity: "warning"
      };
    }
  },

  // FORMATTING CHECKS
  {
    name: "No excessive underscores",
    check: (content) => {
      const underscoreRuns = (content.match(/_{10,}/g) || []).length;
      const passed = underscoreRuns < 20;
      return {
        passed,
        message: passed ? `${underscoreRuns} fill-in blanks` : `Too many blanks (${underscoreRuns}) - looks unfinished`,
        severity: underscoreRuns > 30 ? "error" : "warning"
      };
    }
  },
  {
    name: "Has specific facts",
    check: (content, docType) => {
      // Check for specific details vs generic placeholders
      const specificPatterns = [
        /on\s+\d{1,2}(st|nd|rd|th)?\s+\w+/i, // "on 15th January"
        /£[\d,]+/,                             // "£2,500"
        /\b\d+\s*(hours?|days?|weeks?|months?)/i, // "40 hours"
      ];
      const specifics = specificPatterns.filter(p => p.test(content)).length;
      const passed = specifics >= 2;
      return {
        passed,
        message: passed ? `Contains ${specifics}/3 specific detail types` : "Lacks specific facts (dates, amounts, durations)",
        severity: "warning"
      };
    }
  },

  // PROFESSIONAL TONE
  {
    name: "Professional language",
    check: (content) => {
      const unprofessional = [
        /\bpissed\b/i, /\bfucked\b/i, /\bshit\b/i, /\basshole\b/i,
        /\bidiot\b/i, /\bstupid\b/i, /\bdumb\b/i,
        /!!!+/, /\?\?+/
      ];
      const found = unprofessional.filter(p => p.test(content));
      const passed = found.length === 0;
      return {
        passed,
        message: passed ? "Professional tone maintained" : "Contains unprofessional language",
        severity: "error"
      };
    }
  },

  // LEGAL TERMINOLOGY
  {
    name: "Uses legal terminology",
    check: (content, docType) => {
      const legalTerms = [
        "pursuant", "hereby", "aforementioned", "whereas", "hereinafter",
        "breach", "liability", "damages", "remedy", "statute",
        "claimant", "defendant", "respondent", "tribunal", "court"
      ];
      const found = legalTerms.filter(term => content.toLowerCase().includes(term));
      const passed = found.length >= 3;
      return {
        passed,
        message: passed ? `Uses ${found.length} legal terms` : "Lacks legal terminology - may seem informal",
        severity: "info"
      };
    }
  }
];

// ============================================================================
// ANALYZER
// ============================================================================

interface AnalysisResult {
  documentType: string;
  documentTitle: string;
  overallScore: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    severity: "error" | "warning" | "info";
  }[];
  suggestions: string[];
}

function analyzeDocument(content: string, docType: string, docTitle: string): AnalysisResult {
  const checks = QUALITY_CHECKS.map(qc => ({
    name: qc.name,
    ...qc.check(content, docType)
  }));

  // Calculate score
  const errors = checks.filter(c => c.severity === "error" && !c.passed).length;
  const warnings = checks.filter(c => c.severity === "warning" && !c.passed).length;
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  
  // Score: 100 base, -15 per error, -5 per warning
  const overallScore = Math.max(0, 100 - (errors * 15) - (warnings * 5));

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (errors > 0) {
    suggestions.push("🔴 CRITICAL FIXES NEEDED:");
    for (const check of checks.filter(c => c.severity === "error" && !c.passed)) {
      suggestions.push(`   - Fix: ${check.message}`);
    }
  }
  
  if (warnings > 0) {
    suggestions.push("🟡 IMPROVEMENTS SUGGESTED:");
    for (const check of checks.filter(c => c.severity === "warning" && !c.passed)) {
      suggestions.push(`   - Improve: ${check.message}`);
    }
  }

  // Document-specific suggestions
  if (docType.includes("ET1")) {
    if (!content.includes("ACAS")) {
      suggestions.push("📋 ET1 SPECIFIC: Mention ACAS early conciliation requirement");
    }
    if (!content.toLowerCase().includes("time limit")) {
      suggestions.push("📋 ET1 SPECIFIC: Include time limit warning (usually 3 months minus 1 day)");
    }
  }

  if (docType.includes("LBA")) {
    if (!content.includes("14 days") && !content.includes("14-day")) {
      suggestions.push("📋 LBA SPECIFIC: Include clear 14-day deadline for response");
    }
    if (!content.toLowerCase().includes("pre-action protocol")) {
      suggestions.push("📋 LBA SPECIFIC: Reference Pre-Action Protocol compliance");
    }
  }

  if (docType.includes("N1") || docType.includes("PARTICULARS")) {
    if (!content.includes("statement of truth") && !content.includes("Statement of Truth")) {
      suggestions.push("📋 COURT FORM SPECIFIC: Must include Statement of Truth");
    }
    if (!content.toLowerCase().includes("interest")) {
      suggestions.push("📋 COURT FORM SPECIFIC: Include interest claim (s69 County Courts Act 1984)");
    }
  }

  return {
    documentType: docType,
    documentTitle: docTitle,
    overallScore,
    checks,
    suggestions
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function analyzeDispute(disputeId: string) {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("DOCUMENT QUALITY ANALYSIS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const documents = await prisma.generatedDocument.findMany({
    where: { caseId: disputeId },
    orderBy: { order: "asc" }
  });

  if (documents.length === 0) {
    console.log(`❌ No documents found for dispute: ${disputeId}`);
    return;
  }

  console.log(`Found ${documents.length} documents to analyze\n`);

  let totalScore = 0;
  const results: AnalysisResult[] = [];

  for (const doc of documents) {
    const result = analyzeDocument(doc.content || "", doc.type, doc.title);
    results.push(result);
    totalScore += result.overallScore;

    console.log(`───────────────────────────────────────────────────────────────`);
    console.log(`📄 ${doc.type}`);
    console.log(`   ${doc.title}`);
    console.log(`   Status: ${doc.status}`);
    console.log(`   Score: ${result.overallScore}/100 ${getScoreEmoji(result.overallScore)}`);
    console.log(`───────────────────────────────────────────────────────────────`);
    
    console.log("\n   Checks:");
    for (const check of result.checks) {
      const icon = check.passed ? "✅" : check.severity === "error" ? "❌" : "⚠️";
      console.log(`   ${icon} ${check.name}: ${check.message}`);
    }

    if (result.suggestions.length > 0) {
      console.log("\n   Suggestions:");
      for (const suggestion of result.suggestions) {
        console.log(`   ${suggestion}`);
      }
    }
    console.log("");
  }

  // Overall summary
  const avgScore = Math.round(totalScore / documents.length);
  
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("OVERALL ASSESSMENT");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  console.log(`Average Quality Score: ${avgScore}/100 ${getScoreEmoji(avgScore)}`);
  console.log(`Documents Analyzed: ${documents.length}`);
  
  const excellent = results.filter(r => r.overallScore >= 90).length;
  const good = results.filter(r => r.overallScore >= 70 && r.overallScore < 90).length;
  const needsWork = results.filter(r => r.overallScore >= 50 && r.overallScore < 70).length;
  const poor = results.filter(r => r.overallScore < 50).length;
  
  console.log(`\nBreakdown:`);
  console.log(`   🌟 Excellent (90+): ${excellent}`);
  console.log(`   ✅ Good (70-89):    ${good}`);
  console.log(`   ⚠️  Needs Work (50-69): ${needsWork}`);
  console.log(`   ❌ Poor (<50):      ${poor}`);
  
  if (avgScore >= 80) {
    console.log(`\n✅ Documents are ready for use with minor review`);
  } else if (avgScore >= 60) {
    console.log(`\n⚠️  Documents need improvement before use`);
  } else {
    console.log(`\n❌ Documents require significant rework`);
  }
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return "🌟";
  if (score >= 80) return "✅";
  if (score >= 70) return "👍";
  if (score >= 50) return "⚠️";
  return "❌";
}

async function analyzeAllRecent() {
  console.log("Analyzing most recent disputes with documents...\n");
  
  const disputes = await prisma.dispute.findMany({
    where: {
      phase: "COMPLETED"
    },
    orderBy: { updatedAt: "desc" },
    take: 5
  });

  for (const dispute of disputes) {
    // Check if dispute has documents
    const docCount = await prisma.generatedDocument.count({
      where: { caseId: dispute.id }
    });
    
    if (docCount > 0) {
      console.log(`\n\n${"═".repeat(70)}`);
      console.log(`DISPUTE: ${dispute.title}`);
      console.log(`ID: ${dispute.id}`);
      console.log(`${"═".repeat(70)}`);
      await analyzeDispute(dispute.id);
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);

if (args[0] === "--recent" || args.length === 0) {
  analyzeAllRecent()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
} else {
  analyzeDispute(args[0])
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
