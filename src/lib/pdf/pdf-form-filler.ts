/**
 * PDF FORM FILLING SERVICE
 * 
 * Downloads official UK legal forms (PDFs) and fills them with case data.
 * Uses pdf-lib to manipulate PDFs and populate form fields.
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib';
import type { CaseStrategy, EvidenceItem } from "@prisma/client";
import type { OfficialFormID } from "@/lib/legal/form-registry";
import type { RoutingDecision } from "@/lib/legal/routing-types";
import { getOfficialPdfUrl, isFormFillablePDF } from "@/lib/legal/form-types";
import { getComprehensiveFieldMappings, type FormFieldMapping } from "./comprehensive-field-mappings";

/**
 * Download and fill an official PDF form
 */
export async function fillOfficialPdfForm(
  formId: OfficialFormID,
  strategy: CaseStrategy,
  routingDecision: RoutingDecision,
  evidence: EvidenceItem[],
  userDetails?: {
    fullName?: string;
    address?: string;
    postcode?: string;
    phone?: string;
    email?: string;
  }
): Promise<Uint8Array> {
  
  // Verify this is a fillable PDF
  if (!isFormFillablePDF(formId)) {
    throw new Error(`${formId} is not a fillable PDF form. Use document generation instead.`);
  }
  
  // Get official PDF URL
  const pdfUrl = getOfficialPdfUrl(formId);
  
  if (!pdfUrl) {
    throw new Error(`No official PDF URL found for ${formId}. May need to be downloaded manually.`);
  }
  
  console.log(`[PDF Filler] Downloading official form from: ${pdfUrl}`);
  
  // Download the official blank form
  const response = await fetch(pdfUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }
  
  const pdfBytes = await response.arrayBuffer();
  
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  console.log(`[PDF Filler] PDF loaded. Fillable fields: ${form.getFields().length}`);
  
  // Get comprehensive field mappings for this form
  const fieldMappings = getComprehensiveFieldMappings(formId, strategy, routingDecision, evidence, userDetails);
  
  console.log(`[PDF Filler] Generated ${fieldMappings.length} field mappings`);
  
  // Fill the form fields
  let filledCount = 0;
  let errorCount = 0;
  
  for (const mapping of fieldMappings) {
    try {
      const field = form.getField(mapping.pdfFieldName);
      
      if (field instanceof PDFTextField) {
        field.setText(String(mapping.value));
        filledCount++;
      } else if (field instanceof PDFCheckBox) {
        if (mapping.value === true) {
          field.check();
        } else {
          field.uncheck();
        }
        filledCount++;
      } else if (field instanceof PDFRadioGroup) {
        field.select(String(mapping.value));
        filledCount++;
      }
      
      if (mapping.semantic) {
        console.log(`[PDF Filler] ✓ ${mapping.semantic}: ${mapping.pdfFieldName}`);
      }
    } catch (error) {
      console.warn(`[PDF Filler] ⚠️  Could not fill field "${mapping.pdfFieldName}":`, error);
      errorCount++;
      // Continue with other fields
    }
  }
  
  console.log(`[PDF Filler] 📊 Summary: ${filledCount} filled, ${errorCount} errors, ${form.getFields().length} total fields`);
  
  // Flatten the form (optional - makes it non-editable)
  // form.flatten();
  
  // Save the filled PDF
  const filledPdfBytes = await pdfDoc.save();
  
  console.log(`[PDF Filler] ✅ PDF filled successfully (${filledPdfBytes.length.toLocaleString()} bytes)`);
  
  return filledPdfBytes;
}

/**
 * Inspect a PDF and list all fillable fields
 * (Utility function for development)
 */
export async function inspectPdfFields(pdfUrl: string): Promise<string[]> {
  const response = await fetch(pdfUrl);
  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  return fields.map(field => field.getName());
}
