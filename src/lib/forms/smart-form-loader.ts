/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMART FORM LOADER - PRODUCTION ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles intelligent form loading with fallbacks and caching:
 * 
 * 1. LOCAL_CACHED → read from disk (fastest)
 * 2. DIRECT_PDF → download and cache
 * 3. GOVUK_REDIRECT → provide GOV.UK link
 * 4. ONLINE_ONLY → provide online portal link
 * 
 * NEVER FAILS on URL changes - always has a fallback.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import {
  OFFICIAL_FORMS_REGISTRY,
  getFormMetadata,
  getGovUKPage,
  getOnlinePortalUrl,
  type FetchStrategy
} from '@/lib/legal/official-forms-registry';

/**
 * Result of form loading operation
 */
export interface FormLoadResult {
  success: boolean;
  data?: Uint8Array;
  errorType?: "ONLINE_ONLY" | "GOVUK_REDIRECT" | "NOT_FOUND" | "DOWNLOAD_FAILED" | "CACHE_MISS";
  message: string;
  fallbackUrl?: string;
  formCode: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN FORM LOADER
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Load an official form PDF
 * 
 * Strategy:
 * 1. LOCAL_CACHED → load from public/official-forms/
 * 2. DIRECT_PDF → download from verified URL
 * 3. GOVUK_REDIRECT → return GOV.UK page link
 * 4. ONLINE_ONLY → return online portal link
 */
export async function loadOfficialForm(formCode: string): Promise<FormLoadResult> {
  console.log(`[Form Loader] 📄 Loading form: ${formCode}`);
  
  const form = getFormMetadata(formCode);
  
  if (!form) {
    return {
      success: false,
      errorType: "NOT_FOUND",
      message: `Unknown form: ${formCode}`,
      formCode
    };
  }
  
  console.log(`[Form Loader] Strategy: ${form.fetchStrategy}`);
  
  // Handle based on fetch strategy
  switch (form.fetchStrategy) {
    case "LOCAL_CACHED":
      return await loadLocalCachedForm(formCode, form.localCachePath!);
    
    case "DIRECT_PDF":
      return await loadDirectPdfForm(formCode, form.directPdfUrl!);
    
    case "GOVUK_REDIRECT":
      return {
        success: false,
        errorType: "GOVUK_REDIRECT",
        message: `Form ${formCode} must be downloaded from GOV.UK to ensure you have the latest version.`,
        fallbackUrl: form.govukPage,
        formCode
      };
    
    case "ONLINE_ONLY":
      return {
        success: false,
        errorType: "ONLINE_ONLY",
        message: `Form ${formCode} is online-only. Please complete at the official portal.`,
        fallbackUrl: form.onlinePortalUrl || form.govukPage,
        formCode
      };
    
    default:
      return {
        success: false,
        errorType: "NOT_FOUND",
        message: `No loading strategy defined for ${formCode}`,
        fallbackUrl: form.govukPage,
        formCode
      };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY IMPLEMENTATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Load form from local cache
 */
async function loadLocalCachedForm(formCode: string, localPath: string): Promise<FormLoadResult> {
  try {
    const fullPath = path.join(process.cwd(), localPath);
    console.log(`[Form Loader] 📁 Reading from: ${fullPath}`);
    
    const buffer = await fs.readFile(fullPath);
    const data = new Uint8Array(buffer);
    
    console.log(`[Form Loader] ✅ Loaded ${data.length.toLocaleString()} bytes`);
    
    return {
      success: true,
      data,
      message: `Successfully loaded ${formCode} from local cache`,
      formCode
    };
  } catch (error) {
    console.warn(`[Form Loader] ⚠️ Local cache miss for ${formCode}`);
    
    // Fallback to GOV.UK
    const govukPage = getGovUKPage(formCode);
    return {
      success: false,
      errorType: "CACHE_MISS",
      message: `Local cache unavailable for ${formCode}. Please download from GOV.UK.`,
      fallbackUrl: govukPage,
      formCode
    };
  }
}

/**
 * Load form by downloading from direct PDF URL
 */
async function loadDirectPdfForm(formCode: string, pdfUrl: string): Promise<FormLoadResult> {
  try {
    console.log(`[Form Loader] 🌐 Downloading from: ${pdfUrl}`);
    
    const data = await downloadPdf(pdfUrl);
    
    console.log(`[Form Loader] ✅ Downloaded ${data.length.toLocaleString()} bytes`);
    
    // Optionally cache to disk for future use
    await cacheFormToDisk(formCode, data);
    
    return {
      success: true,
      data,
      message: `Successfully downloaded ${formCode}`,
      formCode
    };
  } catch (error) {
    console.error(`[Form Loader] ❌ Download failed for ${formCode}:`, error);
    
    // Fallback to GOV.UK
    const govukPage = getGovUKPage(formCode);
    return {
      success: false,
      errorType: "DOWNLOAD_FAILED",
      message: `Unable to download ${formCode}. The PDF URL may have changed. Please download from GOV.UK.`,
      fallbackUrl: govukPage,
      formCode
    };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UTILITY FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Download PDF from URL with redirect handling
 */
function downloadPdf(url: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`[Form Loader] ↪️ Redirecting to: ${redirectUrl}`);
          downloadPdf(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      // Handle errors
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      // Collect data
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(new Uint8Array(buffer));
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Cache downloaded form to disk for future use
 */
async function cacheFormToDisk(formCode: string, data: Uint8Array): Promise<void> {
  try {
    const form = getFormMetadata(formCode);
    if (!form?.localCachePath) return;
    
    const fullPath = path.join(process.cwd(), form.localCachePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, Buffer.from(data));
    
    console.log(`[Form Loader] 💾 Cached to: ${fullPath}`);
  } catch (error) {
    console.warn(`[Form Loader] ⚠️ Failed to cache ${formCode}:`, error);
    // Non-fatal - form still loaded successfully
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USER-FACING HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get user-friendly instructions for a form
 */
export function getFormInstructions(formCode: string): {
  title: string;
  description: string;
  action: "DOWNLOAD_PDF" | "VISIT_GOVUK" | "VISIT_ONLINE_PORTAL" | "COMING_SOON";
  url: string;
  buttonText: string;
} {
  const form = getFormMetadata(formCode);
  
  if (!form) {
    return {
      title: "Form Not Found",
      description: `We don't have information about form ${formCode}.`,
      action: "COMING_SOON",
      url: "https://www.gov.uk",
      buttonText: "Search GOV.UK"
    };
  }
  
  switch (form.fetchStrategy) {
    case "LOCAL_CACHED":
    case "DIRECT_PDF":
      return {
        title: `Download ${form.code} - ${form.name}`,
        description: `We'll fill out this form with your case details and provide it as a ready-to-submit PDF.`,
        action: "DOWNLOAD_PDF",
        url: form.govukPage,
        buttonText: "Generate Filled Form"
      };
    
    case "GOVUK_REDIRECT":
      return {
        title: `${form.code} - ${form.name}`,
        description: `This form is updated frequently by ${form.authority}. Download the latest version from GOV.UK.`,
        action: "VISIT_GOVUK",
        url: form.govukPage,
        buttonText: "Download from GOV.UK"
      };
    
    case "ONLINE_ONLY":
      return {
        title: `${form.code} - ${form.name}`,
        description: `This ${form.authority} service is online-only. We'll guide you through the process.`,
        action: "VISIT_ONLINE_PORTAL",
        url: form.onlinePortalUrl || form.govukPage,
        buttonText: "Go to Online Service"
      };
    
    default:
      return {
        title: form.name,
        description: "This form is not yet available in DisputeHub.",
        action: "COMING_SOON",
        url: form.govukPage,
        buttonText: "View on GOV.UK"
      };
  }
}

/**
 * Check if form can be auto-filled
 */
export function canAutoFillForm(formCode: string): boolean {
  const form = getFormMetadata(formCode);
  return form?.fetchStrategy === "LOCAL_CACHED" || form?.fetchStrategy === "DIRECT_PDF";
}

/**
 * Get all forms that DisputeHub can auto-fill
 */
export function getAutoFillableForms(): string[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.fetchStrategy === "LOCAL_CACHED" || form.fetchStrategy === "DIRECT_PDF")
    .map(form => form.code);
}

/**
 * Get form status summary for admin/debugging
 */
export function getFormStatusSummary(): {
  totalForms: number;
  cachedLocally: number;
  directPdf: number;
  govukRedirect: number;
  onlineOnly: number;
  autoFillable: number;
} {
  const forms = Object.values(OFFICIAL_FORMS_REGISTRY);
  
  return {
    totalForms: forms.length,
    cachedLocally: forms.filter(f => f.fetchStrategy === "LOCAL_CACHED").length,
    directPdf: forms.filter(f => f.fetchStrategy === "DIRECT_PDF").length,
    govukRedirect: forms.filter(f => f.fetchStrategy === "GOVUK_REDIRECT").length,
    onlineOnly: forms.filter(f => f.fetchStrategy === "ONLINE_ONLY").length,
    autoFillable: forms.filter(f => f.fetchStrategy === "LOCAL_CACHED" || f.fetchStrategy === "DIRECT_PDF").length
  };
}
