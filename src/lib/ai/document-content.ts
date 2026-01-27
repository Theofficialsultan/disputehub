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

Generate an EMPLOYMENT TRIBUNAL CLAIM (ET1 Form Style) document. This should be structured like an actual claim form:

SECTION 1: CLAIMANT DETAILS
Name: [Leave blank for user]
Address: [Leave blank]
Contact: [Leave blank]
Date of Birth: [Leave blank]

SECTION 2: RESPONDENT (EMPLOYER) DETAILS
Name: ${strategy.keyFacts?.find((f: string) => f.toLowerCase().includes('company') || f.toLowerCase().includes('employer')) || '[Extract from facts or leave for user]'}
Address: [Extract if available, otherwise leave blank]
Type of Business: [Extract from facts if mentioned]

SECTION 3: EMPLOYMENT DETAILS
Start Date: [Extract from facts if mentioned]
End Date: [Extract from facts if mentioned]  
Job Title: [Extract from facts if mentioned]
Working Hours: [Extract from facts]
Pay: [Extract from facts]

SECTION 4: TYPE OF CLAIM(S)
State the specific type(s) of claim (tick all that apply conceptually):
- Unfair Dismissal
- Breach of Contract (unpaid wages/holiday pay)
- Discrimination (specify type if apparent)
- Other: [specify]

SECTION 5: CLAIM DETAILS - WHAT HAPPENED
Provide a chronological, factual account in first person:

[Paragraph 1: Background]
When and how employment started, what was agreed...

[Paragraph 2-4: The Issues]
Detailed account of what happened, when, who was involved...
Reference specific dates and incidents from the facts...

[Paragraph 5: Evidence]
"I have the following evidence to support my claim: [list evidence]"

[Paragraph 6: Why it's unlawful/breach]
Explain why employer's actions were wrong/unlawful...

SECTION 6: WHAT YOU WANT THE TRIBUNAL TO ORDER
- Compensation in the amount of £[specify from desired outcome]
- [Any other remedies - reinstatement, etc.]

DECLARATION
I confirm that the information given on this form is correct to the best of my knowledge.

Signed: _________________ Date: ${today}

IMPORTANT: Write as if the claimant is completing the form themselves in first person. Make it factual, chronological, and professional.

600-900 words.`,

    evidence_list: `${baseInfo}

Generate a detailed EVIDENCE LIST & ANALYSIS document. For each piece of evidence:
- Evidence ID/Reference
- Type & Description
- Relevance to the Case
- Key Points it Proves
- How it Supports the Claim

Then provide an overall Evidence Summary showing how all evidence works together.

400-600 words.`,

    evidence_bundle: `${baseInfo}

Generate a comprehensive EVIDENCE BUNDLE & INDEX document. This should be a formal legal evidence bundle including:

PART 1 - INDEX OF EVIDENCE:
- List each piece of evidence with reference number (E1, E2, etc.)
- Include file names and descriptions
- Note which evidence items are images/photographs
- Cross-reference to relevant facts

PART 2 - EVIDENCE DESCRIPTIONS:
For each piece of evidence, provide:
- Full description of what it shows/contains
- Date and source (if known from description)
- Relevance to specific allegations
- How it supports the case

PART 3 - PHOTOGRAPHIC EVIDENCE:
${evidence.filter(e => e.fileType?.startsWith('image/')).length > 0 ? `
The bundle includes ${evidence.filter(e => e.fileType?.startsWith('image/')).length} photograph(s):
${evidence.filter(e => e.fileType?.startsWith('image/')).map((e, i) => `
Image ${i + 1}: ${e.fileName}
Reference: E${evidence.indexOf(e) + 1}
Description: ${e.description || 'Photographic evidence'}
URL: ${e.fileUrl}
`).join('\n')}

Each photograph should be reviewed in conjunction with the written evidence and facts of the case.
` : 'No photographic evidence has been uploaded yet.'}

Format this as a proper court-ready evidence bundle with clear section headings and professional formatting.

600-1000 words.`,

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

Generate a FORMAL COMPLAINT LETTER in proper business letter format. This should be addressed to the company/individual and include:

LETTER STRUCTURE:
[Sender's Name - leave blank for user to fill]
[Sender's Address - leave blank]

[Recipient Name/Company]
[Recipient Address - if known from facts, otherwise "To Whom It May Concern"]

Date: [Current Date]

Dear Sir/Madam [or specific name if known],

Re: Formal Complaint - [Brief subject line from case]

OPENING PARAGRAPH:
- State you are writing to make a formal complaint
- Brief one-sentence summary of the issue
- Reference any relevant dates/agreements

MAIN BODY (2-3 paragraphs):
- Chronological account of what happened
- Specific facts and dates
- Reference to evidence ("I have photographic evidence showing...")
- What went wrong and why it's unacceptable

IMPACT PARAGRAPH:
- How this has affected you (financially, emotionally, practically)
- Any losses incurred

RESOLUTION DEMANDED:
- Clear statement of what you want (payment, apology, action taken)
- Specific amount if financial
- Timeline for response (typically 14 days)

CLOSING:
- Professional but firm tone
- State next steps if no response (e.g., "further action", "formal proceedings")
- "I look forward to your prompt response"

Yours faithfully/sincerely,
[Signature line]

IMPORTANT: Write this as an actual letter a person would send, NOT a case summary. Use first person ("I"), direct address, and letter conventions.

400-600 words.`,

    grievance_letter: `${baseInfo}

Generate a FORMAL GRIEVANCE LETTER for ${strategy.disputeType === 'employment' ? 'workplace issues' : 'dispute resolution'}. This must be a proper letter format, NOT a case summary.

LETTER STRUCTURE:
[Your Name]
[Your Address]
[Your Email/Phone]

[Employer/Company Name]
[Company Address]

Date: [Current Date]

Dear [Manager Name/Sir/Madam],

Re: Formal Grievance - [Subject from case facts]

OPENING:
I am writing to raise a formal grievance under [company grievance procedure / UK employment law] regarding [specific issue from facts].

BACKGROUND (1-2 paragraphs):
- When did you start working/the relationship begin
- What was agreed (hours, pay, terms)
- Context of the dispute

THE GRIEVANCE (2-3 paragraphs):
- Detailed account of what happened chronologically
- Specific dates, times, locations
- What was said/done by whom
- Reference evidence: "I have photographic evidence dated X showing Y"
- Why this breaches agreement/is unfair/unlawful

IMPACT ON YOU:
- Financial loss (specific amounts)
- Stress/health impact
- Other consequences

WHAT I EXPECT:
- Specific remedy sought (payment of £X, apology, investigation)
- Timeline for response (usually 5-10 working days)
- Reference to next steps if unresolved

CLOSING:
I trust this matter will be resolved swiftly and fairly. I am willing to meet to discuss this grievance further.

I look forward to your written response within [X] working days.

Yours sincerely,
[Your signature]
[Your name]

Enclosures: [List evidence - "Photographic evidence (3 images)", "Email correspondence", etc.]

CRITICAL: This MUST be a first-person letter someone would actually send to their employer/opponent. NOT a third-person case summary. Use "I", "you", "my", proper letter format.

500-700 words.`,

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

    breach_notice: `${baseInfo}

Generate a BREACH OF CONTRACT NOTICE letter. Proper business letter format:

[YOUR NAME]
[YOUR ADDRESS]

[OTHER PARTY NAME]
[OTHER PARTY ADDRESS]

Date: [Current Date]

Dear Sir/Madam,

Re: Notice of Breach of Contract - ${caseTitle}

FORMAL NOTICE that you are in breach of the contract/agreement between us.

CONTRACT DETAILS:
- Date of Agreement: [Extract from facts]
- Nature of Contract: [Extract from facts]
- Your Obligations: [State what they agreed to do]

THE BREACH:
[Detailed account of how they breached - what they did/didn't do, when]
${Array.isArray(strategy.keyFacts) ? strategy.keyFacts.slice(0, 4).map((f: string, i: number) => `${i + 1}. ${f}`).join("\n") : ""}

EVIDENCE:
I have evidence of this breach including: [reference evidence]

LOSSES/DAMAGES:
As a result of your breach, I have suffered: [financial/other losses from desired outcome]

REMEDY REQUIRED:
${strategy.desiredOutcome || "You must remedy this breach by [specific action]"}

You have 14 days from the date of this letter to:
1. Acknowledge this breach
2. Provide full remedy as stated above
3. Compensate me for losses incurred

Failure to comply will result in legal proceedings without further notice.

Yours faithfully,
[YOUR SIGNATURE]
[YOUR NAME]

500-700 words in actual letter format, first person.`,

    damages_calculation: `${baseInfo}

Generate a DAMAGES CALCULATION & SCHEDULE document showing financial losses:

SCHEDULE OF DAMAGES - ${caseTitle}
Date: ${today}

CLAIMANT DETAILS:
Name: [User to complete]
Claim Reference: [Auto-generated]

BASIS OF CLAIM:
[Brief paragraph explaining the breach/wrong and why damages are owed]

CALCULATION OF DAMAGES:

1. DIRECT FINANCIAL LOSSES:
   - [Item from facts]: £___
   - [Item from facts]: £___
   Sub-total: £___

2. CONSEQUENTIAL LOSSES:
   - [Any knock-on losses mentioned]: £___
   Sub-total: £___

3. INTEREST:
   - Interest on late payment (8% statutory): £___
   - Period: [X] days from [date] to [date]

4. COSTS & EXPENSES:
   - Legal advice/documents: £___
   - Travel/time: £___
   Sub-total: £___

TOTAL CLAIM: £[Sum from desired outcome or calculate from facts]

BREAKDOWN NOTES:
[Paragraph explaining each calculation, referencing evidence where amounts come from]

EVIDENCE SUPPORTING CALCULATION:
${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName} - ${e.description || 'Supporting documentation'}`).join("\n") : "See attached evidence bundle"}

MITIGATION:
[State any steps taken to minimize losses]

This schedule represents the genuine losses suffered as a result of [respondent's] breach/wrongdoing.

Signed: _________________ Date: ${today}

400-600 words, professional financial document.`,

    dispute_notice: `${baseInfo}

Generate a FORMAL DISPUTE NOTICE letter:

[YOUR NAME]
[YOUR ADDRESS]

[RECIPIENT NAME]
[RECIPIENT ADDRESS]

Date: ${today}

WITHOUT PREJUDICE - FORMAL NOTICE

Dear [Sir/Madam / Name],

Re: FORMAL NOTICE OF DISPUTE - ${caseTitle}

This letter serves as formal notice that a dispute has arisen between us regarding [subject from facts].

BACKGROUND:
[Paragraph explaining the relationship/agreement and when it started]

THE DISPUTE:
I am in dispute with you concerning the following matters:

${Array.isArray(strategy.keyFacts) ? strategy.keyFacts.map((f: string, i: number) => `${i + 1}. ${f}`).join("\n\n") : ""}

MY POSITION:
${strategy.desiredOutcome || "[State your position clearly]"}

EVIDENCE:
${evidence.length > 0 ? `I have substantial evidence supporting my position, including: ${evidence.map(e => e.title || e.fileName).join(", ")}.` : "I have evidence to support my position."}

PROPOSED RESOLUTION:
I propose that this dispute be resolved as follows:
[State specifically what you want to happen - payment, action, apology, etc.]

NEXT STEPS:
I request that you respond to this notice within 14 days confirming:
1. Whether you accept my position
2. If not, your counter-proposal for resolution
3. Your willingness to engage in mediation/negotiation

If no satisfactory response is received, I will have no choice but to pursue formal legal remedies including [court proceedings / tribunal claim / arbitration] without further notice.

I remain open to resolving this matter amicably and swiftly.

Yours [faithfully/sincerely],

[YOUR SIGNATURE]
[YOUR NAME]

Copies: [Any copied parties]

500-700 words, formal but conciliatory tone.`,

    claim_form: `${baseInfo}

Generate a PARTICULARS OF CLAIM document (for County Court / Small Claims):

IN THE [COUNTY COURT / SMALL CLAIMS COURT]
Claim Number: [To be allocated]

BETWEEN:

[CLAIMANT NAME] - Claimant
-and-
[DEFENDANT NAME from facts] - Defendant

PARTICULARS OF CLAIM

1. The Claimant is [describe claimant - individual, self-employed, etc.]

2. The Defendant is [describe defendant from facts - company, individual, etc.]

3. THE AGREEMENT
   On or around [date from facts], [describe the agreement/contract between parties]
   [Detail what was agreed - work, payment, terms]

4. THE CLAIMANT'S PERFORMANCE
   ${Array.isArray(strategy.keyFacts) ? strategy.keyFacts.filter((f: string) => f.toLowerCase().includes('work') || f.toLowerCase().includes('did')).map((f: string, i: number) => `${i + 4}. ${f}`).join("\n   ") : "The Claimant performed their obligations under the agreement."}

5. THE DEFENDANT'S BREACH
   [State what defendant did wrong - failed to pay, breached terms, etc.]
   [Include specific dates and amounts]

6. EVIDENCE
   The Claimant relies upon: [list evidence items]

7. LOSS AND DAMAGE
   As a result of the Defendant's breach, the Claimant has suffered loss:
   - [Financial loss]: £___
   - [Other losses]: £___
   
8. INTEREST
   The Claimant claims interest pursuant to [section 69 County Courts Act 1984 / Late Payment Act]

AND THE CLAIMANT CLAIMS:

(1) Payment of £[amount from desired outcome]
(2) Interest on the sum claimed
(3) Costs

STATEMENT OF TRUTH
I believe that the facts stated in these Particulars of Claim are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: _________________ Date: ${today}
[CLAIMANT NAME]

600-800 words, formal legal document style with numbered paragraphs.`,
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

    grievance_letter: (p) => `[YOUR NAME]
[YOUR ADDRESS]
[YOUR EMAIL/PHONE]

[EMPLOYER/COMPANY NAME]
[COMPANY ADDRESS]

Date: ${today}

Dear Sir/Madam,

Re: Formal Grievance - ${p.caseTitle}

I am writing to raise a formal grievance regarding the following matter:

${facts.slice(0, 3).join("\n\n")}

${p.strategy.desiredOutcome ? `\nRESOLUTION SOUGHT:\n${p.strategy.desiredOutcome}` : ""}

${p.evidence.length > 0 ? `\nI have supporting evidence including: ${p.evidence.map(e => e.title || e.fileName).join(", ")}.` : ""}

I request a written response to this grievance within 10 working days. If this matter cannot be resolved informally, I am prepared to pursue formal proceedings.

I look forward to your prompt response.

Yours faithfully,

[YOUR SIGNATURE]
[YOUR NAME]

Enclosures: Evidence as listed above`,

    complaint_letter: (p) => `[YOUR NAME]
[YOUR ADDRESS]

[RECIPIENT NAME/COMPANY]
[RECIPIENT ADDRESS]

Date: ${today}

Dear Sir/Madam,

Re: Formal Complaint - ${p.caseTitle}

I am writing to make a formal complaint regarding the following matter.

COMPLAINT DETAILS:
${facts.slice(0, 4).join("\n\n")}

IMPACT:
This situation has caused me significant inconvenience and ${p.strategy.desiredOutcome ? 'financial loss' : 'distress'}.

${p.evidence.length > 0 ? `\nEVIDENCE:\nI have documentary evidence supporting this complaint, including: ${p.evidence.map(e => e.title || e.fileName).join(", ")}.` : ""}

RESOLUTION REQUIRED:
${p.strategy.desiredOutcome || "I require this matter to be investigated and resolved promptly."}

Please respond to this complaint in writing within 14 days. If I do not receive a satisfactory response, I will have no choice but to escalate this matter further.

Yours faithfully,

[YOUR SIGNATURE]
[YOUR NAME]`,

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

    evidence_bundle: (p) => {
      const images = p.evidence.filter(e => e.fileType?.startsWith('image/'));
      const otherEvidence = p.evidence.filter(e => !e.fileType?.startsWith('image/'));
      
      return `EVIDENCE BUNDLE & INDEX

${p.caseTitle}
Date: ${today}

═══════════════════════════════════════════════════════════════

PART 1: INDEX OF EVIDENCE

${p.evidence.map((e, i) => `
E${i + 1}. ${e.fileName}
    Type: ${e.fileType?.startsWith('image/') ? 'Photograph/Image' : 'Document'}
    Description: ${e.description || 'Evidence item'}
    Date uploaded: ${new Date(e.createdAt).toLocaleDateString('en-GB')}
`).join('\n')}

═══════════════════════════════════════════════════════════════

PART 2: PHOTOGRAPHIC EVIDENCE

${images.length > 0 ? images.map((e, i) => `
EXHIBIT E${p.evidence.indexOf(e) + 1}: ${e.fileName}

Description: ${e.description || 'Photographic evidence supporting the claim'}
File Type: ${e.fileType}
Date: ${new Date(e.createdAt).toLocaleDateString('en-GB')}

[IMAGE REFERENCE: ${e.fileUrl}]
This photograph should be viewed as part of the evidence bundle and corroborates the facts as stated in the case summary.

Relevance to Case:
${e.description || 'This image provides visual evidence supporting the claimant\'s allegations.'}

───────────────────────────────────────────────────────────────
`).join('\n') : 'No photographic evidence has been uploaded.\n\nNote: If you have photographs, screenshots, or other images relevant to this case, you should upload them as evidence.'}

═══════════════════════════════════════════════════════════════

PART 3: OTHER DOCUMENTARY EVIDENCE

${otherEvidence.length > 0 ? otherEvidence.map((e, i) => `
EXHIBIT E${p.evidence.indexOf(e) + 1}: ${e.fileName}

Type: ${e.fileType || 'Document'}
Description: ${e.description || 'Supporting documentation'}
Date: ${new Date(e.createdAt).toLocaleDateString('en-GB')}

───────────────────────────────────────────────────────────────
`).join('\n') : 'No additional documentary evidence on file.'}

═══════════════════════════════════════════════════════════════

DECLARATION

I confirm that the evidence listed in this bundle is true and accurate to the best of my knowledge and belief.

The photographic evidence included shows genuine images that have not been altered or manipulated.

All evidence is provided in support of the case: ${p.caseTitle}

Date: ${today}
Signature: _______________________`;
    },
  };

  const generator = templates[documentType] || templates.case_summary;
  return generator(params);
}
