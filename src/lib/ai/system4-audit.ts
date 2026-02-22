/**
 * SYSTEM 4: LEGAL AUDIT & DEFECT ENGINE
 * 
 * Silent post-generation auditor that flags defects, procedural errors, and risks.
 * Philosophy: Conservative, explainable, never invents issues.
 * 
 * Runs AFTER System 3 completes document generation.
 */

import { openai } from "./openai";
import { prisma } from "@/lib/prisma";

export interface AuditFlag {
  issue: string;
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
  category: "evidence" | "procedure" | "deadline" | "legal_basis" | "other";
}

export interface AuditResult {
  flags: AuditFlag[];
  overallScore: number; // 0-100 (100 = perfect, no issues)
  auditedAt: string;
  summary: string;
}

/**
 * Audit a case for defects and risks
 * Called after document generation completes
 */
export async function auditCase(caseId: string): Promise<AuditResult> {
  try {
    // Fetch complete case data
    const caseData = await prisma.dispute.findUnique({
      where: { id: caseId },
      include: {
        generatedDocuments: true,
        evidenceItems: true,
        caseStrategy: true,
        documentPlan: true,
      },
    });

    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    console.log(`[System 4] Auditing case ${caseId}...`);

    // Build audit prompt
    const prompt = `You are a legal audit system. Review this case for defects, procedural errors, and risks.

CASE FACTS:
${JSON.stringify(caseData.caseSummary || {}, null, 2)}

DOCUMENTS GENERATED:
${caseData.generatedDocuments.map(d => `- ${d.title} (${d.status})`).join('\n')}

EVIDENCE UPLOADED:
${caseData.evidenceItems.map(e => `- ${e.title} (${e.fileType})`).join('\n') || "None"}

ROUTING DECISION:
- Forum: ${caseData.documentPlan?.forum || "Unknown"}
- Jurisdiction: ${caseData.documentPlan?.jurisdiction || "Unknown"}
- Deadline: ${caseData.documentPlan?.timeLimitDeadline || "Not set"}

YOUR JOB:
Flag ONLY real issues. Be conservative and explainable. Never invent defects or advise cheating.

Check for:
1. **Missing Evidence**: Does claim reference evidence not uploaded? (e.g., "email confirmation" mentioned but no email)
2. **Procedural Errors**: Wrong forum? Missing prerequisites? Deadline concerns?
3. **Legal Basis Issues**: Weak claim foundation? Missing key facts?
4. **Completeness**: Are all required documents present?

Output ONLY valid JSON:
{
  "flags": [
    {
      "issue": "Specific issue description",
      "riskLevel": "low" | "medium" | "high",
      "suggestion": "Concrete suggestion to fix",
      "category": "evidence" | "procedure" | "deadline" | "legal_basis" | "other"
    }
  ],
  "overallScore": 0-100 (100 = perfect case, 0 = critically defective),
  "summary": "Brief 1-2 sentence summary of case quality"
}

EXAMPLES:

Good flag:
{
  "issue": "Claim mentions 'email confirmation from employer' but no email evidence uploaded",
  "riskLevel": "medium",
  "suggestion": "Upload the email correspondence as Evidence Item to strengthen your case",
  "category": "evidence"
}

Bad flag (too vague):
{
  "issue": "Evidence might be weak",
  "riskLevel": "low",
  "suggestion": "Add more evidence"
}

If case is solid with no issues, return:
{
  "flags": [],
  "overallScore": 95,
  "summary": "Case appears well-documented with all necessary evidence and correct forum selection."
}`;

    // Call GPT-4o for audit
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a legal audit system. Output only valid JSON. Be conservative - only flag real issues.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const auditResult = JSON.parse(content) as AuditResult;
    auditResult.auditedAt = new Date().toISOString();

    console.log(`[System 4] Audit complete - Score: ${auditResult.overallScore}%, Flags: ${auditResult.flags.length}`);

    // Save audit result to database (store in caseSummary or new field)
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        // Store audit in a JSON field (you may need to add this to schema)
        // For now, we'll append to caseSummary
        caseSummary: {
          ...(caseData.caseSummary as any),
          auditResult,
        },
      },
    });

    return auditResult;
  } catch (error) {
    console.error("[System 4] Audit failed:", error);

    // Return safe fallback
    return {
      flags: [],
      overallScore: 75,
      summary: "Audit could not be completed. Please review your case manually.",
      auditedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get audit result for a case
 */
export async function getAuditResult(caseId: string): Promise<AuditResult | null> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    select: { caseSummary: true },
  });

  if (!dispute?.caseSummary) return null;

  const summary = dispute.caseSummary as any;
  return summary.auditResult || null;
}
