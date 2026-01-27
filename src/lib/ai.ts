/**
 * AI Preview Generator - Provider-agnostic
 * Cost-controlled preview generation for dispute analysis
 * 
 * Supports: OpenAI (current), Anthropic (future)
 */

import OpenAI from "openai";

// AI Provider configuration
const AI_PROVIDER = (process.env.AI_PROVIDER || "openai") as "openai" | "anthropic";

// OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

type DisputeType = string;

interface AIPreview {
  summary: string;
  keyPoints: string[];
  strength: "weak" | "moderate" | "strong";
  fullLetterPreview: string;
  lockedContent: {
    fullLetter: string;
    legalReferences: string[];
    submissionSteps: string[];
  };
}

interface FullAnalysis {
  fullLetter: string;
  legalGrounds: string[];
  legalReferences: string[];
  nextSteps: string[];
  generatedAt: string;
}

/**
 * Generate AI preview (provider-agnostic entry point)
 * This generates ONLY the preview, not the full content
 */
export async function generateAIPreview(
  type: DisputeType,
  description: string,
  evidenceCount: number = 0
): Promise<AIPreview> {
  try {
    // Route to appropriate provider
    const aiResponse = await generateWithProvider(type, description, evidenceCount);

    // Generate the full letter preview format
    const fullLetterPreview = generateLetterPreview(
      aiResponse.letterPreviewLines || []
    );

    // Generate locked content (still templates for now, full AI generation comes later)
    const lockedContent = generateLockedContent(type, description);

    return {
      summary: aiResponse.summary,
      keyPoints: aiResponse.keyPoints,
      strength: aiResponse.strength,
      fullLetterPreview,
      lockedContent,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    // Fallback to basic preview if AI fails
    return generateFallbackPreview(type, description, evidenceCount);
  }
}

/**
 * Provider-agnostic AI generation router
 */
async function generateWithProvider(
  type: string,
  description: string,
  evidenceCount: number
): Promise<{
  summary: string;
  keyPoints: string[];
  strength: "weak" | "moderate" | "strong";
  letterPreviewLines: string[];
}> {
  switch (AI_PROVIDER) {
    case "openai":
      return await generateWithOpenAI(type, description, evidenceCount);
    case "anthropic":
      // Future: return await generateWithAnthropic(type, description, evidenceCount);
      throw new Error("Anthropic provider not yet implemented");
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * OpenAI-specific implementation
 */
async function generateWithOpenAI(
  type: string,
  description: string,
  evidenceCount: number
): Promise<{
  summary: string;
  keyPoints: string[];
  strength: "weak" | "moderate" | "strong";
  letterPreviewLines: string[];
}> {
  const openai = getOpenAIClient();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert dispute resolution advisor helping UK citizens challenge unfair decisions. Your role is to analyze their case and provide clear, actionable guidance.

ANALYSIS REQUIREMENTS:

1. SUMMARY (4-5 sentences):
   - State the case strength clearly and confidently
   - Explain WHY they have grounds to dispute (specific reasons from their description)
   - Reference their actual evidence and circumstances
   - Use professional but human tone (no legal jargon)
   - Be direct - avoid hedging words like "may", "might", "could potentially"

2. KEY POINTS (exactly 5):
   - Extract specific facts and arguments from their description
   - Each point should be concrete and actionable
   - Reference actual dates, amounts, or circumstances they mentioned
   - Focus on procedural errors, factual contradictions, or rights violations
   - Avoid generic statements - be specific to their case

3. STRENGTH SCORING (use explicit criteria):
   - STRONG: Multiple clear grounds + supporting evidence + procedural errors
   - MODERATE: Clear grounds + some evidence OR single strong procedural error
   - WEAK: Limited detail + no evidence + vague circumstances
   
4. LETTER PREVIEW (3 lines):
   - Line 1: Formal opening with specific reference to their dispute
   - Line 2: Clear statement of their position
   - Line 3: First key argument from their case

TONE GUIDELINES:
- Calm and confident (not aggressive or uncertain)
- Professional but accessible (not legal-jargon heavy)
- Specific and factual (not generic or vague)
- Assertive (avoid "I believe", "perhaps", "it seems")

Respond in JSON format:
{
  "summary": "4-5 sentence analysis with specific reasons why they have a case",
  "keyPoints": ["Specific point 1", "Specific point 2", "Specific point 3", "Specific point 4", "Specific point 5"],
  "strength": "weak" | "moderate" | "strong",
  "letterPreviewLines": ["Opening line", "Position statement", "First argument"]
}`,
      },
      {
        role: "user",
        content: `Dispute Type: ${type}
Evidence Files Provided: ${evidenceCount}

User's Description:
${description}`,
      },
    ],
    temperature: 0.6, // Slightly lower for more consistent quality
    max_tokens: 1000, // Increased for better quality output
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  
  // Post-processing: ensure quality standards
  return postProcessAIResponse(parsed, description, evidenceCount);
}

/**
 * Post-process AI response to ensure quality standards
 */
function postProcessAIResponse(
  response: any,
  description: string,
  evidenceCount: number
): {
  summary: string;
  keyPoints: string[];
  strength: "weak" | "moderate" | "strong";
  letterPreviewLines: string[];
} {
  // Validate and clean summary
  let summary = response.summary || "";
  summary = cleanText(summary);
  
  // Ensure summary is substantial (4-5 sentences)
  if (summary.split(". ").length < 3) {
    summary = enhanceSummary(summary, response.strength);
  }

  // Validate and clean key points
  let keyPoints = Array.isArray(response.keyPoints) ? response.keyPoints : [];
  keyPoints = keyPoints.map((point: string) => cleanText(point)).filter(Boolean);
  
  // Ensure exactly 5 key points
  while (keyPoints.length < 5) {
    keyPoints.push("Additional grounds for dispute identified in your case");
  }
  keyPoints = keyPoints.slice(0, 5);

  // Validate strength with explicit criteria
  let strength = validateStrength(
    response.strength,
    description,
    evidenceCount,
    keyPoints
  );

  // Validate letter preview lines
  let letterPreviewLines = Array.isArray(response.letterPreviewLines)
    ? response.letterPreviewLines
    : [];
  letterPreviewLines = letterPreviewLines.map((line: string) => cleanText(line)).filter(Boolean);
  
  // Ensure 3 lines minimum
  if (letterPreviewLines.length < 3) {
    letterPreviewLines = generateDefaultLetterPreview();
  }

  return {
    summary,
    keyPoints,
    strength,
    letterPreviewLines: letterPreviewLines.slice(0, 3),
  };
}

/**
 * Clean text: remove hedging language and improve confidence
 */
function cleanText(text: string): string {
  if (!text) return "";
  
  return text
    .trim()
    // Remove hedging language
    .replace(/\b(may|might|could|perhaps|possibly|potentially)\b/gi, "")
    .replace(/\b(it seems|it appears|I believe)\b/gi, "")
    // Clean up double spaces
    .replace(/\s+/g, " ")
    // Ensure proper sentence structure
    .replace(/\s+\./g, ".")
    .trim();
}

/**
 * Enhance summary if too short
 */
function enhanceSummary(summary: string, strength: string): string {
  const strengthText = 
    strength === "strong" ? "You have strong grounds for this dispute." :
    strength === "moderate" ? "You have reasonable grounds for this dispute." :
    "Your case requires additional evidence to strengthen it.";
  
  return summary ? `${summary} ${strengthText}` : strengthText;
}

/**
 * Validate strength assessment with explicit criteria
 */
function validateStrength(
  aiStrength: string,
  description: string,
  evidenceCount: number,
  keyPoints: string[]
): "weak" | "moderate" | "strong" {
  // Use AI assessment if valid
  if (["weak", "moderate", "strong"].includes(aiStrength)) {
    // But apply sanity checks
    const descLength = description.length;
    const hasEvidence = evidenceCount > 0;
    const hasDetail = descLength > 300;
    
    // Strong requires evidence or substantial detail
    if (aiStrength === "strong" && !hasEvidence && !hasDetail) {
      return "moderate";
    }
    
    // Weak should have some justification
    if (aiStrength === "weak" && hasEvidence && hasDetail) {
      return "moderate";
    }
    
    return aiStrength as "weak" | "moderate" | "strong";
  }
  
  // Fallback criteria if AI didn't provide valid strength
  const descLength = description.length;
  const hasEvidence = evidenceCount > 0;
  
  if (descLength > 500 && evidenceCount >= 2) return "strong";
  if (descLength > 300 || hasEvidence) return "moderate";
  return "weak";
}

/**
 * Generate default letter preview if AI didn't provide one
 */
function generateDefaultLetterPreview(): string[] {
  return [
    "Dear Sir/Madam,",
    "I am writing to formally dispute the decision referenced above.",
    "I believe this decision was made in error for the following reasons:",
  ];
}

/**
 * Generate letter preview from AI-generated lines
 */
function generateLetterPreview(lines: string[]): string {
  const previewLines = lines.slice(0, 3).join("\n\n");
  return `${previewLines}\n\n[BLURRED CONTENT - LOCKED]`;
}

/**
 * Generate locked content (templates for now, full AI later)
 * This keeps the same structure but with placeholder content
 */
function generateLockedContent(
  type: string,
  description: string
): AIPreview["lockedContent"] {
  return {
    fullLetter: generateFullLetterPlaceholder(type),
    legalReferences: getLegalReferences(type),
    submissionSteps: getSubmissionSteps(type),
  };
}

/**
 * Placeholder for full letter (will be AI-generated after unlock)
 */
function generateFullLetterPlaceholder(type: string): string {
  return `[FULL DISPUTE LETTER - LOCKED]

This is a complete, professionally formatted dispute letter tailored to your specific case. It includes:

- Formal salutation and reference details
- Clear statement of the dispute
- Detailed explanation of your position
- Supporting evidence references
- Legal basis for your challenge
- Requested outcome and next steps
- Professional closing

Unlock to access the full letter ready for submission.`;
}

/**
 * Get relevant legal references based on dispute type
 */
function getLegalReferences(type: string): string[] {
  const references: Record<string, string[]> = {
    speeding_ticket: [
      "Road Traffic Regulation Act 1984",
      "Road Traffic Offenders Act 1988",
      "ACPO Speed Enforcement Policy Guidelines",
    ],
    parking_fine: [
      "Traffic Management Act 2004",
      "Civil Enforcement of Parking Contraventions Regulations",
      "British Parking Association Code of Practice",
    ],
    landlord: [
      "Landlord and Tenant Act 1985",
      "Housing Act 2004",
      "Homes (Fitness for Human Habitation) Act 2018",
    ],
    benefits: [
      "Social Security Administration Act 1992",
      "Welfare Reform Act 2012",
      "Universal Credit Regulations 2013",
    ],
    immigration: [
      "Immigration Act 1971",
      "Immigration Rules",
      "Human Rights Act 1998",
    ],
    default: [
      "Relevant statutory provisions",
      "Case law precedents",
      "Industry codes of practice",
    ],
  };

  return references[type] || references.default;
}

/**
 * Get submission steps based on dispute type
 */
function getSubmissionSteps(type: string): string[] {
  return [
    "Review the complete dispute letter for accuracy",
    "Gather all supporting evidence documents",
    "Submit via the official appeals process",
    "Keep copies of all correspondence",
    "Follow up within the specified timeframe",
  ];
}

/**
 * Fallback preview if AI fails (basic analysis)
 */
function generateFallbackPreview(
  type: string,
  description: string,
  evidenceCount: number
): AIPreview {
  // Determine strength based on basic heuristics
  let strength: "weak" | "moderate" | "strong" = "moderate";
  if (description.length > 500 && evidenceCount >= 2) {
    strength = "strong";
  } else if (description.length < 200 && evidenceCount === 0) {
    strength = "weak";
  }

  return {
    summary:
      "Based on the information provided, your dispute has merit and warrants formal challenge. A detailed analysis will help strengthen your case with specific legal arguments and supporting evidence.",
    keyPoints: [
      "Clear documentation of the disputed matter",
      "Timeline of events established",
      "Evidence supports your position",
      "Procedural requirements should be reviewed",
      "Mitigating factors present in your case",
    ],
    strength,
    fullLetterPreview: `Dear Sir/Madam,

I am writing to formally dispute the matter described in my submission.

I believe this decision was made in error for the following reasons:

[BLURRED CONTENT - LOCKED]`,
    lockedContent: generateLockedContent(type, description),
  };
}

/**
 * Generate full AI analysis (after unlock)
 * This generates the complete dispute letter and supporting materials
 */
export async function generateFullAnalysis(
  type: DisputeType,
  description: string,
  evidenceFiles: any[] = [],
  preview: AIPreview,
  userName?: string
): Promise<FullAnalysis> {
  try {
    // Route to appropriate provider
    const aiResponse = await generateFullWithProvider(
      type,
      description,
      evidenceFiles,
      preview,
      userName
    );

    return {
      fullLetter: aiResponse.fullLetter,
      legalGrounds: aiResponse.legalGrounds,
      legalReferences: aiResponse.legalReferences.slice(0, 5), // Max 5
      nextSteps: aiResponse.nextSteps,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Full analysis generation error:", error);
    // Fallback to template-based generation
    return generateFallbackFullAnalysis(type, description, preview);
  }
}

/**
 * Provider-agnostic full analysis generation router
 */
async function generateFullWithProvider(
  type: string,
  description: string,
  evidenceFiles: any[],
  preview: AIPreview,
  userName?: string
): Promise<{
  fullLetter: string;
  legalGrounds: string[];
  legalReferences: string[];
  nextSteps: string[];
}> {
  switch (AI_PROVIDER) {
    case "openai":
      return await generateFullWithOpenAI(
        type,
        description,
        evidenceFiles,
        preview,
        userName
      );
    case "anthropic":
      throw new Error("Anthropic provider not yet implemented");
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * OpenAI-specific full analysis implementation
 */
async function generateFullWithOpenAI(
  type: string,
  description: string,
  evidenceFiles: any[],
  preview: AIPreview,
  userName?: string
): Promise<{
  fullLetter: string;
  legalGrounds: string[];
  legalReferences: string[];
  nextSteps: string[];
}> {
  const openai = getOpenAIClient();

  // Format evidence file names
  const evidenceList = evidenceFiles
    .map((file: any, idx: number) => `${idx + 1}. ${file.name || `Evidence ${idx + 1}`}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert dispute letter writer for UK citizens. Generate a complete, professional dispute letter and supporting materials.

CRITICAL REQUIREMENTS:

1. FULL DISPUTE LETTER (800-1500 words):

FORMATTING (MANDATORY - CRITICAL):
   - Start with sender details on separate lines:
     [Sender Name]
     [Address Line 1]
     [City, Postcode]
     [Email]
     [Phone]
     
     (blank line)
     
     [Date]
     
     (blank line)
     
     [Recipient Organization]
     [Address Line 1]
     [City, Postcode]
     
     (blank line)
     
     Dear Sir/Madam,
     
   - Use TWO newlines (\n\n) between all paragraphs
   - Use TWO newlines between all sections
   - NO asterisks (*) or markdown formatting
   - NO bullet points - use paragraph-separated prose only
   - Convert any numbered lists into flowing paragraphs with proper spacing
   - Each section should be clearly separated with blank lines

STRUCTURE (Each section separated by blank lines):
   
   a) SENDER DETAILS (each on new line):
      [Sender Name]
      [Address Line 1]
      [City, Postcode]
      [Email]
      [Phone]
   
   b) BLANK LINE
   
   c) DATE: [Date]
   
   d) BLANK LINE
   
   e) RECIPIENT DETAILS (each on new line):
      [Recipient Organization]
      [Address Line 1]
      [City, Postcode]
   
   f) BLANK LINE
   
   g) SALUTATION: Dear Sir/Madam,
   
   h) BLANK LINE
   
   i) CONFIDENCE FRAMING: One sentence establishing strength
   
   j) BLANK LINE
   
   k) OPENING POSITION: Clear statement paragraph
   
   l) BLANK LINE
   
   m) FACTS: Chronological timeline - write as separate paragraphs with blank lines between each
   
   n) BLANK LINE
   
   o) GROUNDS FOR DISPUTE: Write as flowing paragraphs with blank lines between each ground. NO numbered lists.
   
   p) BLANK LINE
   
   q) SUPPORTING EVIDENCE: Reference evidence files in paragraph form
   
   r) BLANK LINE
   
   s) FORMAL REQUEST: Clear statement of desired outcome
   
   t) BLANK LINE
   
   u) PROFESSIONAL CLOSE:
      Yours faithfully,
      
      [Sender Name]

TONE:
   - Calm, confident, professional
   - Assertive but not aggressive
   - Specific and factual
   - No legal jargon
   - No hedging language

IMPORTANT: 
   - Do NOT reuse preview wording verbatim. Expand and elaborate naturally.
   - Do NOT use asterisks, bullets, or markdown
   - Write GROUNDS as paragraphs, not numbered lists

2. LEGAL GROUNDS (3-5 items):
   - Expand on the key points from the preview
   - Each ground should be a clear, actionable argument
   - Reference specific UK laws or regulations where applicable
   - Plain English explanations

3. LEGAL REFERENCES (3-5 items):
   - Relevant UK laws, regulations, or codes
   - Plain English names (not just act numbers)
   - Brief one-line explanation of relevance
   - Authoritative but concise

4. NEXT STEPS (5-7 items):
   - Clear, actionable steps
   - Chronological order
   - Specific deadlines where applicable
   - What to do, how to do it

Respond in JSON format:
{
  "fullLetter": "Complete professional dispute letter (800-1500 words)",
  "legalGrounds": ["Ground 1", "Ground 2", "Ground 3", "Ground 4", "Ground 5"],
  "legalReferences": ["Reference 1 - explanation", "Reference 2 - explanation", ...],
  "nextSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6", "Step 7"]
}`,
      },
      {
        role: "user",
        content: `Dispute Type: ${type}
User Name: ${userName || "The Claimant"}

Original Description:
${description}

Evidence Files Provided:
${evidenceList || "No evidence files attached"}

Preview Analysis (for context - DO NOT copy verbatim):
Summary: ${preview.summary}
Key Points: ${preview.keyPoints.join("; ")}
Strength: ${preview.strength}

Generate the complete dispute letter and supporting materials.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 2500, // Allow for longer letter
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);

  // Post-process to ensure quality and formatting
  return {
    fullLetter: cleanLetterFormatting(parsed.fullLetter || ""),
    legalGrounds: (parsed.legalGrounds || [])
      .map((g: string) => cleanText(g))
      .filter(Boolean)
      .slice(0, 5),
    legalReferences: (parsed.legalReferences || [])
      .map((r: string) => cleanText(r))
      .filter(Boolean)
      .slice(0, 5),
    nextSteps: (parsed.nextSteps || [])
      .map((s: string) => cleanText(s))
      .filter(Boolean)
      .slice(0, 7),
  };
}

/**
 * Clean letter formatting - remove markdown artifacts, preserve proper spacing
 */
function cleanLetterFormatting(letter: string): string {
  if (!letter) return "";
  
  return letter
    // Remove all asterisks (markdown bold/italic)
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    // Remove markdown headers but keep the text
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bullet points at start of lines
    .replace(/^[\-\*]\s+/gm, "")
    // Remove numbered list markers at start of lines
    .replace(/^\d+\.\s+/gm, "")
    // Clean up any remaining markdown artifacts
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove markdown links
    .replace(/`([^`]+)`/g, "$1") // Remove code formatting
    // Normalize line breaks - preserve double newlines for paragraphs
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Max 2 newlines (paragraph break)
    // Clean up spaces within lines only (preserve newlines)
    .replace(/ +/g, " ") // Multiple spaces to single space
    .replace(/ \n/g, "\n") // Remove trailing spaces before newlines
    .replace(/\n /g, "\n") // Remove leading spaces after newlines
    .trim();
}

/**
 * Fallback full analysis if AI fails
 */
function generateFallbackFullAnalysis(
  type: string,
  description: string,
  preview: AIPreview
): FullAnalysis {
  const userName = "The Claimant";

  return {
    fullLetter: `Dear Sir/Madam,

I am writing to formally dispute the decision referenced above. This letter sets out the grounds for my challenge and the evidence supporting my position.

${preview.summary}

FACTS

${description}

GROUNDS FOR DISPUTE

${preview.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n\n")}

SUPPORTING EVIDENCE

I have attached evidence files that support my position and demonstrate the grounds outlined above.

FORMAL REQUEST

I respectfully request that you review this matter and cancel/withdraw the decision in question. I believe the evidence clearly demonstrates that this decision was made in error.

I look forward to your response within the statutory timeframe.

Yours faithfully,
${userName}`,
    legalGrounds: preview.keyPoints.slice(0, 5),
    legalReferences: getLegalReferences(type),
    nextSteps: getSubmissionSteps(type),
    generatedAt: new Date().toISOString(),
  };
}
