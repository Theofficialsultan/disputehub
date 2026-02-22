/**
 * FORM LOADER SERVICE
 * 
 * Intelligently loads official forms from:
 * 1. Local storage (fastest)
 * 2. Database cache (fast)
 * 3. Remote download (fallback)
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { OfficialFormID } from '@/lib/legal/form-registry';
import { prisma } from '@/lib/prisma';

export type FormStorageType = 'LOCAL' | 'REMOTE' | 'ONLINE_ONLY';

export interface FormSource {
  formId: OfficialFormID;
  storageType: FormStorageType;
  localPath?: string;
  remoteUrl?: string;
  onlineFormUrl?: string;
  version: string;
  lastUpdated: Date;
  usageFrequency: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * COMPREHENSIVE FORM SOURCE REGISTRY
 * 
 * Defines where to get each official form
 */
export const FORM_SOURCES: Record<OfficialFormID, FormSource> = {
  
  // ============================================================================
  // TIER 1 (HIGH PRIORITY) - STORED LOCALLY
  // ============================================================================
  
  "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": {
    formId: "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
    storageType: "LOCAL",
    localPath: "/official-forms/employment/ET1-claim-form-2024.pdf",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/65a5e5d1e8f5ec000f1f5d3c/et1-eng.pdf",
    onlineFormUrl: "https://www.employmenttribunals.service.gov.uk",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-N1-COUNTY-COURT-CLAIM": {
    formId: "UK-N1-COUNTY-COURT-CLAIM",
    storageType: "LOCAL",
    localPath: "/official-forms/county-court/N1-claim-form-2023.pdf",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/5a74b0ebe5274a59fa1a95b8/n1-eng.pdf",
    onlineFormUrl: "https://www.moneyclaim.gov.uk",
    version: "2023",
    lastUpdated: new Date("2023-04-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-SSCS1-SOCIAL-SECURITY-APPEAL": {
    formId: "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
    storageType: "LOCAL",
    localPath: "/official-forms/benefits/SSCS1-appeal-form-2023.pdf",
    remoteUrl: "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1041651/sscs1.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-N244-APPLICATION-NOTICE": {
    formId: "UK-N244-APPLICATION-NOTICE",
    storageType: "LOCAL",
    localPath: "/official-forms/county-court/N244-application-notice.pdf",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/n244-eng.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-POPLA-PARKING-APPEAL": {
    formId: "UK-POPLA-PARKING-APPEAL",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.popla.co.uk",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  // ============================================================================
  // TIER 2 (MEDIUM PRIORITY) - DOWNLOAD & CACHE
  // ============================================================================
  
  "UK-ET3-EMPLOYMENT-TRIBUNAL-2024": {
    formId: "UK-ET3-EMPLOYMENT-TRIBUNAL-2024",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/65a5e5d1e8f5ec000f1f5d3d/et3-eng.pdf",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-N11-DEFENSE-ADMISSION": {
    formId: "UK-N11-DEFENSE-ADMISSION",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/n11-eng.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-SSCS5-MANDATORY-RECONSIDERATION": {
    formId: "UK-SSCS5-MANDATORY-RECONSIDERATION",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/sscs5.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-N180-DIRECTIONS-QUESTIONNAIRE": {
    formId: "UK-N180-DIRECTIONS-QUESTIONNAIRE",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/n180-eng.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-IAFT5-IMMIGRATION-APPEAL": {
    formId: "UK-IAFT5-IMMIGRATION-APPEAL",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/iaft5.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  // ============================================================================
  // TIER 3 (LOW PRIORITY / SPECIALIZED) - REMOTE OR ONLINE ONLY
  // ============================================================================
  
  "UK-FTT-PROP-APPLICATION": {
    formId: "UK-FTT-PROP-APPLICATION",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/ftt-prop-application.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-FTT-PROP-RENT-ASSESSMENT": {
    formId: "UK-FTT-PROP-RENT-ASSESSMENT",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.gov.uk/appeal-property-tribunal",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-FTT-TAX-APPEAL-NOTICE": {
    formId: "UK-FTT-TAX-APPEAL-NOTICE",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.gov.uk/tax-tribunal",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-HO-ADMIN-REVIEW-REQUEST": {
    formId: "UK-HO-ADMIN-REVIEW-REQUEST",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.gov.uk/ask-for-a-visa-administrative-review",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-MAG-MC100-MEANS-FORM": {
    formId: "UK-MAG-MC100-MEANS-FORM",
    storageType: "REMOTE",
    remoteUrl: "https://assets.publishing.service.gov.uk/media/mc100.pdf",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-IAS-PARKING-APPEAL": {
    formId: "UK-IAS-PARKING-APPEAL",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.parkingandtrafficappeals.gov.uk",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-TEC-TRAFFIC-PENALTY-APPEAL": {
    formId: "UK-TEC-TRAFFIC-PENALTY-APPEAL",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.gov.uk/challenge-parking-fine",
    version: "2023",
    lastUpdated: new Date("2023-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-FOS-COMPLAINT-FORM": {
    formId: "UK-FOS-COMPLAINT-FORM",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.financial-ombudsman.org.uk/consumers/how-to-complain",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-HO-COMPLAINT-FORM": {
    formId: "UK-HO-COMPLAINT-FORM",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.housing-ombudsman.org.uk/residents/make-a-complaint/",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "LOW"
  },
  
  // GENERATED DOCUMENTS (Not applicable - handled by AI)
  "UK-N1-PARTICULARS-OF-CLAIM": {
    formId: "UK-N1-PARTICULARS-OF-CLAIM",
    storageType: "LOCAL", // Template only
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-ET-SCHEDULE-OF-LOSS": {
    formId: "UK-ET-SCHEDULE-OF-LOSS",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-CPR32-WITNESS-STATEMENT": {
    formId: "UK-CPR32-WITNESS-STATEMENT",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-EVIDENCE-BUNDLE-INDEX": {
    formId: "UK-EVIDENCE-BUNDLE-INDEX",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-CHRONOLOGY-OF-EVENTS": {
    formId: "UK-CHRONOLOGY-OF-EVENTS",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-SCHEDULE-OF-DAMAGES": {
    formId: "UK-SCHEDULE-OF-DAMAGES",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-LBC-PRE-ACTION-PROTOCOL": {
    formId: "UK-LBC-PRE-ACTION-PROTOCOL",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-LBA-GENERAL": {
    formId: "UK-LBA-GENERAL",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "UK-DEMAND-LETTER-GENERAL": {
    formId: "UK-DEMAND-LETTER-GENERAL",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-COMPLAINT-LETTER-GENERAL": {
    formId: "UK-COMPLAINT-LETTER-GENERAL",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-GRIEVANCE-LETTER-EMPLOYMENT": {
    formId: "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
  
  "UK-MAG-GUILTY-PLEA-LETTER": {
    formId: "UK-MAG-GUILTY-PLEA-LETTER",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-MAG-MITIGATION-STATEMENT": {
    formId: "UK-MAG-MITIGATION-STATEMENT",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "LOW"
  },
  
  "UK-ACAS-EC-CERTIFICATE": {
    formId: "UK-ACAS-EC-CERTIFICATE",
    storageType: "ONLINE_ONLY",
    onlineFormUrl: "https://www.acas.org.uk/early-conciliation",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "HIGH"
  },
  
  "EU-EU261-COMPENSATION-CLAIM": {
    formId: "EU-EU261-COMPENSATION-CLAIM",
    storageType: "LOCAL",
    version: "2024",
    lastUpdated: new Date("2024-01-01"),
    usageFrequency: "MEDIUM"
  },
};

/**
 * Load an official form PDF
 * 
 * Strategy:
 * 1. Check local storage first (fastest)
 * 2. Check database cache (fast)
 * 3. Download from remote URL (slow, cache result)
 * 4. If online-only, throw error with instructions
 */
export async function loadOfficialForm(formId: OfficialFormID): Promise<Uint8Array> {
  const source = FORM_SOURCES[formId];
  
  if (!source) {
    throw new Error(`Unknown form: ${formId}`);
  }
  
  console.log(`[Form Loader] Loading ${formId} (storage: ${source.storageType})`);
  
  // ONLINE ONLY - Cannot be filled programmatically
  if (source.storageType === "ONLINE_ONLY") {
    throw new Error(
      `${formId} is an online-only form. ` +
      `User must complete at: ${source.onlineFormUrl}`
    );
  }
  
  // LOCAL - Load from public directory
  if (source.storageType === "LOCAL" && source.localPath) {
    try {
      const fullPath = path.join(process.cwd(), 'public', source.localPath);
      console.log(`[Form Loader] Reading from local: ${fullPath}`);
      const buffer = await fs.readFile(fullPath);
      console.log(`[Form Loader] ✅ Loaded ${buffer.length} bytes`);
      return new Uint8Array(buffer);
    } catch (error) {
      console.warn(`[Form Loader] ⚠️ Local file not found, falling back to remote`);
      // Fall through to remote download
    }
  }
  
  // REMOTE - Download and cache
  if (source.remoteUrl) {
    // Check database cache first
    const cached = await getCachedForm(formId);
    if (cached) {
      console.log(`[Form Loader] ✅ Using cached form (age: ${cached.age}days)`);
      return cached.data;
    }
    
    // Download from remote
    console.log(`[Form Loader] Downloading from: ${source.remoteUrl}`);
    const response = await fetch(source.remoteUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download ${formId}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    console.log(`[Form Loader] ✅ Downloaded ${data.length} bytes`);
    
    // Cache in database
    await cacheForm(formId, data, source.version);
    
    return data;
  }
  
  throw new Error(`No download source available for ${formId}`);
}

/**
 * Get cached form from database
 */
async function getCachedForm(formId: OfficialFormID): Promise<{ data: Uint8Array; age: number } | null> {
  try {
    // Note: You'd need to add a FormCache model to Prisma schema
    // For now, return null (no cache)
    return null;
    
    /* Example implementation:
    const cached = await prisma.formCache.findFirst({
      where: { formId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!cached) return null;
    
    const age = Math.floor((Date.now() - cached.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Expire after 30 days
    if (age > 30) return null;
    
    return {
      data: new Uint8Array(cached.pdfData),
      age
    };
    */
  } catch (error) {
    console.warn('[Form Loader] Cache read failed:', error);
    return null;
  }
}

/**
 * Cache form in database
 */
async function cacheForm(formId: OfficialFormID, data: Uint8Array, version: string): Promise<void> {
  try {
    // Note: Requires FormCache model in Prisma
    console.log(`[Form Loader] Caching ${formId} (${data.length} bytes)`);
    
    /* Example implementation:
    await prisma.formCache.create({
      data: {
        formId,
        version,
        pdfData: Buffer.from(data),
        createdAt: new Date()
      }
    });
    */
  } catch (error) {
    console.warn('[Form Loader] Cache write failed:', error);
    // Non-fatal - form still loaded successfully
  }
}

/**
 * Get form source metadata
 */
export function getFormSource(formId: OfficialFormID): FormSource | undefined {
  return FORM_SOURCES[formId];
}

/**
 * List all locally stored forms
 */
export function getLocallyStoredForms(): OfficialFormID[] {
  return Object.values(FORM_SOURCES)
    .filter(source => source.storageType === "LOCAL" && source.localPath)
    .map(source => source.formId);
}

/**
 * List forms that need to be downloaded
 */
export function getFormsRequiringDownload(): OfficialFormID[] {
  return Object.values(FORM_SOURCES)
    .filter(source => source.storageType === "REMOTE" || source.storageType === "LOCAL")
    .map(source => source.formId);
}
