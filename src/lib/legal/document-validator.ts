/**
 * STRONG DOCUMENT VALIDATION SYSTEM
 * 
 * Validates generated documents against form-specific rules.
 * Prevents empty PDFs, placeholder text, and structurally invalid documents.
 */

import type { OfficialFormID } from "./form-registry";
import { FORM_METADATA, getFormMetadata } from "./form-registry";
import type {
  ValidationResult,
  DocumentValidationResult,
  SectionValidationResult,
  StructureValidationResult,
} from "./routing-types";

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export async function validateGeneratedDocument(
  content: string,
  formId: OfficialFormID
): Promise<DocumentValidationResult> {
  
  const metadata = getFormMetadata(formId);
  
  if (!metadata) {
    throw new Error(`No validation rules found for form ${formId}`);
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const sectionResults: SectionValidationResult[] = [];
  const structureResults: StructureValidationResult[] = [];
  
  // ============================================================================
  // CHECK 1: Minimum Total Length
  // ============================================================================
  
  if (content.length < metadata.minimumLength) {
    errors.push(
      `Document too short: ${content.length} characters (minimum: ${metadata.minimumLength})`
    );
  }
  
  // ============================================================================
  // CHECK 2: AI Artifacts & Placeholder Text
  // ============================================================================
  
  const forbiddenPatterns = [
    { pattern: /\[INSERT.*?\]/gi, name: "[INSERT...] placeholder" },
    { pattern: /\[FILL.*?\]/gi, name: "[FILL...] placeholder" },
    { pattern: /\[USER TO.*?\]/gi, name: "[USER TO...] placeholder" },
    { pattern: /\[LEAVE BLANK\]/gi, name: "[LEAVE BLANK] placeholder" },
    { pattern: /\[DESCRIBE.*?\]/gi, name: "[DESCRIBE...] placeholder" },
    { pattern: /\[EXPLAIN.*?\]/gi, name: "[EXPLAIN...] placeholder" },
    { pattern: /\[YOUR NAME\]/gi, name: "[YOUR NAME] placeholder" },
    { pattern: /\[YOUR ADDRESS\]/gi, name: "[YOUR ADDRESS] placeholder" },
    { pattern: /\[AMOUNT\]/gi, name: "[AMOUNT] placeholder" },
    { pattern: /\[DATE\]/gi, name: "[DATE] placeholder" },
    { pattern: /Lorem ipsum/gi, name: "Lorem ipsum dummy text" },
    { pattern: /\*\*\*+/g, name: "Markdown artifacts (***)" },
    { pattern: /```[\w]*/g, name: "Code block markers (```)" },
    { pattern: /#{2,}/g, name: "Markdown headers (##)" },
  ];
  
  for (const { pattern, name } of forbiddenPatterns) {
    if (pattern.test(content)) {
      errors.push(`Document contains ${name}`);
    }
  }
  
  // ============================================================================
  // CHECK 3: Required Sections
  // ============================================================================
  
  for (const section of metadata.requiredSections) {
    const sectionResult: SectionValidationResult = {
      sectionName: section.sectionName,
      found: false,
      length: 0,
      errors: [],
      warnings: [],
    };
    
    // Check if section exists
    const sectionRegex = new RegExp(escapeRegex(section.sectionName), 'i');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch && section.required) {
      sectionResult.errors.push(`Missing required section: ${section.sectionName}`);
      errors.push(`Missing required section: ${section.sectionName}`);
    } else if (sectionMatch) {
      sectionResult.found = true;
      
      // Extract section content (rough approximation)
      const sectionContent = extractSectionContent(content, section.sectionName);
      sectionResult.length = sectionContent.length;
      
      // Check section length
      if (section.minLength && sectionContent.length < section.minLength) {
        const error = `Section "${section.sectionName}" too short: ${sectionContent.length} chars (minimum: ${section.minLength})`;
        sectionResult.errors.push(error);
        errors.push(error);
      }
      
      // Check must-contain keywords
      if (section.mustContain) {
        for (const keyword of section.mustContain) {
          if (!sectionContent.toLowerCase().includes(keyword.toLowerCase())) {
            const warning = `Section "${section.sectionName}" should contain: "${keyword}"`;
            sectionResult.warnings.push(warning);
            warnings.push(warning);
          }
        }
      }
      
      // Check forbidden content
      if (section.mustNotContain) {
        for (const forbidden of section.mustNotContain) {
          if (sectionContent.includes(forbidden)) {
            const error = `Section "${section.sectionName}" contains forbidden placeholder: "${forbidden}"`;
            sectionResult.errors.push(error);
            errors.push(error);
          }
        }
      }
    }
    
    sectionResults.push(sectionResult);
  }
  
  // ============================================================================
  // CHECK 4: Structure Checks
  // ============================================================================
  
  for (const check of metadata.structureChecks) {
    const structureResult: StructureValidationResult = {
      checkType: check.checkType,
      passed: false,
      errorMessage: undefined,
    };
    
    try {
      const pattern = new RegExp(check.pattern, 'gim');
      const passed = pattern.test(content);
      
      structureResult.passed = passed;
      
      if (!passed) {
        structureResult.errorMessage = check.errorMessage;
        errors.push(check.errorMessage);
      }
    } catch (e) {
      console.error(`Invalid regex pattern for ${check.checkType}:`, check.pattern);
      structureResult.errorMessage = `Invalid validation pattern: ${check.checkType}`;
      warnings.push(`Could not validate ${check.checkType}`);
    }
    
    structureResults.push(structureResult);
  }
  
  // ============================================================================
  // CHECK 5: Empty or Whitespace-Only Content
  // ============================================================================
  
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    errors.push("Document is empty or contains only whitespace");
  }
  
  // ============================================================================
  // CHECK 6: Suspicious Repetition (AI hallucination indicator)
  // ============================================================================
  
  const lines = content.split('\n');
  const uniqueLines = new Set(lines.filter(line => line.trim().length > 10));
  
  if (lines.length > 20 && uniqueLines.size < lines.length * 0.3) {
    warnings.push("Document contains suspicious repetition (possible AI hallucination)");
  }
  
  // ============================================================================
  // DETERMINE RESULT
  // ============================================================================
  
  let action: "SUCCESS" | "GENERATE_WITH_WARNINGS" | "FAIL_GENERATION";
  
  if (errors.length > 0) {
    action = "FAIL_GENERATION";
  } else if (warnings.length > 0) {
    action = "GENERATE_WITH_WARNINGS";
  } else {
    action = "SUCCESS";
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    action,
    formId,
    validatedAt: new Date(),
    sectionResults,
    structureResults,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSectionContent(content: string, sectionName: string): string {
  // Try to extract content between this section and the next section/heading
  const sectionRegex = new RegExp(
    escapeRegex(sectionName) + '([\\s\\S]*?)(?=\\n\\n[A-Z][A-Z\\s]+:|\\n\\nSECTION \\d+:|$)',
    'i'
  );
  
  const match = content.match(sectionRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback: return content after section name until double newline
  const simpleRegex = new RegExp(escapeRegex(sectionName) + '([\\s\\S]{0,500})', 'i');
  const simpleMatch = content.match(simpleRegex);
  
  return simpleMatch ? simpleMatch[1].trim() : '';
}

// ============================================================================
// QUICK VALIDATION (for fast checks)
// ============================================================================

export function quickValidate(content: string, formId: OfficialFormID): boolean {
  const metadata = getFormMetadata(formId);
  
  if (!metadata) return false;
  
  // Quick checks
  if (content.length < metadata.minimumLength) return false;
  if (content.trim().length === 0) return false;
  if (/\[INSERT.*?\]/i.test(content)) return false;
  if (/\[FILL.*?\]/i.test(content)) return false;
  if (/Lorem ipsum/i.test(content)) return false;
  
  return true;
}

// ============================================================================
// VALIDATION SUMMARY (for logging)
// ============================================================================

export function getValidationSummary(result: DocumentValidationResult): string {
  if (result.valid) {
    return `✅ VALID (${result.warnings.length} warnings)`;
  }
  
  return `❌ INVALID (${result.errors.length} errors, ${result.warnings.length} warnings)`;
}

export function getValidationDetails(result: DocumentValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Form: ${result.formId}`);
  lines.push(`Validated: ${result.validatedAt.toISOString()}`);
  lines.push(`Result: ${result.valid ? 'VALID' : 'INVALID'}`);
  lines.push(`Action: ${result.action}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach(error => lines.push(`  - ${error}`));
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach(warning => lines.push(`  - ${warning}`));
    lines.push('');
  }
  
  if (result.sectionResults.length > 0) {
    lines.push('SECTIONS:');
    result.sectionResults.forEach(section => {
      const status = section.found ? '✓' : '✗';
      lines.push(`  ${status} ${section.sectionName} (${section.length} chars)`);
      if (section.errors.length > 0) {
        section.errors.forEach(err => lines.push(`      ERROR: ${err}`));
      }
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
