/**
 * Supabase Storage Client
 * Phase 7.2 Block 3C
 * 
 * Handles PDF uploads to Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials!");
  console.error("URL:", supabaseUrl);
  console.error("Key:", supabaseServiceKey ? "Present" : "Missing");
  throw new Error(
    "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

console.log("[Supabase] Initializing client with URL:", supabaseUrl);

// Use service role key for server-side operations
export const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("[Supabase] Client initialized successfully");

/**
 * Upload PDF buffer to Supabase Storage
 * 
 * @param caseId - Case ID for folder organization
 * @param documentType - Document type for filename
 * @param pdfBuffer - PDF file as Buffer
 * @returns Public URL of uploaded file
 */
export async function uploadPDF(
  caseId: string,
  documentType: string,
  pdfBuffer: Buffer
): Promise<string> {
  const bucket = "documents"; // Supabase bucket name
  const filePath = `cases/${caseId}/documents/${documentType}_${Date.now()}.pdf`;

  const { data, error } = await supabaseStorage.storage
    .from(bucket)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabaseStorage.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete PDF from Supabase Storage
 * 
 * @param fileUrl - Full URL of file to delete
 */
export async function deletePDF(fileUrl: string): Promise<void> {
  // Extract file path from URL
  const bucket = "documents";
  const urlParts = fileUrl.split(`/${bucket}/`);
  if (urlParts.length < 2) {
    throw new Error("Invalid file URL");
  }

  const filePath = urlParts[1];

  const { error } = await supabaseStorage.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete PDF: ${error.message}`);
  }
}
