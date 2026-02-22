/**
 * MODULAR DOCUMENT GENERATOR
 * 
 * The master orchestrator that combines:
 * 1. Universal Skeleton (never changes)
 * 2. Case-Type Module (domain-specific legal logic)
 * 3. Document-Type Rules (orthogonal restrictions)
 * 
 * ARCHITECTURE:
 * CASE TYPE → LEGAL THEORY → ALLOWED REMEDIES → DOCUMENT RULES
 * 
 * This is the RIGHT mental model.
 */

import { CaseProfile, selectCaseTypeModule, CaseTypeModule } from "./case-type-modules";
import { 
  UniversalDocumentSkeleton, 
  UNIVERSAL_SKELETON, 
  DocumentContext, 
  DocumentType,
  generateFromSkeleton,
  validateSkeletonCompliance
} from "./universal-skeleton";
import { 
  DOCUMENT_TYPE_RULES_REGISTRY, 
  validateDocumentTypeRules,
  generateDocumentTypeInstructions,
  DocumentTypeValidationResult
} from "./document-type-rules";
import { LockedFact } from "../ai/fact-lock";
import { LegalForum } from "./forum-language-guard";

// ============================================================================
// PRE-GENERATION: THE 5-QUESTION SYSTEM
// ============================================================================

export interface PreGenerationCheck {
  canGenerate: boolean;
  blockers: string[];
  profile: GenerationProfile | null;
}

export interface GenerationProfile {
  /** 1. What domain is this case? */
  domain: string;
  /** 2. What legal theory applies? */
  legalTheories: string[];
  /** 3. What forum will read this? */
  forum: LegalForum;
  /** 4. What document role am I playing? */
  documentRole: DocumentType;
  /** 5. What am I forbidden from including? */
  forbidden: string[];
}

/**
 * THE 5-QUESTION SYSTEM
 * 
 * Before generating any document, the AI must answer:
 * 1. What domain is this case?
 * 2. What legal theory applies?
 * 3. What forum will read this?
 * 4. What document role am I playing?
 * 5. What am I forbidden from including?
 * 
 * If it can't answer all five → hard stop.
 */
export function runPreGenerationCheck(
  caseProfile: CaseProfile,
  documentType: DocumentType,
  lockedFacts: LockedFact[]
): PreGenerationCheck {
  const blockers: string[] = [];
  
  // Question 1: What domain is this case?
  if (!caseProfile.domain) {
    blockers.push("Case domain not identified");
  }
  
  // Question 2: What legal theory applies?
  const caseModule = selectCaseTypeModule(caseProfile);
  if (!caseModule) {
    blockers.push(`No legal module found for domain: ${caseProfile.domain}, forum: ${caseProfile.forum}`);
  }
  
  // Question 3: What forum will read this?
  if (!caseProfile.forum) {
    blockers.push("Forum not identified");
  }
  
  // Question 4: What document role am I playing?
  const documentRules = DOCUMENT_TYPE_RULES_REGISTRY[documentType];
  if (!documentRules) {
    blockers.push(`Unknown document type: ${documentType}`);
  }
  
  // Question 5: What am I forbidden from including?
  const forbidden = [
    ...(caseModule?.forbiddenRemedies || []),
    ...(documentRules?.forbidden || [])
  ];
  
  if (blockers.length > 0) {
    return {
      canGenerate: false,
      blockers,
      profile: null
    };
  }
  
  return {
    canGenerate: true,
    blockers: [],
    profile: {
      domain: caseProfile.domain,
      legalTheories: caseModule!.legalTheories.map(t => t.name),
      forum: caseProfile.forum,
      documentRole: documentType,
      forbidden
    }
  };
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

export interface GeneratedDocument {
  content: string;
  profile: GenerationProfile;
  validation: {
    skeletonCompliance: ReturnType<typeof validateSkeletonCompliance>;
    documentTypeCompliance: DocumentTypeValidationResult;
    overallScore: number;
    passed: boolean;
  };
}

/**
 * Generate a document using the modular architecture:
 * 
 * CASE TYPE → LEGAL THEORY → ALLOWED REMEDIES → DOCUMENT RULES
 */
export async function generateModularDocument(
  caseProfile: CaseProfile,
  documentType: DocumentType,
  lockedFacts: LockedFact[],
  caseDetails: {
    claimantName?: string;
    defendantName?: string;
    caseTitle: string;
    claimValue?: number;
  },
  evidence: Array<{
    type: string;
    description: string;
  }>
): Promise<GeneratedDocument> {
  
  console.log(`[Modular Generator] 🔍 Running 5-question pre-generation check...`);
  
  // ============================================================================
  // STEP 1: THE 5-QUESTION PRE-GENERATION CHECK
  // ============================================================================
  
  const preCheck = runPreGenerationCheck(caseProfile, documentType, lockedFacts);
  
  if (!preCheck.canGenerate) {
    console.error(`[Modular Generator] ❌ PRE-GENERATION CHECK FAILED`);
    preCheck.blockers.forEach(b => console.error(`[Modular Generator]    🚫 ${b}`));
    throw new Error(`Cannot generate document: ${preCheck.blockers.join("; ")}`);
  }
  
  console.log(`[Modular Generator] ✅ 5-question check passed`);
  console.log(`[Modular Generator]    1️⃣  Domain: ${preCheck.profile!.domain}`);
  console.log(`[Modular Generator]    2️⃣  Legal theories: ${preCheck.profile!.legalTheories.join(", ")}`);
  console.log(`[Modular Generator]    3️⃣  Forum: ${preCheck.profile!.forum}`);
  console.log(`[Modular Generator]    4️⃣  Document role: ${preCheck.profile!.documentRole}`);
  console.log(`[Modular Generator]    5️⃣  Forbidden: ${preCheck.profile!.forbidden.length} items`);
  
  // ============================================================================
  // STEP 2: LOAD MODULES
  // ============================================================================
  
  console.log(`[Modular Generator] 📦 Loading modules...`);
  
  const caseModule = selectCaseTypeModule(caseProfile)!;
  console.log(`[Modular Generator] ✅ Case module loaded: ${caseModule.name}`);
  
  const documentRules = DOCUMENT_TYPE_RULES_REGISTRY[documentType];
  console.log(`[Modular Generator] ✅ Document rules loaded: ${documentType}`);
  
  // ============================================================================
  // STEP 3: BUILD CONTEXT
  // ============================================================================
  
  const context: DocumentContext = {
    caseModule,
    lockedFacts,
    documentType,
    caseDetails: {
      ...caseDetails,
      forum: caseProfile.forum
    },
    evidence
  };
  
  // ============================================================================
  // STEP 4: GENERATE FROM SKELETON
  // ============================================================================
  
  console.log(`[Modular Generator] 🏗️  Generating from universal skeleton...`);
  const content = generateFromSkeleton(context);
  console.log(`[Modular Generator] ✅ Generated ${content.length} characters`);
  
  // ============================================================================
  // STEP 5: VALIDATE
  // ============================================================================
  
  console.log(`[Modular Generator] 🔍 Validating document...`);
  
  const skeletonValidation = validateSkeletonCompliance(content, documentType);
  console.log(`[Modular Generator]    Skeleton compliance: ${skeletonValidation.score}/10`);
  
  const documentTypeValidation = validateDocumentTypeRules(content, documentType);
  console.log(`[Modular Generator]    Document-type compliance: ${documentTypeValidation.score}/10`);
  
  const overallScore = Math.round((skeletonValidation.score + documentTypeValidation.score) / 2);
  const passed = skeletonValidation.compliant && documentTypeValidation.passed;
  
  console.log(`[Modular Generator]    Overall score: ${overallScore}/10`);
  console.log(`[Modular Generator]    ${passed ? '✅' : '❌'} Validation ${passed ? 'PASSED' : 'FAILED'}`);
  
  if (!passed) {
    console.error(`[Modular Generator] ⚠️  Validation issues:`);
    skeletonValidation.missingSections.forEach(s => 
      console.error(`[Modular Generator]      Missing section: ${s}`)
    );
    documentTypeValidation.errors.forEach(e => 
      console.error(`[Modular Generator]      Error: ${e}`)
    );
    documentTypeValidation.warnings.forEach(w => 
      console.warn(`[Modular Generator]      Warning: ${w}`)
    );
  }
  
  // ============================================================================
  // STEP 6: RETURN
  // ============================================================================
  
  return {
    content,
    profile: preCheck.profile!,
    validation: {
      skeletonCompliance: skeletonValidation,
      documentTypeCompliance: documentTypeValidation,
      overallScore,
      passed
    }
  };
}

// ============================================================================
// AI PROMPT GENERATOR
// ============================================================================

/**
 * Generate comprehensive AI instructions combining all three layers:
 * 1. Universal skeleton structure
 * 2. Case-type legal module
 * 3. Document-type rules
 */
export function generateModularPromptInstructions(
  caseProfile: CaseProfile,
  documentType: DocumentType
): string {
  const caseModule = selectCaseTypeModule(caseProfile);
  
  if (!caseModule) {
    return "";
  }
  
  const documentTypeInstructions = generateDocumentTypeInstructions(documentType);
  
  let instructions = `
═══════════════════════════════════════════════════════════════════════════
MODULAR DOCUMENT GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════

You are generating a ${documentType.replace(/_/g, ' ').toUpperCase()}.

⸻ LAYER 1: UNIVERSAL SKELETON (NEVER CHANGE THIS ORDER) ⸻

Every document follows this structure:
1. Header (parties, date)
2. Parties identification
3. Purpose of document
4. Facts (chronological, from locked facts)
5. Legal basis (see Layer 2)
6. Relief / Outcome sought (see Layer 2)
7. Evidence reference
8. Statement of truth / closing

⸻ LAYER 2: CASE-TYPE MODULE (${caseModule.name.toUpperCase()}) ⸻

LEGAL THEORIES THAT APPLY:
${caseModule.legalTheories.map(t => `
• ${t.name}
  ${t.description}
  ${t.statutoryBasis ? `Statutory basis: ${t.statutoryBasis}` : ''}
  Legal tests: ${t.legalTests.join(", ")}
`).join('\n')}

ALLOWED REMEDIES (ONLY CLAIM THESE):
${caseModule.allowedRemedies.map((r, i) => `${i + 1}. ${r.remedy}: ${r.description}`).join('\n')}

FORBIDDEN REMEDIES (NEVER CLAIM THESE):
${caseModule.forbiddenRemedies.map(f => `❌ ${f}`).join('\n')}

EVIDENCE REQUIREMENTS:
${caseModule.evidenceRequirements.map(e => `
${e.category.toUpperCase()}: ${e.description}
Examples: ${e.examples.join(", ")}
`).join('\n')}

LANGUAGE RULES:
${caseModule.languageRules.map(r => `
Context: ${r.context}
Use: ${r.use.join(", ")}
Avoid: ${r.avoid.join(", ")}
`).join('\n')}

PROPORTIONALITY:
${caseModule.proportionalityRules.map(r => `
${r.condition}: ${r.maxLength || r.maxComplexity || ''}
${r.warning || ''}
`).join('\n')}

⸻ LAYER 3: DOCUMENT-TYPE RULES ⸻

${documentTypeInstructions}

⸻ CRITICAL REMINDERS ⸻

✅ You MUST follow the universal skeleton order
✅ You MUST only claim allowed remedies
✅ You MUST respect document-type restrictions
✅ You MUST use locked facts (no invention)
✅ You MUST respect case-type language rules

❌ You MUST NOT claim forbidden remedies
❌ You MUST NOT break document-type rules
❌ You MUST NOT invent facts
❌ You MUST NOT use wrong forum language

═══════════════════════════════════════════════════════════════════════════
  `.trim();
  
  return instructions;
}
