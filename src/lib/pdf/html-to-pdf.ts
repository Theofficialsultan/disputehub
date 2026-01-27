/**
 * PDF Generation Engine (Block 3C)
 * 
 * Production-grade HTML → PDF conversion using external API
 * 
 * IMPORTANT:
 * This uses PDFShift API (https://pdfshift.io)
 * Alternative options: DocRaptor, API2PDF, HTML2PDF.it
 * 
 * Setup Required:
 * 1. Sign up at https://pdfshift.io
 * 2. Add API key to .env: PDF_API_KEY=your_key_here
 * 
 * For development/testing without API key:
 * - Set PDF_API_MODE=mock in .env
 * - System will generate placeholder PDFs
 */

import got from "got";

const PDF_API_KEY = process.env.PDF_API_KEY;
const PDF_API_MODE = process.env.PDF_API_MODE || "production"; // 'production' or 'mock'
const PDF_API_ENDPOINT = "https://api.pdfshift.io/v3/convert/pdf";

/**
 * Convert HTML to PDF using PDFShift API
 * 
 * @param html - Complete HTML document with styles
 * @returns PDF as Buffer
 */
export async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // Mock mode for development/testing
  if (PDF_API_MODE === "mock" || !PDF_API_KEY) {
    console.warn("⚠️ PDF_API_MODE=mock - Generating placeholder PDF");
    return generateMockPDF(html);
  }

  try {
    const response = await got.post(PDF_API_ENDPOINT, {
      username: PDF_API_KEY,
      password: "", // PDFShift uses basic auth with API key as username
      json: {
        source: html,
        landscape: false,
        use_print: false,
        format: "A4",
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
      },
      responseType: "buffer",
      timeout: {
        request: 30000, // 30 second timeout
      },
    });

    return response.body;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
    throw new Error("PDF generation failed with unknown error");
  }
}

/**
 * Generate mock PDF for testing without API key
 * Creates a simple but valid PDF with visible content
 */
function generateMockPDF(html: string): Buffer {
  // Extract text content from HTML, preserving paragraphs
  let textContent = html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<\/p>/gi, "\n\n") // Preserve paragraph breaks
    .replace(/<br\s*\/?>/gi, "\n") // Preserve line breaks
    .replace(/<\/div>/gi, "\n") // Preserve div breaks
    .replace(/<\/h[1-6]>/gi, "\n\n") // Preserve heading breaks
    .replace(/<li>/gi, "\n• ") // Convert list items
    .replace(/<[^>]+>/g, "") // Remove remaining tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/ +/g, " ") // Collapse multiple spaces (but keep newlines!)
    .trim();

  // Limit content and split into lines for PDF
  textContent = textContent.substring(0, 3000);
  const lines = textContent.split("\n").filter(line => line.trim());

  // Escape special PDF characters for each line
  const escapedLines = lines.map(line => 
    line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .substring(0, 90) // Max ~90 chars per line for readability
  );

  // Build PDF text stream with proper line positioning
  let yPosition = 800;
  const lineHeight = 14;
  let pdfTextStream = "BT\n/F1 10 Tf\n";
  
  for (const line of escapedLines.slice(0, 50)) { // Max 50 lines
    if (yPosition < 50) break; // Stop if we reach bottom of page
    pdfTextStream += `50 ${yPosition} Td\n(${line}) Tj\n0 -${lineHeight} Td\n`;
    yPosition -= lineHeight;
  }
  
  pdfTextStream += "ET";

  // Create a proper PDF with embedded font
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${pdfTextStream.length} >>
stream
${pdfTextStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000260 00000 n 
0000000${(360 + pdfTextStream.length).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${410 + pdfTextStream.length}
%%EOF`;

  return Buffer.from(pdfContent, "utf-8");
}

/**
 * Generate complete HTML document from content
 * Applies UK legal document styling
 */
export function wrapHTMLDocument(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    
    .document {
      max-width: 100%;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 20pt;
    }
    
    .address-block {
      margin-bottom: 12pt;
      line-height: 1.4;
    }
    
    .date {
      margin-bottom: 20pt;
      font-weight: normal;
    }
    
    .salutation {
      margin-bottom: 12pt;
    }
    
    .subject {
      font-weight: bold;
      margin-bottom: 12pt;
    }
    
    .body p {
      margin: 0 0 12pt 0;
      text-align: justify;
    }
    
    .closing {
      margin-top: 20pt;
      margin-bottom: 40pt;
    }
    
    .signature {
      margin-top: 40pt;
    }
    
    .list-item {
      margin: 8pt 0;
      padding-left: 20pt;
      text-indent: -20pt;
    }
    
    .section-title {
      font-weight: bold;
      font-size: 14pt;
      margin: 20pt 0 12pt 0;
      text-align: center;
    }
    
    .form-field {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200pt;
      margin: 0 4pt;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8pt;
      text-align: left;
    }
    
    th {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    
    /* Phase 8.5 - Evidence Schedule Styles */
    .evidence-item {
      margin: 20pt 0;
      page-break-inside: avoid;
    }
    
    .evidence-header {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 8pt;
      color: #000;
    }
    
    .evidence-metadata {
      width: 100%;
      margin: 8pt 0;
      border: none;
    }
    
    .evidence-metadata td {
      border: none;
      padding: 4pt 8pt;
      vertical-align: top;
    }
    
    .evidence-metadata td:first-child {
      width: 120pt;
      font-weight: normal;
    }
    
    .evidence-content {
      margin: 12pt 0;
      text-align: center;
    }
    
    .evidence-separator {
      border-bottom: 1px solid #ccc;
      margin: 16pt 0;
    }
  </style>
</head>
<body>
  <div class="document">
    ${content}
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format text to HTML paragraphs
 */
export function textToHTML(text: string): string {
  return text
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHTML(p.trim())}</p>`)
    .join("\n");
}

/**
 * Format array to HTML list
 */
export function arrayToHTMLList(items: string[]): string {
  return items
    .map(
      (item, idx) =>
        `<div class="list-item">${idx + 1}. ${escapeHTML(item)}</div>`
    )
    .join("\n");
}
