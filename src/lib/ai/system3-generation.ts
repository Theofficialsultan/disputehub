/**
 * SYSTEM 3: FORM-SPECIFIC DOCUMENT GENERATION
 * 
 * This is the specialized AI system that generates official UK legal documents.
 * It receives a routing decision from System 2 and produces form-specific content
 * using the most appropriate AI model for each document type.
 * 
 * ARCHITECTURE:
 * - System 1 (prompts.ts) → Conversation & fact gathering (OpenAI GPT-4o)
 * - System 2 (routing-engine.ts) → Jurisdiction & routing (Claude Opus 4)
 * - System 3 (THIS FILE) → Form-specific generation (Multi-model)
 */

import { openai } from "./openai";
import { generateWithGrok, isGrokAvailable } from "./grok-client";
import type { CaseStrategy, EvidenceItem } from "@prisma/client";
import type { OfficialFormID } from "@/lib/legal/form-registry";
import type { RoutingDecision } from "@/lib/legal/routing-types";
import { FORM_TEMPLATES, type FormTemplateContext, type UserProfile } from "./form-templates-full";
import { LEGAL_ACCURACY_RULES, determineEmploymentStatus, getUnpaidMoneyTerminology } from "./legal-accuracy-rules";
import { isFormFillablePDF, isFormGenerated } from "@/lib/legal/form-types";
import { loadOfficialForm, getFormInstructions, canAutoFillForm } from "@/lib/forms/smart-form-loader";
import { fillOfficialPdfForm } from "@/lib/pdf/pdf-form-filler";
import { getFormMetadata } from "@/lib/legal/official-forms-registry";
import { 
  lockFactsFromStrategy, 
  validateAgainstLockedFacts, 
  extractConcessions,
  detectOverclaiming,
  generateFactLockInstructions
} from "./fact-lock";
import { 
  shouldGenerateDocument, 
  getFormOutputType,
  generateFilingInstructions,
} from "@/lib/legal/form-attachment-rules";
import {
  extractCaseDataSmart,
  generateEvidenceBundleFromRecords,
  generateFilingPackCoverSheet,
  calculateStatutoryInterest,
  calculateLBADeadline,
  calculateCourtFee,
} from "./document-quality-helpers";
import { generateParticularsOfClaimStrict } from "./particulars-of-claim-strict";
import { 
  preGenerationCheck, 
  validateDocumentStructure, 
  generateStructureInstructions,
  DOCUMENT_STRUCTURES 
} from "@/lib/legal/document-structures";
import {
  getCasesForDisputeType,
  getStatutesForDisputeType,
  formatCitation,
  buildLegalBasisWithCitations,
} from "@/lib/legal/uk-case-law";

// ============================================================================
// AI MODEL CLIENTS
// ============================================================================

// Server-side only Anthropic import
let Anthropic: any = null;
if (typeof window === 'undefined') {
  Anthropic = require("@anthropic-ai/sdk").default;
}

// Lazy instantiation of Anthropic client
let anthropicClient: any = null;

function getAnthropicClient() {
  if (!anthropicClient && Anthropic) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }
  return anthropicClient;
}

// TODO: Add xAI Grok client when needed for immigration
// const grok = new GrokClient({ apiKey: process.env.XAI_API_KEY });

// ============================================================================
// MODEL SELECTION LOGIC
// ============================================================================

type AIModel = "gpt-4o" | "claude-opus-4" | "claude-sonnet-4" | "grok-2";

interface ModelConfig {
  model: AIModel;
  temperature: number;
  maxTokens: number;
}

function selectModelForForm(formId: OfficialFormID): ModelConfig {
  // Employment Tribunal - Use Claude Sonnet (best for structured legal forms)
  if (formId.startsWith("UK-ET")) {
    return {
      model: "claude-sonnet-4",
      temperature: 0.3,
      maxTokens: 4000,
    };
  }
  
  // Immigration - Use Grok-2 (when available)
  if (formId.startsWith("UK-IAFT") || formId.startsWith("UK-HO-ADMIN")) {
    return {
      model: "grok-2", // Placeholder - will use Claude Sonnet for now
      temperature: 0.3,
      maxTokens: 4000,
    };
  }
  
  // County Court / Complex Legal Documents - Use Claude Opus 4
  if (formId.startsWith("UK-N1") || formId.startsWith("UK-N244")) {
    return {
      model: "claude-opus-4",
      temperature: 0.3,
      maxTokens: 5000,
    };
  }
  
  // Benefits, Tax, Property Tribunals - Use Claude Sonnet
  if (
    formId.startsWith("UK-SSCS") ||
    formId.startsWith("UK-FTT") ||
    formId.startsWith("UK-POPLA")
  ) {
    return {
      model: "claude-sonnet-4",
      temperature: 0.3,
      maxTokens: 4000,
    };
  }
  
  // Letters, Complaints, General Documents - Use GPT-4o (fast and good for letters)
  if (
    formId.includes("LETTER") ||
    formId.includes("COMPLAINT") ||
    formId.includes("DEMAND") ||
    formId.includes("GRIEVANCE")
  ) {
    return {
      model: "gpt-4o",
      temperature: 0.5,
      maxTokens: 3000,
    };
  }
  
  // Supporting Documents (Evidence, Schedules, etc.) - Use GPT-4o
  if (
    formId.includes("EVIDENCE") ||
    formId.includes("SCHEDULE") ||
    formId.includes("CHRONOLOGY") ||
    formId.includes("WITNESS")
  ) {
    return {
      model: "gpt-4o",
      temperature: 0.4,
      maxTokens: 4000,
    };
  }
  
  // Default: GPT-4o
  return {
    model: "gpt-4o",
    temperature: 0.5,
    maxTokens: 3000,
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generateFormSpecificDocument(
  formId: OfficialFormID,
  routingDecision: RoutingDecision,
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string,
  userDetails?: UserProfile
): Promise<string | { type: "PDF"; data: Uint8Array; filename: string }> {
  
  console.log(`[System 3] 📄 Generating ${formId}...`);
  
  // ============================================================================
  // STEP 0: FACT LOCKING - PREVENT AI HALLUCINATION
  // ============================================================================
  
  console.log(`[System 3] 🔒 Locking facts to prevent AI modification...`);
  
  // Lock all user-confirmed facts as IMMUTABLE
  const lockedFacts = lockFactsFromStrategy(strategy);
  const concessions = extractConcessions(
    Array.isArray(strategy.keyFacts) 
      ? strategy.keyFacts as string[]
      : typeof strategy.keyFacts === 'string'
      ? JSON.parse(strategy.keyFacts)
      : []
  );
  
  console.log(`[System 3] ✅ Locked ${lockedFacts.length} facts`);
  if (concessions.length > 0) {
    console.log(`[System 3] ⚠️  User concessions detected: ${concessions.length}`);
    concessions.forEach(c => console.log(`[System 3]    - ${c}`));
  }
  
  // ============================================================================
  // STEP 1: Check if this should be GENERATED or INSTRUCTIONS ONLY
  // (Check this BEFORE pre-generation check to avoid blocking online-only forms)
  // ============================================================================
  
  const outputType = getFormOutputType(formId);
  
  // ============================================================================
  // STEP 0.5: PRE-GENERATION CONSTITUTIONAL CHECK
  // (Skip for online-only forms that just return instructions)
  // ============================================================================
  
  if (outputType.shouldGenerate) {
    console.log(`[System 3] 📜 Running pre-generation constitutional check for ${formId}...`);
    
    const factsAvailable = Array.isArray(strategy.keyFacts) 
      ? strategy.keyFacts as string[]
      : typeof strategy.keyFacts === 'string'
      ? JSON.parse(strategy.keyFacts)
      : [];
    
    const preCheck = preGenerationCheck(
      formId,
      routingDecision.forum as any,
      factsAvailable,
      lockedFacts
    );
    
    if (!preCheck.canGenerate) {
      console.error(`[System 3] ❌ PRE-GENERATION CHECK FAILED - DOCUMENT BLOCKED`);
      preCheck.blockers.forEach(b => console.error(`[System 3]    🚫 ${b}`));
      throw new Error(`Cannot generate ${formId}: ${preCheck.blockers.join("; ")}`);
    }
    
    if (preCheck.warnings.length > 0) {
      console.warn(`[System 3] ⚠️  Pre-generation warnings:`);
      preCheck.warnings.forEach(w => console.warn(`[System 3]    ⚡ ${w}`));
    }
    
    console.log(`[System 3] ✅ Pre-generation check passed`);
  } else {
    console.log(`[System 3] 📋 Skipping pre-generation check for online-only form ${formId}`);
  }
  
  if (!outputType.shouldGenerate) {
    console.log(`[System 3] 📋 ${formId} is ONLINE-ONLY - providing instructions`);
    
    // Generate filing instructions instead of attempting to create the form
    const instructions = generateFilingInstructions(formId);
    const attachments = outputType.requiredAttachments;
    
    return `
═══════════════════════════════════════════════════════════════════════════
${formId.toUpperCase()} - FILING INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════

⚠️  IMPORTANT: This form CANNOT be generated by DisputeHub.

${instructions}

${attachments.length > 0 ? `
───────────────────────────────────────────────────────────────────────────
REQUIRED ATTACHMENTS
───────────────────────────────────────────────────────────────────────────

DisputeHub will generate the following attachments for you:

${attachments.map((att, i) => `${i + 1}. ${att.replace(/_/g, ' ')}`).join('\n')}

These will be generated automatically - you just need to complete the ${formId} 
form itself online or via the official portal.
` : ''}

═══════════════════════════════════════════════════════════════════════════
    `.trim();
  }
  
  // ============================================================================
  // STEP 2: Check if this is a FILLABLE PDF or GENERATED DOCUMENT
  // ============================================================================
  
  if (isFormFillablePDF(formId)) {
    console.log(`[System 3] 📋 ${formId} is an OFFICIAL FILLABLE PDF FORM`);
    
    // Check if we can auto-fill this form
    if (canAutoFillForm(formId)) {
      console.log(`[System 3] ✨ Attempting to auto-fill ${formId}...`);
      
      try {
        // Try to load and fill the PDF
        const result = await loadOfficialForm(formId);
        
        if (result.success && result.data) {
          console.log(`[System 3] 📥 Form loaded successfully, filling fields...`);
          
          // Fill the PDF with case data
          const filledPdf = await fillOfficialPdfForm(
            formId,
            strategy,
            routingDecision,
            evidence,
            userDetails
          );
          
          console.log(`[System 3] ✅ PDF filled successfully (${filledPdf.length.toLocaleString()} bytes)`);
          
          // Return the filled PDF
          return {
            type: "PDF",
            data: filledPdf,
            filename: `${formId}-filled-${Date.now()}.pdf`
          };
        } else {
          // Form loader returned error (GOVUK_REDIRECT, ONLINE_ONLY, etc.)
          console.log(`[System 3] ⚠️  Cannot auto-fill: ${result.errorType}`);
          console.log(`[System 3] 📝 Generating guidance document with fallback URL`);
          
          return generateFormGuidanceWithFallback(
            formId,
            result.errorType!,
            result.fallbackUrl!,
            routingDecision,
            strategy,
            evidence,
            caseTitle
          );
        }
      } catch (error) {
        console.error(`[System 3] ❌ PDF filling failed:`, error);
        console.log(`[System 3] 📝 Falling back to guidance document`);
        
        // Graceful fallback - generate guidance document
        const instructions = getFormInstructions(formId);
        return generateFormGuidanceWithFallback(
          formId,
          "DOWNLOAD_FAILED",
          instructions.url,
          routingDecision,
          strategy,
          evidence,
          caseTitle
        );
      }
    } else {
      // Form requires GOV.UK redirect or online portal
      console.log(`[System 3] 🌐 ${formId} requires external completion`);
      const instructions = getFormInstructions(formId);
      
      return generateFormGuidanceWithFallback(
        formId,
        instructions.action === "VISIT_GOVUK" ? "GOVUK_REDIRECT" : "ONLINE_ONLY",
        instructions.url,
        routingDecision,
        strategy,
        evidence,
        caseTitle
      );
    }
  }
  
  // ============================================================================
  // STEP 2: This is a GENERATED document (AI writes from scratch)
  // ============================================================================
  
  console.log(`[System 3] ✍️  ${formId} is a GENERATED DOCUMENT (AI will write from scratch)`);
  
  // ============================================================================
  // SPECIAL CASE: PARTICULARS OF CLAIM - Use strict fact-locked generator
  // ============================================================================
  
  if (formId.includes("PARTICULARS")) {
    console.log(`[System 3] ⚖️  Attempting STRICT fact-locked generator for Particulars of Claim`);
    
    try {
      const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const particulars = generateParticularsOfClaimStrict({
        caseTitle,
        strategy,
        evidence,
        routingDecision,
        today
      });
      
      // Validate against locked facts
      const validation = validateAgainstLockedFacts(particulars, lockedFacts);
      
      if (!validation.locked) {
        console.error(`[System 3] ❌ FACT VIOLATIONS DETECTED:`);
        validation.violations.forEach(v => console.error(`[System 3]    - ${v}`));
        throw new Error(`Fact-locking violations: ${validation.violations.join("; ")}`);
      }
      
      // Check for overclaiming
      const keyFacts = Array.isArray(strategy.keyFacts) 
        ? strategy.keyFacts as string[]
        : typeof strategy.keyFacts === 'string'
        ? JSON.parse(strategy.keyFacts)
        : [];
      
      const overclaimWarnings = detectOverclaiming(particulars, keyFacts, concessions);
      
      if (overclaimWarnings.length > 0) {
        console.error(`[System 3] ❌ OVERCLAIMING DETECTED:`);
        overclaimWarnings.forEach(w => console.error(`[System 3]    - ${w}`));
        throw new Error(`Overclaiming detected: ${overclaimWarnings.join("; ")}`);
      }
      
      console.log(`[System 3] ✅ Particulars generated with fact-locking (${particulars.length} chars)`);
      console.log(`[System 3] ✅ No fact violations detected`);
      console.log(`[System 3] ✅ No overclaiming detected`);
      
      return cleanDocumentContent(particulars);
      
    } catch (error: any) {
      console.error(`[System 3] ⚠️  Strict generation failed:`, error.message);
      console.log(`[System 3] 🔄 Falling back to AI generation with fact-locking...`);
      // Fall through to standard AI generation with fact-locking
    }
  }
  
  // ============================================================================
  // STANDARD AI GENERATION (for other document types)
  // ============================================================================
  
  // Select the best AI model for this form
  const modelConfig = selectModelForForm(formId);
  console.log(`[System 3] 🤖 Selected model: ${modelConfig.model} (temp: ${modelConfig.temperature})`);
  
  // Build form-specific prompt WITH fact-locking instructions
  const factLockInstructions = generateFactLockInstructions(lockedFacts);
  const prompt = buildFormSpecificPrompt(
    formId,
    routingDecision,
    strategy,
    evidence,
    caseTitle,
    factLockInstructions,  // Pass locked facts to AI
    userDetails  // Pass user details for document personalization
  );
  
  // Generate using the selected AI
  let content: string;
  
  try {
    if (modelConfig.model.startsWith("claude")) {
      content = await generateWithClaude(prompt, modelConfig);
    } else if (modelConfig.model === "grok-2") {
      // Use Grok if available, otherwise fallback to Claude
      if (isGrokAvailable()) {
        console.log(`[System 3] 🤖 Using Grok-2 for immigration document`);
        content = await generateWithGrok(prompt, { 
          model: "grok-2",
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens
        });
      } else {
        console.warn(`[System 3] ⚠️  Grok API key not configured, using Claude Sonnet fallback`);
        content = await generateWithClaude(prompt, { ...modelConfig, model: "claude-sonnet-4" });
      }
    } else {
      content = await generateWithOpenAI(prompt, modelConfig);
    }
    
    console.log(`[System 3] ✅ Generated ${content.length.toLocaleString()} characters for ${formId}`);
    
    // ============================================================================
    // POST-GENERATION VALIDATION - Check for fact violations
    // ============================================================================
    
    console.log(`[System 3] 🔍 Validating generated content against locked facts...`);
    
    const validation = validateAgainstLockedFacts(content, lockedFacts);
    
    if (!validation.locked) {
      console.warn(`[System 3] ⚠️  FACT VIOLATIONS DETECTED (${validation.violations.length}):`);
      validation.violations.forEach(v => console.warn(`[System 3]    - ${v}`));
      
      // For now, log warnings but don't block (can be made stricter later)
      // throw new Error(`Fact violations: ${validation.violations.join("; ")}`);
    } else {
      console.log(`[System 3] ✅ No fact violations detected`);
    }
    
    // Check for overclaiming
    const keyFacts = Array.isArray(strategy.keyFacts) 
      ? strategy.keyFacts as string[]
      : typeof strategy.keyFacts === 'string'
      ? JSON.parse(strategy.keyFacts)
      : [];
    
    const overclaimWarnings = detectOverclaiming(content, keyFacts, concessions);
    
    if (overclaimWarnings.length > 0) {
      console.warn(`[System 3] ⚠️  OVERCLAIMING DETECTED (${overclaimWarnings.length}):`);
      overclaimWarnings.forEach(w => console.warn(`[System 3]    - ${w}`));
      
      // Log but don't block
      // throw new Error(`Overclaiming: ${overclaimWarnings.join("; ")}`);
    } else {
      console.log(`[System 3] ✅ No overclaiming detected`);
    }
    
    // ============================================================================
    // POST-GENERATION: CONSTITUTIONAL STRUCTURE VALIDATION
    // ============================================================================
    
    const structureValidation = validateGeneratedDocument(formId, content);
    
    if (!structureValidation.valid) {
      console.error(`[System 3] ❌ DOCUMENT FAILED CONSTITUTIONAL STRUCTURE VALIDATION`);
      console.error(`[System 3]    Score: ${structureValidation.score}/10`);
      structureValidation.warnings.forEach(w => 
        console.error(`[System 3]    ⚠️  ${w}`)
      );
      
      // Log warning but don't block (for now - this is a soft enforcement)
      // In production, you might want to block documents with score < 7
      if (structureValidation.score < 7) {
        console.warn(`[System 3] 🚨 CRITICAL: Document quality below acceptable threshold`);
      }
    }
    
    return cleanDocumentContent(content);
    
  } catch (error) {
    console.error(`[System 3] ❌ Generation failed for ${formId}:`, error);
    throw error;
  }
}

// ============================================================================
// AI GENERATION FUNCTIONS
// ============================================================================

async function generateWithOpenAI(
  prompt: string,
  config: ModelConfig
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert UK legal document writer. Generate precise, professional legal documents that comply with UK court and tribunal requirements.

CRITICAL: Follow these legal accuracy rules:

${LEGAL_ACCURACY_RULES}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });
  
  const content = completion.choices[0]?.message?.content || "";
  
  if (!content || content.trim().length < 50) {
    console.error(`[System 3] ❌ OpenAI generated insufficient content (${content.length} chars)`);
    console.error(`[System 3] Response:`, content);
    throw new Error(`OpenAI generated insufficient content: ${content.length} characters - Response: ${content.substring(0, 100)}`);
  }
  
  return content;
}

async function generateWithClaude(
  prompt: string,
  config: ModelConfig
): Promise<string> {
  
  const anthropic = getAnthropicClient();
  
  if (!anthropic) {
    throw new Error("Anthropic client not available (server-side only)");
  }
  
  // Map our model names to Anthropic's API model names
  const anthropicModel = config.model === "claude-opus-4" 
    ? "claude-opus-4-20250514"
    : "claude-sonnet-4-20250514";
  
  const message = await anthropic.messages.create({
    model: anthropicModel,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: `You are an expert UK legal document writer specializing in tribunal forms, court documents, and official legal correspondence. You understand UK legal procedure, terminology, and formatting requirements.

CRITICAL: You MUST follow these legal accuracy rules to ensure documents are procedurally correct and legally sound:

${LEGAL_ACCURACY_RULES}

Generate documents that are accurate, professional, court-ready, and compliant with the rules above.`,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  
  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Claude returned non-text content");
  }
  
  if (!content.text || content.text.trim().length < 50) {
    console.error(`[System 3] ❌ Claude generated insufficient content (${content.text?.length || 0} chars)`);
    console.error(`[System 3] Response:`, content.text);
    throw new Error(`Claude generated insufficient content: ${content.text?.length || 0} characters - Response: ${(content.text || "").substring(0, 100)}`);
  }
  
  return content.text;
}

// ============================================================================
// FORM-SPECIFIC PROMPT BUILDER
// ============================================================================

function buildFormSpecificPrompt(
  formId: OfficialFormID,
  routingDecision: RoutingDecision,
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string,
  factLockInstructions?: string,
  userDetails?: UserProfile
): string {
  
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Build context for templates with user profile
  const user: UserProfile = userDetails || {
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    postcode: null,
  };
  
  const ctx: FormTemplateContext = {
    formId,
    routingDecision,
    strategy,
    evidence,
    caseTitle,
    today,
    facts,
    user,
  };
  
  // ============================================================================
  // CONSTITUTIONAL STRUCTURE ENFORCEMENT
  // ============================================================================
  
  console.log(`[System 3] 📜 Loading constitutional structure for ${formId}...`);
  const structureInstructions = generateStructureInstructions(formId);
  
  if (structureInstructions) {
    console.log(`[System 3] ✅ Constitutional structure loaded (${structureInstructions.length} chars)`);
  } else {
    console.warn(`[System 3] ⚠️  No constitutional structure defined for ${formId}`);
  }
  
  // Check if we have a comprehensive template for this form
  if (FORM_TEMPLATES[formId]) {
    console.log(`[System 3] Using comprehensive template for ${formId}`);
    
    // Prepend structural instructions, then fact-locking instructions, then template
    const basePrompt = FORM_TEMPLATES[formId](ctx);
    
    let finalPrompt = basePrompt;
    
    // Add structural instructions first (highest priority)
    if (structureInstructions) {
      finalPrompt = `${structureInstructions}\n\n${finalPrompt}`;
    }
    
    // Add fact-locking instructions
    if (factLockInstructions) {
      finalPrompt = `${factLockInstructions}\n\n${finalPrompt}`;
    }
    
    return finalPrompt;
  }
  
  // Fallback to inline templates for forms not yet in the comprehensive library
  console.log(`[System 3] Using inline template for ${formId}`);
  const baseContext = buildBaseContext(strategy, evidence, caseTitle, routingDecision);
  
  // Inline fallback templates (for forms not yet in comprehensive library)
  const fallbackTemplates: Partial<Record<OfficialFormID, string>> = {
    
    // =======================
    // EMPLOYMENT TRIBUNAL ET1
    // =======================
    "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": `${baseContext}

GENERATE AN EMPLOYMENT TRIBUNAL CLAIM FORM (ET1)

This MUST follow the official ET1 structure used by UK Employment Tribunals.

FORMAT THE DOCUMENT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════
EMPLOYMENT TRIBUNAL CLAIM FORM (ET1)
═══════════════════════════════════════════════════════════════

Date: ${today}

IMPORTANT: This form is based on the official ET1 Employment Tribunal claim form.
Sections marked [User to complete] should be filled in by the claimant.

───────────────────────────────────────────────────────────────
SECTION 1: CLAIMANT DETAILS
───────────────────────────────────────────────────────────────

Title: [Mr/Mrs/Ms/Miss/Mx]
First name(s): _______________________
Surname: _______________________

Date of birth: ___/___/_______

Address:
_______________________
_______________________
_______________________
Postcode: _______________________

Phone: _______________________
Email: _______________________

───────────────────────────────────────────────────────────────
SECTION 2: RESPONDENT (EMPLOYER) DETAILS
───────────────────────────────────────────────────────────────

Name of respondent/employer:
${extractEmployerName(strategy)}

Address:
${extractEmployerAddress(strategy) || "[User to complete]"}

Postcode: _______________________

Type of employer's business:
${extractBusinessType(strategy) || "[User to complete]"}

───────────────────────────────────────────────────────────────
SECTION 3: EMPLOYMENT DETAILS
───────────────────────────────────────────────────────────────

3.1 When did your employment start? ${extractStartDate(strategy) || "[dd/mm/yyyy]"}

3.2 Is your employment continuing? ${extractEmploymentStatus(strategy)}

3.3 When did your employment end? ${extractEndDate(strategy) || "[dd/mm/yyyy or N/A if continuing]"}

3.4 Job title or type of work: ${extractJobTitle(strategy) || "[User to complete]"}

3.5 Pay:
    • Pay before tax: £_______ per [week/month]
    • Normal take-home pay: £_______ per [week/month]
    • Number of normal working hours per week: ${extractWorkingHours(strategy) || "_______"}

───────────────────────────────────────────────────────────────
SECTION 4: TYPE OF CLAIM(S)
───────────────────────────────────────────────────────────────

Please tick the type(s) of claim you are making:

${determineClaimTypes(strategy)}

───────────────────────────────────────────────────────────────
SECTION 5: WHAT HAPPENED - YOUR CLAIM DETAILS
───────────────────────────────────────────────────────────────

Please give the background and details of your claim in this section.

[IMPORTANT: Write a clear, chronological account in first person ("I")]

${generateClaimNarrative(strategy, evidence)}

───────────────────────────────────────────────────────────────
SECTION 6: WHAT YOU WANT THE TRIBUNAL TO ORDER
───────────────────────────────────────────────────────────────

Please state what you want the tribunal to order:

${strategy.desiredOutcome || "[State your desired remedy - e.g., compensation, reinstatement, etc.]"}

If seeking compensation, please state the amount:
£ ${extractCompensationAmount(strategy) || "_______"}

───────────────────────────────────────────────────────────────
SECTION 7: INFORMATION TO REGULATORS (OPTIONAL)
───────────────────────────────────────────────────────────────

Your claim may involve issues that need to be drawn to the attention of a regulator with duties in a particular area (e.g., the Equality and Human Rights Commission). Do you want the tribunal to send a copy of this form to a regulator?

☐ Yes
☐ No

───────────────────────────────────────────────────────────────
DECLARATION
───────────────────────────────────────────────────────────────

I confirm that the information I have given on this form is correct to the best of my knowledge and belief.

I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: _______________________

Print name: _______________________

Date: ${today}

═══════════════════════════════════════════════════════════════
END OF ET1 CLAIM FORM
═══════════════════════════════════════════════════════════════

NOTES FOR CLAIMANT:
• Complete all sections marked [User to complete]
• Attach your ACAS Early Conciliation certificate (reference: [ACAS EC number])
• Include evidence bundle (photos, emails, contracts) - see separate evidence document
• Submit this form to the Employment Tribunal within the time limit
• Keep a copy for your records`,
    
    // =======================
    // LETTER BEFORE ACTION
    // =======================
    "UK-LBA-GENERAL": `${baseContext}

GENERATE A LETTER BEFORE ACTION (LBA)

This is a formal pre-action letter that must comply with UK Pre-Action Protocol requirements.

FORMAT AS A PROPER BUSINESS LETTER:

[SENDER'S NAME - User to complete]
[SENDER'S ADDRESS - User to complete]
[SENDER'S POSTCODE]
[SENDER'S PHONE]
[SENDER'S EMAIL]

${extractRecipientDetails(strategy)}

Date: ${today}

WITHOUT PREJUDICE SAVE AS TO COSTS

Dear Sir/Madam,

RE: LETTER BEFORE ACTION - ${caseTitle.toUpperCase()}

───────────────────────────────────────────────────────────────
NOTICE OF INTENDED LEGAL PROCEEDINGS
───────────────────────────────────────────────────────────────

This letter is sent in accordance with the Pre-Action Protocol for [relevant protocol]. It serves as formal notice that unless this matter is resolved, I intend to commence legal proceedings without further notice.

BACKGROUND:
${generateLetterBackground(strategy)}

THE FACTS:
${generateLetterFacts(strategy)}

EVIDENCE:
${formatEvidenceForLetter(evidence)}

THE LEGAL BASIS OF MY CLAIM:
${generateLegalBasis(strategy, routingDecision)}

WHAT I REQUIRE:
${strategy.desiredOutcome || "[State specific remedy required]"}

DEADLINE FOR RESPONSE:
You must respond to this letter within 14 days from the date above. Your response should:
1. Confirm whether you accept my claim
2. If not, provide full reasons why you dispute it
3. Make a proposal for resolution

CONSEQUENCES OF NON-RESPONSE:
If I do not receive a substantive response within 14 days, I will issue proceedings in the ${routingDecision.selectedForum || "appropriate court"} without further notice. I will seek to recover:

• The full amount claimed: £${extractMonetaryAmount(strategy) || "_______"}
• Interest on the late payment
• Legal costs incurred
• Court fees

This letter has been sent by [email/post] and I require your response by ${calculateDeadline(14)} at the latest.

I remain willing to resolve this matter without court proceedings if you respond appropriately.

Yours faithfully,

_______________________
[YOUR SIGNATURE]
[YOUR NAME]

Enclosures:
• Evidence bundle (${evidence.length} item${evidence.length !== 1 ? "s" : ""})
${evidence.map((e, i) => `• ${i + 1}. ${e.title || e.fileName}`).join("\n")}`,
    
    // =======================
    // EVIDENCE BUNDLE & INDEX
    // =======================
    "UK-EVIDENCE-BUNDLE-INDEX": `${baseContext}

GENERATE AN EVIDENCE BUNDLE & INDEX

This document lists all evidence supporting the case and must be formatted for court/tribunal use.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════
EVIDENCE BUNDLE & INDEX
═══════════════════════════════════════════════════════════════

Case: ${caseTitle}
Date prepared: ${today}
Prepared for: ${routingDecision.selectedForum || "Court/Tribunal"}

───────────────────────────────────────────────────────────────
PART 1: INDEX OF EVIDENCE
───────────────────────────────────────────────────────────────

${evidence.map((e, i) => `
E${i + 1}  ${e.title || e.fileName}
    Type: ${e.fileType?.startsWith("image/") ? "Photograph/Image" : "Document"}
    Date: ${new Date(e.createdAt).toLocaleDateString("en-GB")}
    Description: ${e.description || "Supporting evidence"}
    Pages: [User to complete when printing]
`).join("\n")}

${evidence.length === 0 ? "No evidence items have been uploaded yet.\n\nNote: You should upload relevant evidence (photos, emails, contracts, receipts) to support your case." : ""}

───────────────────────────────────────────────────────────────
PART 2: EVIDENCE DESCRIPTIONS & RELEVANCE
───────────────────────────────────────────────────────────────

${generateEvidenceDescriptions(evidence, strategy)}

───────────────────────────────────────────────────────────────
PART 3: PHOTOGRAPHIC EVIDENCE
───────────────────────────────────────────────────────────────

${generatePhotographicEvidenceSection(evidence, strategy)}

───────────────────────────────────────────────────────────────
DECLARATION
───────────────────────────────────────────────────────────────

I confirm that:
• All evidence in this bundle is true and accurate
• Photographic evidence has not been altered or manipulated
• All documents are genuine copies of originals
• I am prepared to produce originals if required by the court/tribunal

Signed: _______________________  Date: ${today}

Name: _______________________

═══════════════════════════════════════════════════════════════
END OF EVIDENCE BUNDLE
═══════════════════════════════════════════════════════════════`,
    
    // =======================
    // SCHEDULE OF DAMAGES
    // =======================
    "UK-SCHEDULE-OF-DAMAGES": `${baseContext}

GENERATE A SCHEDULE OF DAMAGES

This document calculates the financial losses claimed and must show clear calculations.

FORMAT AS FOLLOWS:

═══════════════════════════════════════════════════════════════
SCHEDULE OF DAMAGES
═══════════════════════════════════════════════════════════════

Case: ${caseTitle}
Claimant: [User to complete]
Date: ${today}

───────────────────────────────────────────────────────────────
SUMMARY OF CLAIM
───────────────────────────────────────────────────────────────

${generateDamagesSummary(strategy)}

───────────────────────────────────────────────────────────────
CALCULATION OF DAMAGES
───────────────────────────────────────────────────────────────

${generateDamagesCalculation(strategy, routingDecision)}

───────────────────────────────────────────────────────────────
BREAKDOWN NOTES & JUSTIFICATION
───────────────────────────────────────────────────────────────

${generateDamagesJustification(strategy, evidence)}

───────────────────────────────────────────────────────────────
SUPPORTING EVIDENCE
───────────────────────────────────────────────────────────────

The amounts claimed are supported by:
${evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName} - ${e.description || "Supporting documentation"}`).join("\n")}

───────────────────────────────────────────────────────────────
DECLARATION
───────────────────────────────────────────────────────────────

I confirm that the amounts claimed in this schedule represent genuine losses suffered as a direct result of the respondent's breach/wrongdoing.

Signed: _______________________  Date: ${today}

═══════════════════════════════════════════════════════════════
END OF SCHEDULE
═══════════════════════════════════════════════════════════════`,
    
    // =======================
    // COUNTY COURT CLAIM (N1) - PARTICULARS OF CLAIM
    // =======================
    "UK-N1-COUNTY-COURT-CLAIM": `${baseContext}

GENERATE PARTICULARS OF CLAIM (ATTACHED TO COUNTY COURT CLAIM FORM N1)

CRITICAL INSTRUCTIONS:

1. This is PARTICULARS OF CLAIM, not the N1 form itself
2. The N1 form (with party details, value, tick boxes) is separate
3. Check employment status CAREFULLY - self-employed ≠ employee
4. Include explicit contract formation elements
5. ALWAYS include quantum meruit fallback
6. Evidence: reference only, no descriptions/metadata
7. Add "or such other rate..." to interest clause

FORMAT AS FOLLOWS:

═══════════════════════════════════════════════════════════════
IN THE COUNTY COURT AT [TO BE COMPLETED BY CLAIMANT]
═══════════════════════════════════════════════════════════════

Claim Number: [To be allocated by court]

BETWEEN:

[CLAIMANT NAME - User to complete]
                                                          Claimant
                        -and-

${extractDefendantName(strategy)}
                                                          Defendant

───────────────────────────────────────────────────────────────
PARTICULARS OF CLAIM
(Attached to Claim Form N1)
───────────────────────────────────────────────────────────────

${generateLegallyAccurateParticulars(strategy, evidence, routingDecision)}

───────────────────────────────────────────────────────────────
AND THE CLAIMANT CLAIMS:
───────────────────────────────────────────────────────────────

(1) Payment of £${extractMonetaryAmount(strategy) || "_______"}

(2) Interest pursuant to section 69 of the County Courts Act 1984 at the rate of 8% per annum from [date due] to the date of judgment, or such other rate and period as the court thinks fit

${generateCostsClause(strategy)}

(4) Such further or other relief as the court thinks fit

───────────────────────────────────────────────────────────────
STATEMENT OF TRUTH
───────────────────────────────────────────────────────────────

I believe that the facts stated in these Particulars of Claim are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: _______________________

Full name: _______________________

Date: ${today}

Position or office held: [Claimant]

═══════════════════════════════════════════════════════════════
END OF PARTICULARS OF CLAIM
═══════════════════════════════════════════════════════════════

IMPORTANT NOTES FOR CLAIMANT:

1. This document should be attached to Form N1 (County Court Claim Form)
2. The N1 form itself requires:
   • Your full name and address
   • Defendant's full name and address
   • Brief details of claim (2-3 sentences)
   • Value of claim: £${extractMonetaryAmount(strategy) || "_______"}
   • Preferred court location
   
3. Evidence bundle should be prepared separately with exhibit index
4. Do not embed evidence descriptions in this document
5. Court fee payable based on claim value
6. Serve defendant within 4 months of issue`,
    
  };
  
  // Return the form-specific fallback template or a default
  const template = fallbackTemplates[formId];
  
  if (template) {
    return template;
  }
  
  // Default template for unknown forms
  return `${baseContext}

GENERATE A ${formId} DOCUMENT

This document must be professional, legally sound, and formatted appropriately for UK legal proceedings.

Use the case information above to generate a complete, court-ready document.
Include all relevant sections, proper formatting, and clear structure.
Write in first person if it's a claim/complaint, third person if it's a supporting document.

Be thorough and include:
- Clear headings and sections
- All relevant facts from the case
- References to evidence
- Proper legal language
- Declaration/signature section
- Date: ${today}`;
}

// ============================================================================
// HELPER FUNCTIONS FOR PROMPT BUILDING
// ============================================================================

function buildBaseContext(
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string,
  routingDecision: RoutingDecision
): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Use smart extraction to get all available data
  const caseData = extractCaseDataSmart(strategy, evidence);
  const lbaDeadline = calculateLBADeadline();
  const courtFee = calculateCourtFee(caseData.claimAmount);
  
  // Generate evidence bundle if evidence exists
  const evidenceBundle = generateEvidenceBundleFromRecords(evidence, (strategy as any).disputeType || '');
  
  return `
═══════════════════════════════════════════════════════════════
CASE INFORMATION (USE THIS DATA - DO NOT USE PLACEHOLDERS)
═══════════════════════════════════════════════════════════════

Case Title: ${caseTitle}
Dispute Type: ${(strategy as any).disputeType || "Not specified"}
Jurisdiction: ${routingDecision.jurisdiction || "UK (England & Wales)"}
Forum: ${routingDecision.selectedForum || routingDecision.forum || "Not yet determined"}
Legal Relationship: ${caseData.legalRelationship || routingDecision.classification?.relationship || "Unknown"}

───────────────────────────────────────────────────────────────
PARTY DETAILS (FILL IN DOCUMENTS WITH THESE)
───────────────────────────────────────────────────────────────

CLAIMANT:
Name: ${caseData.claimantName || "[Claimant name required]"}
Address: ${caseData.claimantAddress || "[Claimant address required]"}
Email: ${caseData.claimantEmail || ""}
Phone: ${caseData.claimantPhone || ""}

DEFENDANT:
Name: ${caseData.defendantName || "[Defendant name required]"}
Address: ${caseData.defendantAddress || "[Defendant address required]"}

───────────────────────────────────────────────────────────────
FINANCIAL DETAILS
───────────────────────────────────────────────────────────────

Claim Amount: ${caseData.claimAmountFormatted || "[Amount required]"}
Court Fee: £${courtFee.toFixed(2)}
Suggested Court: ${caseData.suggestedCourt}

${caseData.hourlyRate && caseData.hoursWorked ? `
Calculation: ${caseData.hoursWorked} hours × £${caseData.hourlyRate}/hour = £${(caseData.hoursWorked * caseData.hourlyRate).toFixed(2)}
` : ''}

───────────────────────────────────────────────────────────────
IMPORTANT DATES
───────────────────────────────────────────────────────────────

Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
Incident Date: ${caseData.incidentDateFormatted || "[Date required]"}
LBA Response Deadline: ${lbaDeadline.formatted} (14 days from today)
${caseData.courtDeadlineDate ? `Limitation Deadline: ${caseData.courtDeadlineDate}` : ''}

───────────────────────────────────────────────────────────────
KEY FACTS
───────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

DESIRED OUTCOME:
${strategy.desiredOutcome || `Recovery of ${caseData.claimAmountFormatted} from ${caseData.defendantName}`}

───────────────────────────────────────────────────────────────
EVIDENCE (${evidence.length} items)
───────────────────────────────────────────────────────────────

${evidenceBundle.items.length > 0 
  ? evidenceBundle.items.map(e => `${e.exhibitNumber}: ${e.title} (${e.category}) - ${e.relevance}`).join("\n")
  : "No evidence uploaded yet"}

───────────────────────────────────────────────────────────────
DATA COMPLETENESS: ${caseData.dataCompleteness}%
${caseData.missingFields.length > 0 ? `Missing: ${caseData.missingFields.join(', ')}` : 'All key fields populated'}

───────────────────────────────────────────────────────────────
LEGAL AUTHORITIES - USE THESE IN DOCUMENTS
───────────────────────────────────────────────────────────────

${(() => {
  const disputeType = (strategy as any).disputeType || '';
  const relevantCases = getCasesForDisputeType(disputeType);
  const relevantStatutes = getStatutesForDisputeType(disputeType);
  
  let authorities = '';
  
  // Add statutes
  if (relevantStatutes.length > 0) {
    authorities += 'STATUTORY BASIS:\n';
    for (const { statute, sections } of relevantStatutes.slice(0, 3)) {
      authorities += `• ${statute.fullName} ${statute.year} (${statute.shortName})\n`;
      for (const section of sections.slice(0, 4)) {
        authorities += `  - ${section.section}: ${section.description}\n`;
      }
    }
    authorities += '\n';
  }
  
  // Add case citations
  if (relevantCases.length > 0) {
    authorities += 'RELEVANT CASE LAW (cite these where applicable):\n';
    for (const c of relevantCases.slice(0, 4)) {
      authorities += `• ${c.name} ${c.citation}\n`;
      authorities += `  Principle: ${c.principle}\n`;
      authorities += `  Holding: "${c.holding}"\n\n`;
    }
  }
  
  return authorities || 'No specific legal authorities identified for this dispute type.\n';
})()}
───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS FOR AI:
- USE the actual data above, NOT placeholders like "[User to complete]"
- If data is missing, use the closest available data
- Calculate actual dates (today + 14 days for LBA deadline)
- Include actual court fees based on claim value
- Reference evidence by exhibit number (E1, E2, etc.)
═══════════════════════════════════════════════════════════════
BEGIN DOCUMENT GENERATION BELOW:
═══════════════════════════════════════════════════════════════
`;
}

function extractEmployerName(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Check for enriched "The other party is:" format first (from caseSummary)
  const otherPartyFact = facts.find(f => f.toLowerCase().startsWith("the other party is:"));
  if (otherPartyFact) {
    const name = otherPartyFact.replace(/^the other party is:\s*/i, "").trim();
    if (name && name !== "null" && name !== "undefined") {
      return formatDefendantName(name, facts);
    }
  }
  
  // Check for counterpartyName in strategy object (if passed through)
  if ((strategy as any).counterpartyName) {
    return formatDefendantName((strategy as any).counterpartyName, facts);
  }
  
  // Legacy: Look for employer/company mentions in facts
  const employerFact = facts.find(f => 
    f.toLowerCase().includes("employer") ||
    f.toLowerCase().includes("company") ||
    f.toLowerCase().includes("owns") ||
    f.toLowerCase().includes("landlord") ||
    f.toLowerCase().includes("24tm") ||
    f.toLowerCase().includes("marvin")
  );
  
  if (employerFact) {
    // Try to extract company/person name
    const match = employerFact.match(/(?:company|employer|owns|landlord)\s+(?:is\s+)?(?:called\s+)?([A-Za-z0-9\s&]+)/i);
    if (match) return formatDefendantName(match[1].trim(), facts);
    
    // Check for specific company names
    if (employerFact.includes("24TM")) return formatDefendantName("24TM", facts);
  }
  
  return "[Defendant name - User to complete]";
}

/**
 * Format defendant name correctly based on entity type
 * 
 * RULES:
 * - If Ltd/Limited company: "COMPANY NAME LTD" (not "Person (t/a Company)")
 * - If sole trader: "FULL NAME trading as BUSINESS NAME" or just "FULL NAME"
 * - Never mix: "Name (t/a Name LTD)" is WRONG
 */
function formatDefendantName(rawName: string, facts: string[]): string {
  const factsText = facts.join(" ").toLowerCase();
  const nameLower = rawName.toLowerCase();
  
  // Detect if it's a limited company
  const isLtd = nameLower.includes("ltd") || 
                nameLower.includes("limited") ||
                nameLower.includes("plc") ||
                factsText.includes("limited company") ||
                factsText.includes(" ltd");
  
  // Clean up the name
  let cleanName = rawName.trim();
  
  if (isLtd) {
    // It's a company - format as company name only
    // Remove any "t/a" or "trading as" - company is the defendant
    cleanName = cleanName.replace(/\s*\(t\/a[^)]*\)/gi, "");
    cleanName = cleanName.replace(/\s*trading as.*/gi, "");
    
    // Ensure LTD/LIMITED is uppercase and present
    if (!cleanName.toUpperCase().includes("LTD") && !cleanName.toUpperCase().includes("LIMITED")) {
      cleanName = cleanName + " LTD";
    }
    
    return cleanName.toUpperCase();
  }
  
  // It's a sole trader or individual
  // Check if there's a trading name
  const tradingMatch = rawName.match(/(.+?)\s*(?:\(t\/a|trading as)\s*(.+)/i);
  if (tradingMatch) {
    const personName = tradingMatch[1].trim().toUpperCase();
    const businessName = tradingMatch[2].replace(/[()]/g, "").trim().toUpperCase();
    return `${personName} trading as ${businessName}`;
  }
  
  // Check facts for trading name
  const tradingFact = facts.find(f => 
    f.toLowerCase().includes("trading as") || 
    f.toLowerCase().includes("t/a") ||
    f.toLowerCase().includes("business name")
  );
  
  if (tradingFact) {
    const match = tradingFact.match(/(?:trading as|t\/a|business name[:\s]+)([A-Za-z0-9\s&]+)/i);
    if (match) {
      return `${cleanName.toUpperCase()} trading as ${match[1].trim().toUpperCase()}`;
    }
  }
  
  return cleanName.toUpperCase();
}

function extractEmployerAddress(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Check for enriched "Other party address:" format first
  const partyAddressFact = facts.find(f => f.toLowerCase().startsWith("other party address:"));
  if (partyAddressFact) {
    const address = partyAddressFact.replace(/^other party address:\s*/i, "").trim();
    if (address && address !== "null" && address !== "undefined") return address;
  }
  
  // Check for counterpartyAddress in strategy object
  if ((strategy as any).counterpartyAddress) {
    return (strategy as any).counterpartyAddress;
  }
  
  // Legacy: Look for address mentions in facts
  const addressFact = facts.find(f => 
    f.toLowerCase().includes("address") ||
    f.toLowerCase().includes("located") ||
    f.toLowerCase().includes("street") ||
    f.toLowerCase().includes("road")
  );
  return addressFact || null;
}

function extractBusinessType(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const businessFact = facts.find(f => 
    f.toLowerCase().includes("traffic management") ||
    f.toLowerCase().includes("construction") ||
    f.toLowerCase().includes("business") ||
    f.toLowerCase().includes("company type")
  );
  
  if (businessFact?.includes("traffic management")) {
    return "Traffic Management Services";
  }
  
  return businessFact || null;
}

function extractStartDate(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const dateFact = facts.find(f => 
    f.toLowerCase().includes("start") ||
    f.toLowerCase().includes("began") ||
    f.toLowerCase().includes("commenced")
  );
  return dateFact || null;
}

function extractEndDate(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const dateFact = facts.find(f => 
    f.toLowerCase().includes("end") ||
    f.toLowerCase().includes("left") ||
    f.toLowerCase().includes("terminated") ||
    f.toLowerCase().includes("dismissed")
  );
  return dateFact || null;
}

function extractEmploymentStatus(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const continuingFact = facts.find(f => 
    f.toLowerCase().includes("still") ||
    f.toLowerCase().includes("current") ||
    f.toLowerCase().includes("ongoing")
  );
  
  const endedFact = facts.find(f => 
    f.toLowerCase().includes("left") ||
    f.toLowerCase().includes("ended") ||
    f.toLowerCase().includes("terminated") ||
    f.toLowerCase().includes("finished")
  );
  
  if (endedFact) return "☒ No";
  if (continuingFact) return "☒ Yes";
  return "☐ Yes  ☐ No [User to complete]";
}

function extractJobTitle(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const jobFact = facts.find(f => 
    f.toLowerCase().includes("job") ||
    f.toLowerCase().includes("position") ||
    f.toLowerCase().includes("role") ||
    f.toLowerCase().includes("work as") ||
    f.toLowerCase().includes("traffic management")
  );
  
  if (jobFact?.includes("traffic management")) {
    return "Traffic Management Operative";
  }
  
  return jobFact || null;
}

function extractWorkingHours(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const hoursFact = facts.find(f => 
    f.toLowerCase().includes("hours") ||
    f.toLowerCase().includes("hour") ||
    f.toLowerCase().includes("shift") ||
    f.match(/\d+\s*(?:am|pm)/i)
  );
  
  if (hoursFact) {
    const match = hoursFact.match(/(\d+)\s*hours?/i);
    if (match) return match[1];
  }
  
  return null;
}

function determineClaimTypes(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  
  let types = "";
  
  if (factsText.includes("unpaid") || factsText.includes("wages") || factsText.includes("not paid")) {
    types += "☒ Breach of contract - unpaid wages/holiday pay\n";
  }
  
  if (factsText.includes("dismissed") || factsText.includes("sacked") || factsText.includes("fired")) {
    types += "☒ Unfair dismissal\n";
  }
  
  if (factsText.includes("discrimination") || factsText.includes("harass")) {
    types += "☒ Discrimination (specify type): _______\n";
  }
  
  if (!types) {
    types = "☐ Unfair dismissal\n☐ Breach of contract\n☐ Discrimination\n☒ Other (specify below)";
  }
  
  return types;
}

function generateClaimNarrative(strategy: CaseStrategy, evidence: EvidenceItem[]): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  let narrative = `BACKGROUND:\n\n`;
  
  // Opening paragraph
  narrative += `I am making this claim against ${extractEmployerName(strategy)} for `;
  
  const unpaid = facts.some(f => f.toLowerCase().includes("unpaid") || f.toLowerCase().includes("not paid"));
  if (unpaid) {
    narrative += "unpaid wages";
  } else {
    narrative += "[describe nature of claim]";
  }
  
  narrative += `. The details of my claim are as follows:\n\n`;
  
  // Chronological facts
  narrative += `WHAT HAPPENED:\n\n`;
  facts.forEach((fact, i) => {
    narrative += `${i + 1}. ${fact}\n\n`;
  });
  
  // Evidence reference
  if (evidence.length > 0) {
    narrative += `\nEVIDENCE:\n\nI have the following evidence to support my claim:\n\n`;
    evidence.forEach((e, i) => {
      narrative += `• ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
    narrative += `\nThis evidence demonstrates that my account is accurate and truthful.\n\n`;
  }
  
  // Legal basis
  narrative += `WHY THIS IS UNLAWFUL/BREACH:\n\n`;
  narrative += `The respondent's actions constitute a breach of contract because [explain why - e.g., "they failed to pay agreed wages for work completed"]. `;
  narrative += `I performed my obligations under the agreement and the respondent has failed to honor theirs.\n\n`;
  
  return narrative;
}

function extractCompensationAmount(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Check for enriched "Amount claimed:" format first (from caseSummary)
  const amountFact = facts.find(f => f.toLowerCase().startsWith("amount claimed:"));
  if (amountFact) {
    const match = amountFact.match(/£([\d,]+)/);
    if (match) return match[1].replace(/,/g, "");
  }
  
  // Check for amount in strategy object (if passed through)
  if ((strategy as any).amount) {
    return String((strategy as any).amount);
  }
  
  // Legacy: Check desiredOutcome
  const outcome = strategy.desiredOutcome || "";
  const match = outcome.match(/£([\d,]+)/);
  return match ? match[1].replace(/,/g, "") : null;
}

function extractRecipientDetails(strategy: CaseStrategy): string {
  const employerName = extractEmployerName(strategy);
  const address = extractEmployerAddress(strategy);
  
  return `${employerName}
${address || "[Recipient address - User to complete]"}
[Postcode]`;
}

function generateLetterBackground(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  return facts.slice(0, 2).join(" ") || "[Describe how the relationship/agreement began]";
}

function generateLetterFacts(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  return facts.map((f, i) => `${i + 1}. ${f}`).join("\n\n") || "[State the key facts chronologically]";
}

function formatEvidenceForLetter(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) {
    return "I have documentary evidence to support this claim which I will provide if requested.";
  }
  
  return `I have the following evidence:\n\n${evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n")}`;
}

function generateLegalBasis(strategy: CaseStrategy, routingDecision: RoutingDecision): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  
  if (factsText.includes("unpaid") || factsText.includes("not paid")) {
    return "This is a breach of contract claim. You agreed to pay £X for services rendered. I completed the work as agreed. You have failed to pay. This is a clear breach of the contract between us and I am entitled to payment of the agreed sum.";
  }
  
  if (factsText.includes("employment")) {
    return "This relates to [unfair dismissal / breach of employment contract / discrimination]. Under UK employment law, [explain the legal basis].";
  }
  
  return "[Explain the legal basis of your claim - what law/contract was breached and why you are entitled to the remedy sought]";
}

function extractMonetaryAmount(strategy: CaseStrategy): string | null {
  const outcome = strategy.desiredOutcome || "";
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Check for enriched "Amount claimed:" format first (from caseSummary)
  const amountFact = facts.find(f => f.toLowerCase().startsWith("amount claimed:"));
  if (amountFact) {
    const match = amountFact.match(/£([\d,]+(?:\.\d{2})?)/);
    if (match) return match[1].replace(/,/g, "");
  }
  
  // Check for amount in strategy object (if passed through)
  if ((strategy as any).amount) {
    return String((strategy as any).amount);
  }
  
  // Legacy: Check all text for £ amount
  const allText = `${outcome} ${facts.join(" ")}`;
  const match = allText.match(/£([\d,]+(?:\.\d{2})?)/);
  return match ? match[1].replace(/,/g, "") : null;
}

function calculateDeadline(days: number): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Generate appropriate costs clause based on claim track
 * 
 * UK County Court tracks:
 * - Small claims: up to £10,000 (no legal costs recoverable)
 * - Fast track: £10,001 - £25,000
 * - Multi-track: £25,001+
 * 
 * In small claims, you can only recover:
 * - Court fees
 * - Limited fixed costs
 * - Witness expenses
 * - Expert fees (up to £750)
 */
function generateCostsClause(strategy: CaseStrategy): string {
  const amountStr = extractMonetaryAmount(strategy);
  const amount = amountStr ? parseFloat(amountStr.replace(/,/g, "")) : 0;
  
  if (amount <= 10000) {
    // Small claims track - can't claim legal costs
    return "(3) Fixed costs and court fees as allowed by the court";
  } else if (amount <= 25000) {
    // Fast track - costs on standard basis
    return "(3) Costs on the standard basis, to be assessed if not agreed";
  } else {
    // Multi-track - full costs claim
    return "(3) Costs";
  }
}

/**
 * Validate that claimed amount is consistent with stated facts
 * Returns warnings if math doesn't add up
 */
function validateAmountConsistency(strategy: CaseStrategy): { 
  valid: boolean; 
  warnings: string[];
  suggestedAmount?: string;
} {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  const claimedAmount = extractMonetaryAmount(strategy);
  
  const warnings: string[] = [];
  let calculatedAmount: number | null = null;
  
  // Try to extract work details to calculate
  const hoursMatch = factsText.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  const rateMatch = factsText.match(/£([\d.]+)\s*(?:per\s*)?(?:hour|hr)/i);
  
  if (hoursMatch && rateMatch) {
    const hours = parseFloat(hoursMatch[1]);
    const rate = parseFloat(rateMatch[1]);
    calculatedAmount = hours * rate;
    
    const claimed = claimedAmount ? parseFloat(claimedAmount) : 0;
    
    // Check if amounts are significantly different (>5% tolerance)
    if (claimed > 0 && Math.abs(claimed - calculatedAmount) > claimed * 0.05) {
      warnings.push(
        `Amount inconsistency: You state ${hours} hours at £${rate}/hour = £${calculatedAmount.toFixed(2)}, ` +
        `but claim £${claimed}. Ensure these match or explain the difference.`
      );
    }
  }
  
  // Check for partial work mentions that conflict with full claim
  if (factsText.includes("waive") || factsText.includes("left early") || factsText.includes("didn't complete")) {
    warnings.push(
      "Partial completion detected: Your facts mention partial work/waiver. " +
      "Ensure claimed amount reflects actual work completed, not the full contracted amount."
    );
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    suggestedAmount: calculatedAmount ? calculatedAmount.toFixed(2) : undefined
  };
}

function generateEvidenceDescriptions(evidence: EvidenceItem[], strategy: CaseStrategy): string {
  if (evidence.length === 0) {
    return "No evidence items uploaded yet. Please upload relevant documents, photographs, emails, contracts, or receipts.";
  }
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  const counterparty = extractEmployerName(strategy);
  
  return evidence.map((e, i) => {
    const fileName = (e.title || e.fileName || "").toLowerCase();
    const fileType = e.fileType || "";
    const isImage = fileType.startsWith("image/");
    const isPdf = fileType === "application/pdf";
    
    // Auto-classify evidence type
    let evidenceCategory = "Document";
    let relevanceDescription = "";
    
    if (isImage) {
      evidenceCategory = "Photographic Evidence";
      if (fileName.includes("screenshot") || fileName.includes("screen")) {
        relevanceDescription = "Screenshot evidence capturing relevant digital communications or records.";
      } else if (fileName.includes("receipt") || fileName.includes("invoice")) {
        relevanceDescription = "Photographic evidence of payment, receipt, or invoice.";
      } else if (fileName.includes("damage") || fileName.includes("condition")) {
        relevanceDescription = "Photographic evidence documenting the condition or damage in question.";
      } else {
        relevanceDescription = "Visual evidence supporting the claimant's account of events.";
      }
    } else if (isPdf) {
      if (fileName.includes("contract") || fileName.includes("agreement")) {
        evidenceCategory = "Contract/Agreement";
        relevanceDescription = `Documentary evidence of the agreement between the Claimant and ${counterparty}.`;
      } else if (fileName.includes("email") || fileName.includes("correspondence")) {
        evidenceCategory = "Correspondence";
        relevanceDescription = `Written communications between the parties relevant to the dispute.`;
      } else if (fileName.includes("invoice") || fileName.includes("receipt")) {
        evidenceCategory = "Financial Document";
        relevanceDescription = "Financial documentation supporting the amounts claimed.";
      } else if (fileName.includes("statement")) {
        evidenceCategory = "Statement";
        relevanceDescription = "Witness or bank statement relevant to the case.";
      } else {
        evidenceCategory = "Supporting Document";
        relevanceDescription = "Documentary evidence supporting the claimant's case.";
      }
    } else {
      // Text/other files
      if (fileName.includes("email") || fileName.includes("message") || fileName.includes("chat")) {
        evidenceCategory = "Communication Records";
        relevanceDescription = "Written communications between the parties demonstrating the facts as stated.";
      } else if (fileName.includes("contract") || fileName.includes("agreement")) {
        evidenceCategory = "Contract/Agreement";
        relevanceDescription = `Evidence of the contractual relationship between the Claimant and ${counterparty}.`;
      } else {
        evidenceCategory = "Supporting Evidence";
        relevanceDescription = "Evidence supporting the facts as pleaded in this claim.";
      }
    }
    
    // Use user-provided description if available, otherwise auto-generated
    const finalDescription = e.description && e.description.length > 10 
      ? e.description 
      : relevanceDescription;
    
    return `
EXHIBIT E${i + 1}: ${e.title || e.fileName}

Category: ${evidenceCategory}
Type: ${fileType || "Document"}
Date uploaded: ${new Date(e.createdAt).toLocaleDateString("en-GB")}

Description:
${finalDescription}

Relevance to case:
${relevanceDescription}

This exhibit is referenced in the Particulars of Claim and/or witness statement.

───────────────────────────────────────────────────────────────`;
  }).join("\n");
}

function generatePhotographicEvidenceSection(evidence: EvidenceItem[], strategy: CaseStrategy): string {
  const images = evidence.filter(e => e.fileType?.startsWith("image/"));
  
  if (images.length === 0) {
    return "No photographic evidence has been uploaded.\n\nNote: If you have photographs, screenshots, or images relevant to this case, you should upload them.";
  }
  
  return images.map((img, i) => `
PHOTOGRAPH ${i + 1}: ${img.title || img.fileName}

Reference: E${evidence.indexOf(img) + 1}
Date uploaded: ${new Date(img.createdAt).toLocaleDateString("en-GB")}
Type: ${img.fileType}

Description:
${img.description || "Photographic evidence supporting the case"}

This photograph shows: [User should review and confirm accuracy]

Relevance:
This image corroborates [specific fact from the claim].

File: ${img.fileUrl}

───────────────────────────────────────────────────────────────
`).join("\n");
}

function generateDamagesSummary(strategy: CaseStrategy): string {
  const amount = extractMonetaryAmount(strategy);
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  const counterparty = extractEmployerName(strategy);
  
  // Detect dispute type from facts
  const isHousing = factsText.includes("deposit") || factsText.includes("landlord") || 
                    factsText.includes("tenant") || factsText.includes("rent") ||
                    factsText.includes("property") || factsText.includes("tenancy");
  const isEmployment = factsText.includes("employer") || factsText.includes("wages") ||
                       factsText.includes("salary") || factsText.includes("employment");
  
  let breachType = "breach of contract / unlawful actions";
  if (isHousing) {
    breachType = "failure to return deposit / breach of tenancy obligations";
  } else if (isEmployment) {
    breachType = "breach of employment contract / unpaid wages";
  }
  
  return `This schedule sets out the financial losses suffered as a result of ${counterparty}'s ${breachType}.

Total amount claimed: £${amount || "_______"}

${strategy.desiredOutcome || "[Brief explanation of what is being claimed and why]"}`;
}

function generateDamagesCalculation(strategy: CaseStrategy, routingDecision: RoutingDecision): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  
  // Get amount from multiple sources (enriched strategy has amount field)
  const amount = extractMonetaryAmount(strategy) || 
                 ((strategy as any).amount ? String((strategy as any).amount) : null);
  const amountNum = amount ? parseFloat(amount.replace(/,/g, "")) : 0;
  
  // Get incident date for interest calculation
  const incidentDate = (strategy as any).incidentDate || null;
  
  // Detect dispute type
  const isHousing = factsText.includes("deposit") || factsText.includes("landlord") || 
                    factsText.includes("tenant") || factsText.includes("rent") ||
                    factsText.includes("property") || factsText.includes("tenancy");
  const isEmployment = factsText.includes("employer") || factsText.includes("wages") ||
                       factsText.includes("salary") || factsText.includes("hours") ||
                       factsText.includes("employment");
  const isContract = factsText.includes("contract") || factsText.includes("agreement") ||
                     factsText.includes("self-employed") || factsText.includes("invoice");
  
  let calculation = `1. DIRECT FINANCIAL LOSSES:\n\n`;
  let sectionNum = 2;
  
  if (isHousing) {
    // Housing/deposit dispute calculation
    calculation += `   Unreturned deposit: £${amount || "_______"}\n\n`;
    
    // Check for specific deposit-related deductions
    const hasDeductions = factsText.includes("deduction") || factsText.includes("cleaning") || 
                         factsText.includes("damage") || factsText.includes("withheld");
    
    if (hasDeductions) {
      calculation += `   Note: Any deductions claimed by landlord should be itemized and\n`;
      calculation += `   challenged if not supported by evidence or inventory check.\n\n`;
    }
    
    calculation += `   Sub-total (Deposit): £${amount || "_______"}\n\n`;
    
    // Check if TDS scheme mentioned
    const noTDS = factsText.includes("not protected") || factsText.includes("no scheme") ||
                  factsText.includes("tds") || factsText.includes("deposit protection");
    
    if (noTDS) {
      calculation += `${sectionNum}. DEPOSIT PROTECTION PENALTY (if applicable):\n\n`;
      calculation += `   If deposit was not protected in a government-approved scheme,\n`;
      calculation += `   the landlord may be liable for 1-3x the deposit amount:\n\n`;
      calculation += `   Minimum penalty (1x deposit): £${amount || "_______"}\n`;
      const maxPenalty = amountNum > 0 ? (amountNum * 3).toFixed(2) : "_______";
      calculation += `   Maximum penalty (3x deposit): £${maxPenalty}\n\n`;
      sectionNum++;
    }
    
  } else if (isEmployment || isContract) {
    // Employment/Contract dispute calculation
    // Try to extract hours and rate from facts
    const hoursMatch = factsText.match(/(\d+(?:\.\d+)?)\s*hours?/i);
    const rateMatch = factsText.match(/£(\d+(?:\.\d+)?)\s*(?:per\s*hour|\/hr|\/hour|hourly)/i) ||
                      factsText.match(/(\d+(?:\.\d+)?)\s*(?:per\s*hour|\/hr|\/hour|hourly)/i);
    
    if (hoursMatch && rateMatch) {
      const hours = parseFloat(hoursMatch[1]);
      const rate = parseFloat(rateMatch[1]);
      const calculated = (hours * rate).toFixed(2);
      
      calculation += `   Unpaid ${isEmployment ? "wages" : "fees"} calculation:\n`;
      calculation += `   ${hours} hours × £${rate}/hour = £${calculated}\n\n`;
      
      if (amount && Math.abs(parseFloat(amount) - parseFloat(calculated)) > 0.01) {
        calculation += `   Note: User stated amount £${amount} (calculated: £${calculated})\n\n`;
      }
    } else if (amount) {
      calculation += `   Unpaid ${isEmployment ? "wages/salary" : "fees for services rendered"}: £${amount}\n\n`;
    } else {
      calculation += `   [Unpaid amount]: £_______\n\n`;
    }
    
    calculation += `   Sub-total (Direct losses): £${amount || "_______"}\n\n`;
    
  } else {
    // Generic calculation
    if (amount) {
      calculation += `   Principal amount owed: £${amount}\n\n`;
    } else {
      calculation += `   [Item description]: £_______\n`;
      calculation += `   [Item description]: £_______\n\n`;
    }
    
    calculation += `   Sub-total (Direct losses): £${amount || "_______"}\n\n`;
  }
  
  // INTEREST CALCULATION (8% statutory)
  calculation += `${sectionNum}. INTEREST:\n\n`;
  calculation += `   Interest on late payment (8% per annum statutory interest)\n`;
  calculation += `   Principal: £${amount || "_______"}\n`;
  
  // Calculate interest if we have an incident date
  if (incidentDate && amountNum > 0) {
    const startDate = new Date(incidentDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0) {
      // 8% per annum = 0.08 / 365 per day
      const dailyRate = 0.08 / 365;
      const interestAmount = (amountNum * dailyRate * daysDiff).toFixed(2);
      
      calculation += `   Period: ${daysDiff} days from ${startDate.toLocaleDateString("en-GB")} to date hereof\n`;
      calculation += `   Calculation: £${amount} × 8% × ${daysDiff}/365 = £${interestAmount}\n`;
      calculation += `   Interest to date: £${interestAmount}\n`;
      calculation += `   (Interest continues to accrue at £${(amountNum * dailyRate).toFixed(2)} per day)\n\n`;
    } else {
      calculation += `   Period: From [date debt became due] to date of judgment\n`;
      calculation += `   Interest: £_______\n\n`;
    }
  } else {
    calculation += `   Period: [X] days from [date debt became due] to date of judgment\n`;
    if (amountNum > 0) {
      const dailyInterest = (amountNum * 0.08 / 365).toFixed(2);
      calculation += `   Daily rate: £${dailyInterest}/day\n`;
    }
    calculation += `   Interest: £_______\n\n`;
  }
  sectionNum++;
  
  // COSTS
  calculation += `${sectionNum}. COSTS:\n\n`;
  
  // Calculate court fee based on amount (Small Claims Track fees)
  if (amountNum > 0) {
    let courtFee = "_______";
    if (amountNum <= 300) courtFee = "35.00";
    else if (amountNum <= 500) courtFee = "50.00";
    else if (amountNum <= 1000) courtFee = "70.00";
    else if (amountNum <= 1500) courtFee = "80.00";
    else if (amountNum <= 3000) courtFee = "115.00";
    else if (amountNum <= 5000) courtFee = "205.00";
    else if (amountNum <= 10000) courtFee = "455.00";
    
    calculation += `   Court fee (based on claim value): £${courtFee}\n`;
  } else {
    calculation += `   Court fee: £_______\n`;
  }
  
  calculation += `   Other costs incurred: £_______\n\n`;
  calculation += `   Sub-total (Costs): £_______\n\n`;
  
  // TOTAL
  calculation += `───────────────────────────────────────────────────────────────\n`;
  calculation += `TOTAL AMOUNT CLAIMED: £${amount || "_______"} + interest + costs\n`;
  calculation += `───────────────────────────────────────────────────────────────\n`;
  
  return calculation;
}

function generateDamagesJustification(strategy: CaseStrategy, evidence: EvidenceItem[]): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = facts.join(" ").toLowerCase();
  
  // Get amount from multiple sources
  const amount = extractMonetaryAmount(strategy) || 
                 ((strategy as any).amount ? String((strategy as any).amount) : null);
  
  // Get counterparty name
  const counterparty = (strategy as any).counterpartyName || extractEmployerName(strategy);
  
  // Detect dispute type
  const isHousing = factsText.includes("deposit") || factsText.includes("landlord") || 
                    factsText.includes("tenant") || factsText.includes("rent");
  const isEmployment = factsText.includes("employer") || factsText.includes("wages") ||
                       factsText.includes("employment");
  const isContract = factsText.includes("contract") || factsText.includes("self-employed") ||
                     factsText.includes("invoice") || factsText.includes("fee");
  
  let justification = `The amounts claimed are calculated as follows:\n\n`;
  
  // Include ALL relevant facts (enriched format)
  justification += `KEY FACTS SUPPORTING CLAIM:\n\n`;
  facts.forEach((fact) => {
    const factLower = fact.toLowerCase();
    // Include financial facts, party info, dates, and key details
    if (factLower.includes("£") || 
        factLower.includes("amount claimed") ||
        factLower.includes("pay") || 
        factLower.includes("hours") ||
        factLower.includes("deposit") ||
        factLower.includes("the other party") ||
        factLower.includes("the claimant") ||
        factLower.includes("date of incident") ||
        factLower.includes("relationship") ||
        factLower.includes("work") ||
        factLower.includes("agreed")) {
      justification += `• ${fact}\n`;
    }
  });
  
  justification += `\n`;
  
  // Add type-specific justification
  if (isHousing) {
    justification += `DEPOSIT CLAIM JUSTIFICATION:\n\n`;
    justification += `• The deposit of £${amount || "_______"} was paid at the start of the tenancy\n`;
    justification += `• The tenancy has ended and the deposit has not been returned\n`;
    
    if (factsText.includes("not protected")) {
      justification += `• The deposit was not protected in a government-approved scheme as required by law\n`;
      justification += `• Under the Housing Act 2004, failure to protect a deposit entitles the tenant to compensation of 1-3x the deposit amount\n`;
    }
    
    if (factsText.includes("deduction")) {
      justification += `• Any deductions claimed by the landlord are disputed as [unreasonable/unsupported by evidence]\n`;
    }
  } else if (isContract || isEmployment) {
    justification += `${isEmployment ? "EMPLOYMENT" : "CONTRACT"} CLAIM JUSTIFICATION:\n\n`;
    justification += `• The Claimant provided services/work to ${counterparty}\n`;
    
    // Look for hours and rate in facts
    const hoursMatch = factsText.match(/(\d+(?:\.\d+)?)\s*hours?/i);
    const rateMatch = factsText.match(/£(\d+(?:\.\d+)?)\s*(?:per\s*hour|\/hr|hourly|rate)/i);
    
    if (hoursMatch) {
      justification += `• ${hoursMatch[1]} hours of work were completed\n`;
    }
    if (rateMatch) {
      justification += `• The agreed rate was £${rateMatch[1]} per hour\n`;
    }
    
    justification += `• Payment of £${amount || "_______"} became due upon completion of work\n`;
    justification += `• Despite requests, ${counterparty} has failed to make payment\n`;
    justification += `• The Claimant is therefore entitled to the sum claimed\n`;
  }
  
  // Evidence support
  justification += `\nEVIDENCE SUPPORTING QUANTUM:\n\n`;
  if (evidence.length > 0) {
    evidence.forEach((e, i) => {
      justification += `${i + 1}. ${e.title || e.fileName}`;
      if (e.description) {
        justification += ` - ${e.description}`;
      }
      justification += `\n`;
    });
  } else {
    justification += `• Contemporaneous records and correspondence support the amounts claimed\n`;
    justification += `• The Claimant can produce original documents if required by the court\n`;
  }
  
  return justification;
}

function extractDefendantName(strategy: CaseStrategy): string {
  return extractEmployerName(strategy);
}

/**
 * Extract claimant/user name from case facts
 */
function extractClaimantName(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  for (const fact of facts) {
    // Check for "The claimant is:" pattern
    const claimantMatch = fact.match(/(?:claimant is|claimant:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (claimantMatch) return claimantMatch[1];
    
    // Check for "I, [Name]," pattern
    const iMatch = fact.match(/I,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),/);
    if (iMatch) return iMatch[1];
  }
  
  // Check strategy extensions
  if ((strategy as any).claimantName) {
    return (strategy as any).claimantName;
  }
  
  return null;
}

/**
 * Extract claimant email from case facts
 */
function extractClaimantEmail(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  for (const fact of facts) {
    // Check for "Claimant email:" pattern
    const emailMatch = fact.match(/(?:claimant email|email:)\s*([\w.+-]+@[\w.-]+\.\w+)/i);
    if (emailMatch) return emailMatch[1];
  }
  
  // Check strategy extensions
  if ((strategy as any).claimantEmail) {
    return (strategy as any).claimantEmail;
  }
  
  return null;
}

function generateParticularsOfClaim(
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  routingDecision: RoutingDecision
): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  let particulars = ``;
  let para = 1;
  
  particulars += `${para}. The Claimant is [describe yourself - individual, self-employed worker, consumer, etc.].\n\n`;
  para++;
  
  particulars += `${para}. The Defendant is ${extractEmployerName(strategy)} [describe defendant - company, individual, etc.].\n\n`;
  para++;
  
  particulars += `${para}. THE AGREEMENT\n\n`;
  particulars += `   On or around [date], the parties entered into an agreement whereby [describe the agreement/contract].\n\n`;
  para++;
  
  particulars += `${para}. THE CLAIMANT'S PERFORMANCE\n\n`;
  facts.forEach(fact => {
    if (fact.toLowerCase().includes("work") || fact.toLowerCase().includes("did") || fact.toLowerCase().includes("completed")) {
      particulars += `   ${para}.1 ${fact}\n`;
    }
  });
  particulars += `\n`;
  para++;
  
  particulars += `${para}. THE DEFENDANT'S BREACH\n\n`;
  particulars += `   In breach of the agreement, the Defendant [state what they did wrong].\n\n`;
  para++;
  
  particulars += `${para}. LOSS AND DAMAGE\n\n`;
  particulars += `   As a result of the Defendant's breach, the Claimant has suffered loss and damage:\n\n`;
  particulars += `   ${para}.1 Financial loss: £${extractMonetaryAmount(strategy) || "_______"}\n`;
  particulars += `   ${para}.2 [Other losses if applicable]\n\n`;
  para++;
  
  particulars += `${para}. INTEREST\n\n`;
  particulars += `   The Claimant claims interest pursuant to section 69 of the County Courts Act 1984 at the rate of 8% per annum from the date the debt became due to the date of judgment.\n\n`;
  
  return particulars;
}

function generateLegallyAccurateParticulars(
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  routingDecision: RoutingDecision
): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const employmentStatus = determineEmploymentStatus(facts);
  const moneyTerms = getUnpaidMoneyTerminology(employmentStatus);
  
  let particulars = ``;
  let para = 1;
  
  // 1. CLAIMANT STATUS
  if (employmentStatus === "self-employed") {
    particulars += `${para}. The Claimant is a self-employed [trade/profession - user to complete based on case facts].\n\n`;
  } else if (employmentStatus === "employed") {
    particulars += `${para}. The Claimant was at all material times an employee of the Defendant.\n\n`;
  } else {
    particulars += `${para}. The Claimant is [describe status - self-employed/worker/consumer - user to complete].\n\n`;
  }
  para++;
  
  // 2. DEFENDANT
  particulars += `${para}. The Defendant is ${extractEmployerName(strategy)}, [a limited company/individual - user to complete].\n\n`;
  para++;
  
  // 3. CONTRACT FORMATION (EXPLICIT)
  particulars += `${para}. THE CONTRACT\n\n`;
  particulars += `   On or around [date - user to complete], the parties entered into an [oral/written] contract whereby:\n\n`;
  particulars += `   (a) The Claimant agreed to provide [specific services - e.g., traffic management services on construction site]\n\n`;
  particulars += `   (b) The Defendant agreed to pay £[amount] per [hour/day/job]\n\n`;
  particulars += `   (c) This agreement was reached by [phone call/email/meeting/conduct]\n\n`;
  
  // Add course of dealing if applicable
  const regularWork = facts.some(f => 
    f.toLowerCase().includes("regular") || 
    f.toLowerCase().includes("previous") ||
    f.toLowerCase().includes("worked before")
  );
  
  if (regularWork) {
    particulars += `   (d) The parties had a course of dealing whereby the Claimant regularly provided services to the Defendant on similar terms\n\n`;
  }
  
  // QUANTUM MERUIT FALLBACK (CRITICAL!)
  particulars += `   ${para}.1 ALTERNATIVELY, if the Court finds there was no express contract, the Claimant claims on a quantum meruit basis:\n\n`;
  particulars += `      (a) The Defendant requested the Claimant to provide services\n`;
  particulars += `      (b) The Claimant provided those services\n`;
  particulars += `      (c) There was an implied agreement that the Claimant would be paid reasonable remuneration\n`;
  particulars += `      (d) By the principle of quantum meruit, the Claimant is entitled to a reasonable sum for work done\n`;
  particulars += `      (e) A reasonable sum is £[amount], being the agreed rate or market rate for such services\n\n`;
  para++;
  
  // 4. PERFORMANCE
  particulars += `${para}. THE CLAIMANT'S PERFORMANCE\n\n`;
  particulars += `   The Claimant performed the contracted services as follows:\n\n`;
  
  facts.forEach((fact, i) => {
    if (fact.toLowerCase().includes("work") || 
        fact.toLowerCase().includes("did") || 
        fact.toLowerCase().includes("completed") ||
        fact.toLowerCase().includes("provide")) {
      particulars += `   ${para}.${i + 1} ${fact}\n`;
    }
  });
  
  // Add date/hours if mentioned
  const workDate = facts.find(f => f.toLowerCase().includes("october") || f.toLowerCase().includes("date"));
  const workHours = facts.find(f => f.toLowerCase().includes("hours") || f.toLowerCase().includes("hour"));
  
  if (workDate || workHours) {
    particulars += `\n   ${para}.${facts.length + 1} Specifically:\n`;
    if (workDate) particulars += `      • Date of work: ${workDate}\n`;
    if (workHours) particulars += `      • Duration: ${workHours}\n`;
  }
  
  particulars += `\n`;
  para++;
  
  // 5. BREACH
  particulars += `${para}. THE DEFENDANT'S BREACH\n\n`;
  
  if (employmentStatus === "self-employed") {
    particulars += `   Despite repeated requests, the Defendant has failed and/or refused to pay the contractual fee of £${extractMonetaryAmount(strategy) || "_______"} which became due on [date - user to complete].\n\n`;
    particulars += `   ${para}.1 The Defendant's failure to pay constitutes a breach of the express/implied contract between the parties.\n\n`;
  } else {
    particulars += `   In breach of contract, the Defendant has failed to pay ${moneyTerms.term} of £${extractMonetaryAmount(strategy) || "_______"} due for the period [dates].\n\n`;
  }
  para++;
  
  // 6. LOSS
  particulars += `${para}. LOSS AND DAMAGE\n\n`;
  particulars += `   As a direct result of the Defendant's breach, the Claimant has suffered loss and damage:\n\n`;
  particulars += `   ${para}.1 ${moneyTerms.term}: £${extractMonetaryAmount(strategy) || "_______"}\n\n`;
  para++;
  
  // 7. EVIDENCE (REFERENCES ONLY - NO DESCRIPTIONS!)
  if (evidence.length > 0) {
    particulars += `${para}. EVIDENCE\n\n`;
    particulars += `   The Claimant will rely on the following evidence:\n\n`;
    
    evidence.forEach((e, i) => {
      const exhibitRef = `A${i + 1}`;
      const dateStr = new Date(e.createdAt).toLocaleDateString("en-GB");
      particulars += `   ${para}.${i + 1} ${e.title || e.fileName} dated ${dateStr} (Exhibit ${exhibitRef})\n`;
    });
    
    particulars += `\n`;
    para++;
  }
  
  // 8. INTEREST
  particulars += `${para}. INTEREST\n\n`;
  particulars += `   The Claimant claims interest pursuant to section 69 of the County Courts Act 1984 at the rate of 8% per annum from [date due - user to complete] to the date of judgment, or such other rate and period as the court thinks fit.\n\n`;
  
  return particulars;
}

function determineInterestBasis(strategy: CaseStrategy): string {
  return "section 69 of the County Courts Act 1984 at 8% per annum";
}

function cleanDocumentContent(content: string): string {
  // Remove any remaining markdown artifacts
  let cleaned = content
    .replace(/```[\w]*\n?/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  
  return cleaned;
}

/**
 * Post-generation constitutional validation
 * Ensures document matches its mandatory structure
 */
function validateGeneratedDocument(
  formId: string,
  content: string
): { valid: boolean; warnings: string[]; score: number } {
  console.log(`[System 3] 📜 Running constitutional structure validation for ${formId}...`);
  
  const validation = validateDocumentStructure(formId, content);
  
  if (!validation.valid) {
    console.error(`[System 3] ❌ DOCUMENT STRUCTURE VALIDATION FAILED`);
    console.error(`[System 3]    Score: ${validation.score}/10`);
    
    if (validation.missingMandatorySections.length > 0) {
      console.error(`[System 3]    Missing sections:`);
      validation.missingMandatorySections.forEach(s => 
        console.error(`[System 3]      - ${s}`)
      );
    }
    
    if (validation.forbiddenContentFound.length > 0) {
      console.error(`[System 3]    Forbidden content found:`);
      validation.forbiddenContentFound.forEach(f => 
        console.error(`[System 3]      - ${f}`)
      );
    }
    
    if (validation.missingRequiredPhrases.length > 0) {
      console.error(`[System 3]    Missing required phrases:`);
      validation.missingRequiredPhrases.forEach(p => 
        console.error(`[System 3]      - ${p}`)
      );
    }
  } else {
    console.log(`[System 3] ✅ Document structure validated (score: ${validation.score}/10)`);
  }
  
  const warnings: string[] = [];
  
  if (validation.missingRequiredPhrases.length > 0) {
    warnings.push(`Missing required phrases: ${validation.missingRequiredPhrases.join(", ")}`);
  }
  
  if (validation.score < 8) {
    warnings.push(`Structure quality score is ${validation.score}/10 (below 8)`);
  }
  
  return {
    valid: validation.valid,
    warnings,
    score: validation.score
  };
}

// ============================================================================
// PDF FORM GUIDANCE (Temporary - until PDF filling is implemented)
// ============================================================================

/**
 * Generate guidance for forms that require external completion
 * (GOV.UK redirect, online portal, or download failure)
 */
function generateFormGuidanceWithFallback(
  formId: OfficialFormID,
  errorType: string,
  fallbackUrl: string,
  routingDecision: RoutingDecision,
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string
): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const instructions = getFormInstructions(formId);
  
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  // Different messages based on error type
  let statusMessage = "";
  let actionRequired = "";
  
  switch (errorType) {
    case "GOVUK_REDIRECT":
      statusMessage = "⚠️  This form is updated frequently by the UK Government.";
      actionRequired = "Download the latest version from GOV.UK to ensure you have the current form.";
      break;
    
    case "ONLINE_ONLY":
      statusMessage = "🌐 This is an online-only service.";
      actionRequired = "Complete your application at the official portal.";
      break;
    
    case "CACHE_MISS":
    case "DOWNLOAD_FAILED":
      statusMessage = "📥 Form temporarily unavailable for auto-fill.";
      actionRequired = "Download the form from GOV.UK and fill manually using the information below.";
      break;
    
    default:
      statusMessage = "⚠️  This form requires manual completion.";
      actionRequired = "Visit the official page to access the form.";
  }
  
  return `
═══════════════════════════════════════════════════════════════
${instructions.title}
═══════════════════════════════════════════════════════════════

Date: ${today}

${statusMessage}

${actionRequired}

───────────────────────────────────────────────────────────────
OFFICIAL FORM ACCESS
───────────────────────────────────────────────────────────────

📋 Form Code: ${formId}
🔗 Official Source: ${fallbackUrl}

${instructions.description}

ACTION: ${instructions.buttonText}

───────────────────────────────────────────────────────────────
YOUR CASE INFORMATION (TO COMPLETE THE FORM)
───────────────────────────────────────────────────────────────

Case Title: ${caseTitle}
Dispute Type: ${strategy.disputeType || "Not specified"}
Forum: ${routingDecision.selectedForum || "Not yet determined"}

KEY FACTS TO INCLUDE:
${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

DESIRED OUTCOME:
${strategy.desiredOutcome || "Not specified"}

EVIDENCE AVAILABLE:
${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join("\n") : "No evidence uploaded yet"}

${getMonetaryAmountSection(strategy)}

───────────────────────────────────────────────────────────────
HOW TO PROCEED
───────────────────────────────────────────────────────────────

1. Visit: ${fallbackUrl}

2. ${errorType === "ONLINE_ONLY" ? "Complete the online form" : "Download the latest PDF form"}

3. Fill in your case information using the details above

4. ${errorType === "ONLINE_ONLY" ? "Submit online" : "Print, sign, and submit to the appropriate court/tribunal"}

5. Keep proof of submission (reference number or postal receipt)

───────────────────────────────────────────────────────────────
SUBMISSION ADDRESS
───────────────────────────────────────────────────────────────

${getSubmissionInstructions(formId, routingDecision)}

═══════════════════════════════════════════════════════════════
DisputeHub System 3 - Official Forms Guidance
═══════════════════════════════════════════════════════════════

NOTE: DisputeHub ensures you always have access to the most current,
legally valid UK government forms. Some forms cannot be auto-filled
for security and authenticity reasons.
`;
}

function getMonetaryAmountSection(strategy: CaseStrategy): string {
  const amount = extractMonetaryAmount(strategy);
  if (!amount) return "";
  
  return `
AMOUNT CLAIMED:
£${amount}

Interest (if applicable):
Calculate interest using the appropriate rate for your claim type.
`;
}

/**
 * Generate guidance for filling official PDF forms manually
 * 
 * This is a TEMPORARY solution until full PDF form-filling is implemented.
 * It tells the user to download the official form and provides data to fill in.
 */
function generatePdfFormGuidance(
  formId: OfficialFormID,
  routingDecision: RoutingDecision,
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  caseTitle: string
): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  return `
═══════════════════════════════════════════════════════════════
${getFormName(formId)} - COMPLETION GUIDANCE
═══════════════════════════════════════════════════════════════

Date: ${today}

⚠️  IMPORTANT: This is an OFFICIAL GOVERNMENT FORM

This form must be downloaded from the official source and completed.
DisputeHub cannot modify official PDFs directly, but we've prepared
all the information you need to fill it in.

───────────────────────────────────────────────────────────────
WHERE TO GET THE FORM
───────────────────────────────────────────────────────────────

${getOfficialFormDownloadInstructions(formId)}

───────────────────────────────────────────────────────────────
YOUR CASE INFORMATION (TO FILL IN THE FORM)
───────────────────────────────────────────────────────────────

Case: ${caseTitle}
Dispute Type: ${strategy.disputeType || "Not specified"}
Forum: ${routingDecision.selectedForum || "Not yet determined"}

KEY FACTS TO INCLUDE:
${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

DESIRED OUTCOME:
${strategy.desiredOutcome || "Not specified"}

EVIDENCE AVAILABLE:
${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join("\n") : "No evidence uploaded"}

AMOUNT CLAIMED (if applicable):
£${extractMonetaryAmount(strategy) || "_______"}

───────────────────────────────────────────────────────────────
HOW TO COMPLETE THE FORM
───────────────────────────────────────────────────────────────

${getFormSpecificGuidance(formId, strategy, facts)}

───────────────────────────────────────────────────────────────
AFTER COMPLETING THE FORM
───────────────────────────────────────────────────────────────

1. Save the completed form as a PDF
2. Print and sign where required
3. Make copies for your records
4. Submit to: ${routingDecision.selectedForum || "the appropriate court/tribunal"}
5. Keep proof of submission

${getSubmissionInstructions(formId, routingDecision)}

═══════════════════════════════════════════════════════════════
END OF GUIDANCE
═══════════════════════════════════════════════════════════════

NOTE: DisputeHub is working on automatic PDF form-filling.
For now, please complete the official form manually using the
information provided above.
`;
}

function getFormName(formId: OfficialFormID): string {
  const names: Record<string, string> = {
    "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": "EMPLOYMENT TRIBUNAL CLAIM FORM (ET1)",
    "UK-N1-COUNTY-COURT-CLAIM": "COUNTY COURT CLAIM FORM (N1)",
    "UK-SSCS1-SOCIAL-SECURITY-APPEAL": "SOCIAL SECURITY APPEAL FORM (SSCS1)",
    "UK-N244-APPLICATION-NOTICE": "APPLICATION NOTICE (N244)",
  };
  return names[formId] || formId;
}

function getOfficialFormDownloadInstructions(formId: OfficialFormID): string {
  const instructions: Record<string, string> = {
    "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": `
Download from: https://www.gov.uk/employment-tribunals/make-a-claim
Or: https://assets.publishing.service.gov.uk (search for "ET1 form")

The ET1 is available as:
• Online form (recommended): https://www.employmenttribunals.service.gov.uk
• PDF form: Download and complete offline`,
    
    "UK-N1-COUNTY-COURT-CLAIM": `
Download from: https://www.gov.uk/make-court-claim-for-money
Or search: "N1 Claim Form" on GOV.UK

The N1 is available as:
• Online claim: https://www.moneyclaim.gov.uk (recommended for claims under £100,000)
• PDF form: Download from HMCTS forms section`,
    
    "UK-SSCS1-SOCIAL-SECURITY-APPEAL": `
Download from: https://www.gov.uk/appeal-benefit-decision
Or: https://www.gov.uk/government/publications/appeal-a-social-security-benefit-decision-form-sscs1

Complete online or download PDF`,
  };
  
  return instructions[formId] || "Download from GOV.UK or the relevant tribunal/court website.";
}

function getFormSpecificGuidance(formId: OfficialFormID, strategy: CaseStrategy, facts: string[]): string {
  switch (formId) {
    case "UK-ET1-EMPLOYMENT-TRIBUNAL-2024":
      return `
SECTION 1 - CLAIMANT DETAILS:
• Fill in your full name, address, contact details
• Include your date of birth

SECTION 2 - RESPONDENT (EMPLOYER):
• Name: ${extractEmployerName(strategy)}
• Address: ${extractEmployerAddress(strategy) || "[Complete from your records]"}

SECTION 3 - EMPLOYMENT DETAILS:
• Start date: ${extractStartDate(strategy) || "[Check your contract/payslips]"}
• End date: ${extractEndDate(strategy) || "[If still employed, tick 'continuing']"}
• Job title: ${extractJobTitle(strategy) || "[Your official job title]"}

SECTION 4 - TYPE OF CLAIM:
• Tick the boxes that apply (e.g., unpaid wages, unfair dismissal, discrimination)

SECTION 5 - WHAT HAPPENED:
• Copy the key facts above
• Write in first person ("I worked as...", "On [date], the employer...")
• Be factual and chronological

SECTION 6 - WHAT YOU WANT:
${strategy.desiredOutcome || "State your remedy (e.g., compensation of £X, reinstatement)"}

SECTION 7 - ACAS CERTIFICATE:
• You MUST have an ACAS Early Conciliation certificate
• Enter the certificate number (format: R000000/XX/XX)
• If you don't have one, get it from: https://www.acas.org.uk/early-conciliation`;
    
    case "UK-N1-COUNTY-COURT-CLAIM":
      return `
CLAIMANT DETAILS:
• Your full name and address (must be UK address for service)

DEFENDANT DETAILS:
• Name: ${extractDefendantName(strategy)}
• Address: ${extractEmployerAddress(strategy) || "[Complete from your records]"}

CLAIM VALUE:
• £${extractMonetaryAmount(strategy) || "_______"}

BRIEF DETAILS OF CLAIM:
• Write 2-3 sentences summarizing the claim
• Example: "Claim for £X unpaid fees for [services]. Agreement made on [date]. Payment due [date]. Defendant failed to pay despite requests."

PARTICULARS OF CLAIM:
• Attach the "Particulars of Claim" document generated by DisputeHub
• Or write in the space provided on the form (if sufficient space)

STATEMENT OF TRUTH:
• Sign and date the form
• Your signature confirms the facts are true`;
    
    default:
      return "Follow the form instructions and complete all required sections using the case information above.";
  }
}

function getSubmissionInstructions(formId: OfficialFormID, routingDecision: RoutingDecision): string {
  if (formId === "UK-ET1-EMPLOYMENT-TRIBUNAL-2024") {
    return `
SUBMIT TO:
Employment Tribunal (online submission recommended)
Online: https://www.employmenttribunals.service.gov.uk
Or by post to your regional Employment Tribunal office

FEE: No fee for Employment Tribunal claims

DOCUMENTS TO ATTACH:
• ACAS Early Conciliation certificate (essential)
• Evidence bundle (photos, emails, contracts)
• Schedule of Loss (if claiming compensation)`;
  }
  
  if (formId === "UK-N1-COUNTY-COURT-CLAIM") {
    return `
SUBMIT TO:
Your local County Court or online via Money Claim Online
Online: https://www.moneyclaim.gov.uk (for claims under £100,000)

COURT FEE:
Based on claim value:
• Up to £300: £35
• £300-£500: £50
• £500-£1,000: £70
• £1,000-£1,500: £80
• (Full fee table on GOV.UK)

PAY BY: Cheque, postal order, or card (if online)

DOCUMENTS TO ATTACH:
• Particulars of Claim (generated by DisputeHub)
• Evidence bundle
• Schedule of Damages`;
  }
  
  return "Submit to the court/tribunal specified in your routing decision.";
}

// ============================================================================
// EXPORTS
// ============================================================================

export { selectModelForForm, buildFormSpecificPrompt };
