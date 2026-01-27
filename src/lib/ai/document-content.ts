/**
 * AI Document Content Generation
 * 
 * Uses OpenAI to generate actual legal document content based on case strategy.
 */

import { openai } from "./openai";
import type { CaseStrategy, EvidenceItem } from "@prisma/client";

interface GenerateContentParams {
  documentType: string;
  strategy: CaseStrategy;
  evidence: EvidenceItem[];
  caseTitle: string;
}

export async function generateAIContent(params: GenerateContentParams): Promise<string> {
  const { documentType, strategy, evidence, caseTitle } = params;

  const prompt = buildDocumentPrompt(documentType, strategy, evidence, caseTitle);

  console.log(`[AI Content] Generating ${documentType}...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert legal document writer. Generate professional, detailed legal documents based on the case information provided. Use formal legal language and proper structure.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    if (!content || content.trim().length < 100) {
      throw new Error(`AI generated insufficient content: ${content.length} characters`);
    }

    console.log(`[AI Content] ✅ Generated ${content.length} characters for ${documentType}`);
    return content;

  } catch (error) {
    console.error(`[AI Content] ❌ Error generating ${documentType}:`, error);
    throw error;
  }
}

function buildDocumentPrompt(
  documentType: string,
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string
): string {
  const baseInfo = `
CASE INFORMATION:
Title: ${caseTitle}
Dispute Type: ${strategy.disputeType || "General"}

KEY FACTS:
${Array.isArray(strategy.keyFacts) ? strategy.keyFacts.map((fact, i) => `${i + 1}. ${fact}`).join("\n") : "No key facts provided"}

DESIRED OUTCOME:
${strategy.desiredOutcome || "Not specified"}

EVIDENCE:
${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName} - ${e.description || "No description"}`).join("\n") : "No evidence uploaded"}
`;

  const prompts: Record<string, string> = {
    demand_letter: `${baseInfo}

Generate a professional DEMAND LETTER for this case. The letter should:
- Be addressed "To Whom It May Concern" (recipient details not provided)
- State the facts of the dispute clearly
- Reference the evidence
- Make a clear demand for the desired outcome
- Include a reasonable deadline for response (14 days)
- Maintain a firm but professional tone
- Be 400-600 words

Format as a proper business letter with sections.`,

    case_summary: `${baseInfo}

Generate a comprehensive CASE SUMMARY document. Include:
- Executive Summary (2-3 sentences)
- Background & Context
- Key Facts & Timeline
- Evidence Overview
- Legal Issues
- Desired Resolution
- Next Steps

Be thorough and professional. 500-800 words.`,

    employment_claim: `${baseInfo}

Generate an EMPLOYMENT CLAIM DOCUMENT. Include:
- Claimant Information Section (leave blank for user to fill)
- Employer Information Section (extract from facts if available)
- Nature of Claim
- Detailed Facts & Circumstances
- Evidence Supporting Claim
- Violations & Harm Suffered
- Requested Relief & Compensation
- Declaration Statement

Professional legal document format. 600-900 words.`,

    evidence_list: `${baseInfo}

Generate a detailed EVIDENCE LIST & ANALYSIS document. For each piece of evidence:
- Evidence ID/Reference
- Type & Description
- Relevance to the Case
- Key Points it Proves
- How it Supports the Claim

Then provide an overall Evidence Summary showing how all evidence works together.

400-600 words.`,

    breach_analysis: `${baseInfo}

Generate a CONTRACT BREACH ANALYSIS. Include:
- Contract Overview (based on facts provided)
- Parties' Obligations
- Breach Details
- Timeline of Events
- Evidence of Breach
- Damages & Impact
- Legal Basis for Claim

Professional legal analysis. 500-700 words.`,

    remedy_calculation: `${baseInfo}

Generate a DAMAGES & REMEDY CALCULATION document. Include:
- Types of Damages Applicable
- Calculation Methodology
- Itemized Breakdown (based on facts)
- Supporting Evidence
- Total Amount Sought
- Alternative Remedies (if applicable)

Professional financial/legal document. 400-600 words.`,

    complaint_letter: `${baseInfo}

Generate a FORMAL COMPLAINT LETTER. Should:
- State the complaint clearly
- Provide factual background
- Reference evidence
- Explain impact/harm
- Request specific action
- Set reasonable deadline
- Professional but firm tone

Business letter format. 400-600 words.`,

    property_dispute_notice: `${baseInfo}

Generate a PROPERTY DISPUTE NOTICE. Include:
- Property Description (from facts)
- Nature of Dispute
- Parties Involved
- Timeline of Events
- Evidence & Documentation
- Legal Basis
- Requested Resolution
- Notice of Further Action

Legal notice format. 500-700 words.`,

    debt_validation_letter: `${baseInfo}

Generate a DEBT VALIDATION REQUEST letter. Should:
- Reference the alleged debt
- Request validation under FDCPA
- State the dispute
- Request documentation
- Assert rights
- Demand cease of collection activity
- Professional legal tone

Legal letter format. 300-500 words.`,

    dispute_letter: `${baseInfo}

Generate a DISPUTE RESOLUTION LETTER. Include:
- Statement of Dispute
- Factual Background
- Evidence Summary
- Attempted Resolution (if any)
- Proposed Solution
- Timeline for Response
- Professional negotiation tone

Business letter format. 400-600 words.`,
  };

  return prompts[documentType] || prompts.case_summary;
}
