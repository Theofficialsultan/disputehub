/**
 * AI Document Content Generation - UK Legal Documents
 * 
 * Enhanced system with:
 * - UK-specific legal templates and language
 * - Fallback content generation if OpenAI fails
 * - Content cleaning to remove markdown artifacts
 * - Proper formatting for legal documents
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

  console.log(`[AI Content] Generating ${documentType}...`);

  try {
    // Try OpenAI generation first
    const aiContent = await generateWithOpenAI(params);
    const cleanedContent = cleanMarkdownArtifacts(aiContent);
    
    console.log(`[AI Content] ✅ Generated ${cleanedContent.length} chars for ${documentType}`);
    return cleanedContent;

  } catch (error) {
    console.warn(`[AI Content] ⚠️  OpenAI failed, using fallback for ${documentType}:`, error);
    
    // Fallback to template-based generation
    const fallbackContent = generateFallbackContent(params);
    console.log(`[AI Content] ✅ Fallback content generated (${fallbackContent.length} chars)`);
    return fallbackContent;
  }
}

async function generateWithOpenAI(params: GenerateContentParams): Promise<string> {
  const { documentType, strategy, evidence, caseTitle } = params;
  const prompt = buildDocumentPrompt(documentType, strategy, evidence, caseTitle);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: getSystemPromptForDocumentType(documentType),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = completion.choices[0]?.message?.content || "";
  
  if (!content || content.trim().length < 100) {
    throw new Error(`AI generated insufficient content: ${content.length} characters`);
  }

  return content;
}

function getSystemPromptForDocumentType(documentType: string): string {
  const basePrompt = "You are an expert UK legal document writer with deep knowledge of UK law, court procedures, and legal drafting standards.";
  
  const specificPrompts: Record<string, string> = {
    employment_claim: `${basePrompt} You specialize in Employment Tribunal claims (ET1 forms) and understand ACAS procedures, unfair dismissal law, and discrimination legislation.`,
    appeal_letter: `${basePrompt} You specialize in Parking Charge Notice (PCN) appeals and understand the BPA/IPC codes of practice and appeal procedures.`,
    demand_letter: `${basePrompt} You write formal before-action letters complying with Pre-Action Protocol requirements.`,
    ccj_response: `${basePrompt} You draft defences to County Court claims and understand CPR procedures.`,
    witness_statement: `${basePrompt} You draft witness statements complying with CPR 32 and court requirements.`,
  };

  return specificPrompts[documentType] || basePrompt;
}

function cleanMarkdownArtifacts(content: string): string {
  // Remove markdown formatting artifacts that might appear
  return content
    .replace(/```[\w]*\n?/g, "") // Remove code blocks
    .replace(/^#{1,6}\s+/gm, "") // Remove markdown headers (keep the text)
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold markers (keep text)
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic markers
    .replace(/^[-*]\s+/gm, "• ") // Convert markdown lists to bullets
    .trim();
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

// Fallback content generator (used if OpenAI fails)
function generateFallbackContent(params: GenerateContentParams): string {
  const { documentType, strategy, evidence, caseTitle } = params;
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const today = new Date().toLocaleDateString("en-GB");
  
  // Basic template-based generation
  const templates: Record<string, (p: typeof params) => string> = {
    case_summary: (p) => `CASE SUMMARY

Title: ${p.caseTitle}
Date: ${today}
Dispute Type: ${p.strategy.disputeType || "General Dispute"}

KEY FACTS:
${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

DESIRED OUTCOME:
${p.strategy.desiredOutcome || "Not specified"}

EVIDENCE:
${p.evidence.length > 0 ? p.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join("\n") : "No evidence provided"}

This case summary provides an overview of the dispute and forms the basis for further legal action if required.`,

    demand_letter: (p) => `[YOUR NAME]
[YOUR ADDRESS]

To Whom It May Concern

Date: ${today}
Re: ${p.caseTitle}

Dear Sir/Madam,

FORMAL DEMAND - ${p.caseTitle.toUpperCase()}

I am writing to formally demand resolution of the following matter:

${facts.slice(0, 5).join("\n\n")}

${p.strategy.desiredOutcome ? `DEMAND:\n${p.strategy.desiredOutcome}` : ""}

${p.evidence.length > 0 ? `I have evidence to support this claim including: ${p.evidence.map(e => e.title || e.fileName).join(", ")}.` : ""}

You have 14 days from the date of this letter to respond and resolve this matter. Failure to do so will result in further action without additional notice.

Yours faithfully,
[Your signature]`,
  };

  const generator = templates[documentType] || templates.case_summary;
  return generator(params);
}
