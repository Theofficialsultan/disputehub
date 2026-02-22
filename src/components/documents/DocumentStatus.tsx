"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GenerateButton } from "./GenerateButton";

interface Document {
  id: string;
  type: string;
  title: string;
  content: string;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  createdAt: string;
  retryCount?: number;
  lastError?: string | null;
}

interface DocumentPlan {
  id: string;
  complexity: string;
  complexityScore: number;
  documentType: string;
  routingStatus?: string;
  routingConfidence?: number;
  jurisdiction?: string;
  forum?: string;
  blockType?: string | null;
  nextAction?: string | null;
}

interface DocumentStatusProps {
  caseId: string;
}

export function DocumentStatus({ caseId }: DocumentStatusProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [plan, setPlan] = useState<DocumentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setPlan(data.plan || null);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  // Auto-poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadDocuments();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [caseId]);

  // Calculate progress
  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === "COMPLETED").length;
  const failedDocs = documents.filter(d => d.status === "FAILED").length;
  const generatingDocs = documents.filter(d => d.status === "GENERATING" || d.status === "PENDING").length;
  const progressPercent = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

  const handleDownload = async (doc: Document) => {
    try {
      // Convert content to HTML with embedded images
      let htmlContent = convertToHTML(doc);
      
      // If it's an evidence bundle, fetch and embed images
      if (doc.type === 'evidence_bundle') {
        htmlContent = await embedImagesInHTML(doc.content, caseId);
      }
      
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${doc.title}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  // Convert plain text content to professional legal HTML
  const convertToHTML = (doc: Document) => {
    const lines = doc.content.split('\n');
    const htmlParts: string[] = [];
    let inList = false;
    let listType: 'ol' | 'ul' | null = null;
    let currentParagraph: string[] = [];
    
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          htmlParts.push(`<p>${escapeHtml(text)}</p>`);
        }
        currentParagraph = [];
      }
    };
    
    const closeList = () => {
      if (inList && listType) {
        htmlParts.push(listType === 'ol' ? '</ol>' : '</ul>');
        inList = false;
        listType = null;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines - they end paragraphs
      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }
      
      // Main section headers: ═══════════════════════════════
      if (/^═{5,}$/.test(trimmed)) {
        flushParagraph();
        closeList();
        // Look for title on next line
        if (i + 1 < lines.length && lines[i + 1].trim() && !/^[═─]/.test(lines[i + 1].trim())) {
          const title = lines[i + 1].trim();
          // Check if there's a closing line of ═
          if (i + 2 < lines.length && /^═{5,}$/.test(lines[i + 2].trim())) {
            htmlParts.push(`<h1 class="main-title">${escapeHtml(title)}</h1>`);
            i += 2; // Skip title and closing line
            continue;
          }
        }
        // Just a decorative line
        htmlParts.push('<hr class="section-divider" />');
        continue;
      }
      
      // Sub-section headers: ───────────────────────────────
      if (/^─{5,}$/.test(trimmed)) {
        flushParagraph();
        closeList();
        // Look for title on next line
        if (i + 1 < lines.length && lines[i + 1].trim() && !/^[═─]/.test(lines[i + 1].trim())) {
          const title = lines[i + 1].trim();
          // Check if there's a closing line of ─
          if (i + 2 < lines.length && /^─{5,}$/.test(lines[i + 2].trim())) {
            htmlParts.push(`<h2 class="section-title">${escapeHtml(title)}</h2>`);
            i += 2; // Skip title and closing line
            continue;
          }
        }
        // Just a decorative line
        htmlParts.push('<hr class="subsection-divider" />');
        continue;
      }
      
      // Numbered items: "1." or "1.1" or "(1)" or "(a)" at start
      const numberedMatch = trimmed.match(/^(\d+\.(?:\d+)?|\(\d+\)|\([a-z]\))\s+(.+)$/i);
      if (numberedMatch) {
        flushParagraph();
        if (!inList || listType !== 'ol') {
          closeList();
          htmlParts.push('<ol class="legal-list">');
          inList = true;
          listType = 'ol';
        }
        htmlParts.push(`<li><span class="list-marker">${escapeHtml(numberedMatch[1])}</span> ${escapeHtml(numberedMatch[2])}</li>`);
        continue;
      }
      
      // Bullet points: •, ☐, ☒, -, *
      const bulletMatch = trimmed.match(/^([•☐☒\-\*])\s+(.+)$/);
      if (bulletMatch) {
        flushParagraph();
        if (!inList || listType !== 'ul') {
          closeList();
          htmlParts.push('<ul class="bullet-list">');
          inList = true;
          listType = 'ul';
        }
        const checkClass = bulletMatch[1] === '☒' ? ' class="checked"' : bulletMatch[1] === '☐' ? ' class="unchecked"' : '';
        htmlParts.push(`<li${checkClass}>${escapeHtml(bulletMatch[2])}</li>`);
        continue;
      }
      
      // ALL CAPS lines (likely headings)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed) && !/^\d/.test(trimmed)) {
        flushParagraph();
        closeList();
        // Check if it looks like a section header
        if (trimmed.includes(':') || trimmed.length < 60) {
          htmlParts.push(`<h3 class="subsection-heading">${escapeHtml(trimmed)}</h3>`);
        } else {
          htmlParts.push(`<p class="emphasis">${escapeHtml(trimmed)}</p>`);
        }
        continue;
      }
      
      // Signature/form lines: _______ or [User to complete]
      if (/_{5,}/.test(trimmed) || /\[.*to complete.*\]/i.test(trimmed)) {
        flushParagraph();
        closeList();
        htmlParts.push(`<p class="form-field">${escapeHtml(trimmed)}</p>`);
        continue;
      }
      
      // Indented content (starts with spaces/tabs)
      if (/^\s{3,}/.test(line) && !numberedMatch && !bulletMatch) {
        flushParagraph();
        closeList();
        htmlParts.push(`<p class="indented">${escapeHtml(trimmed)}</p>`);
        continue;
      }
      
      // Regular text - accumulate into paragraph
      closeList();
      currentParagraph.push(trimmed);
    }
    
    // Flush remaining content
    flushParagraph();
    closeList();
    
    const htmlBody = htmlParts.join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 50px 60px;
      color: #000000;
      background: #ffffff;
    }
    
    /* Document Header */
    .document-header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 25px;
      border-bottom: 3px double #000;
    }
    
    .document-title {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 0 0 12px 0;
    }
    
    .document-subtitle {
      font-size: 11pt;
      color: #333;
      margin: 5px 0;
      font-style: italic;
    }
    
    /* Main Titles (from ═══ blocks) */
    h1.main-title {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      margin: 35px 0 25px 0;
      padding: 15px 20px;
      border: 2px solid #000;
      background: #f8f8f8;
      letter-spacing: 1px;
    }
    
    /* Section Titles (from ─── blocks) */
    h2.section-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 30px 0 18px 0;
      padding: 12px 0;
      border-top: 2px solid #000;
      border-bottom: 1px solid #000;
      text-align: center;
      letter-spacing: 0.5px;
    }
    
    /* Subsection headings (ALL CAPS lines) */
    h3.subsection-heading {
      font-size: 12pt;
      font-weight: bold;
      margin: 25px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #666;
    }
    
    /* Divider lines */
    hr.section-divider {
      border: none;
      border-top: 3px double #000;
      margin: 30px 0;
    }
    
    hr.subsection-divider {
      border: none;
      border-top: 1px solid #666;
      margin: 20px 0;
    }
    
    /* Paragraphs */
    p {
      margin: 0 0 14pt 0;
      text-align: justify;
      text-indent: 0;
    }
    
    p.emphasis {
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    
    p.indented {
      margin-left: 40px;
      margin-bottom: 10pt;
    }
    
    p.form-field {
      font-family: 'Courier New', monospace;
      background: #fafafa;
      padding: 8px 12px;
      border: 1px dashed #ccc;
      margin: 10px 0;
    }
    
    /* Ordered Lists (numbered items) */
    ol.legal-list {
      list-style: none;
      padding: 0;
      margin: 15px 0;
      counter-reset: none;
    }
    
    ol.legal-list li {
      margin: 12px 0;
      padding-left: 45px;
      position: relative;
      text-align: justify;
    }
    
    ol.legal-list li .list-marker {
      position: absolute;
      left: 0;
      font-weight: bold;
      min-width: 40px;
    }
    
    /* Unordered Lists (bullet points) */
    ul.bullet-list {
      list-style: none;
      padding: 0;
      margin: 15px 0 15px 25px;
    }
    
    ul.bullet-list li {
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    
    ul.bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    ul.bullet-list li.checked::before {
      content: "☒";
    }
    
    ul.bullet-list li.unchecked::before {
      content: "☐";
    }
    
    /* Signature Block */
    .signature-block {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      width: 280px;
      margin: 50px 0 8px 0;
    }
    
    .signature-label {
      font-size: 10pt;
      color: #333;
    }
    
    /* Footer */
    .document-footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #999;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    
    /* Evidence Images */
    .evidence-image {
      max-width: 100%;
      height: auto;
      border: 1px solid #ccc;
      margin: 15px 0;
      display: block;
    }
    
    .evidence-ref {
      background: #f0f0f0;
      padding: 8px 12px;
      margin: 20px 0 10px 0;
      border-left: 4px solid #333;
    }
    
    /* Print optimization */
    @media print {
      body {
        padding: 0;
        max-width: none;
        box-shadow: none;
      }
      
      .document-header {
        margin-top: 0;
      }
      
      h1.main-title,
      h2.section-title,
      h3.subsection-heading {
        page-break-after: avoid;
      }
      
      ol.legal-list li,
      ul.bullet-list li {
        page-break-inside: avoid;
      }
      
      .signature-block {
        page-break-inside: avoid;
      }
    }
    
    /* Screen display */
    @media screen {
      body {
        box-shadow: 0 2px 20px rgba(0,0,0,0.15);
        margin: 30px auto;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <h1 class="document-title">${escapeHtml(doc.title)}</h1>
    <p class="document-subtitle">
      Generated: ${new Date(doc.createdAt).toLocaleDateString('en-GB', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      })}
    </p>
  </div>
  
  <div class="document-body">
    ${htmlBody}
  </div>
  
  <div class="document-footer">
    <p>This document was prepared using DisputeHub Legal Document System</p>
    <p>Document Reference: ${doc.id.slice(0, 12).toUpperCase()}</p>
  </div>
</body>
</html>`;
  };

  // Embed images for evidence bundles
  const embedImagesInHTML = async (content: string, caseId: string) => {
    try {
      // Fetch evidence items to get image URLs
      const response = await fetch(`/api/disputes/${caseId}/evidence`);
      if (!response.ok) return convertToHTML({ ...documents[0], content });
      
      const { evidence } = await response.json();
      const images = evidence.filter((e: any) => e.fileType?.startsWith('image/'));
      
      if (images.length === 0) return convertToHTML({ ...documents[0], content });
      
      // Replace [IMAGE REFERENCE: url] with actual embedded images
      let htmlContent = content;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageHTML = `
        <div class="evidence-ref">
          <strong>EXHIBIT E${evidence.indexOf(img) + 1}: ${img.fileName}</strong>
        </div>
        <img src="${img.fileUrl}" alt="${img.fileName}" class="evidence-image" />
        <p style="font-size: 0.875rem; color: #6b7280; font-style: italic;">
          ${img.description || 'Evidence photograph'}
        </p>`;
        
        // Replace the reference marker with the actual image
        const marker = `[IMAGE REFERENCE: ${img.fileUrl}]`;
        htmlContent = htmlContent.replace(marker, imageHTML);
      }
      
      return convertToHTML({ 
        id: documents[0].id,
        type: 'evidence_bundle',
        title: 'Evidence Bundle',
        content: htmlContent,
        status: 'COMPLETED',
        createdAt: documents[0].createdAt
      });
      
    } catch (error) {
      console.error("Failed to embed images:", error);
      return convertToHTML({ ...documents[0], content });
    }
  };

  const handleRetry = async (docId: string) => {
    setRetrying(docId);
    toast.loading("Retrying document generation...");
    
    try {
      const response = await fetch(`/api/documents/${docId}/retry`, {
        method: "POST",
      });

      if (response.ok) {
        toast.dismiss();
        toast.success("Retry started! Document will regenerate shortly.");
        await loadDocuments();
      } else {
        throw new Error("Retry failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to retry. Please try again.");
    } finally {
      setRetrying(null);
    }
  };

  // Phase 8.5-8.7: Routing status indicators
  const routingStatusColors = {
    PENDING: "text-yellow-700 bg-yellow-50 border-yellow-200",
    APPROVED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    BLOCKED: "text-red-700 bg-red-50 border-red-200",
    REQUIRES_CLARIFICATION: "text-orange-700 bg-orange-50 border-orange-200",
  };

  const isBlocked = plan?.routingStatus === "BLOCKED";

  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Documents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? (
                "Loading..."
              ) : totalDocs === 0 ? (
                "Your case documents will appear here"
              ) : generatingDocs > 0 ? (
                `Generating ${generatingDocs} of ${totalDocs}...`
              ) : (
                `${completedDocs} of ${totalDocs} ready`
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Generate Button (DEV/TEST) */}
            <GenerateButton 
              caseId={caseId}
              onGenerated={loadDocuments}
            />
            
            {plan && (
              <div className="text-right">
                <div className="text-xs font-medium text-blue-600">
                  {plan.complexity}
                </div>
                <div className="text-xs text-slate-500">
                  Score: {plan.complexityScore}/100
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase 8.5-8.7: Routing Status */}
        {plan?.routingStatus && (
          <div className="mt-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${routingStatusColors[plan.routingStatus as keyof typeof routingStatusColors] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
              <span className="font-semibold">Route:</span>
              {plan.routingStatus}
              {plan.routingConfidence && ` (${Math.round(plan.routingConfidence * 100)}%)`}
            </div>
            {plan.jurisdiction && plan.forum && (
              <p className="text-xs text-slate-500 mt-2">
                {plan.jurisdiction} → {plan.forum}
              </p>
            )}
          </div>
        )}

        {/* Phase 8.5-8.7: BLOCKED State Warning */}
        {isBlocked && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Document Generation Blocked
                </h4>
                <p className="text-xs text-red-700 mb-2">
                  {plan.blockType === "MISSING_PREREQUISITE" && "Missing required prerequisites"}
                  {plan.blockType === "TIME_LIMIT_EXPIRED" && "Time limit has expired"}
                  {plan.blockType === "INSUFFICIENT_INFORMATION" && "More information needed"}
                  {plan.blockType === "INVALID_ROUTE" && "Invalid legal route"}
                  {!plan.blockType && "Unable to proceed with document generation"}
                </p>
                {plan.nextAction && (
                  <p className="text-xs text-red-800 font-medium">
                    Next Step: {plan.nextAction}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalDocs > 0 && generatingDocs > 0 && (
          <div className="mt-4">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">
              {completedDocs} completed • {generatingDocs} generating • {failedDocs} failed
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-slate-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-slate-700 mb-1">No Documents Yet</p>
            <p className="text-xs text-slate-500">
              Continue chatting with the AI to build your case
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group"
                onClick={() => doc.status === "COMPLETED" && handleDownload(doc)}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {doc.status === "COMPLETED" && (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  )}
                  {(doc.status === "GENERATING" || doc.status === "PENDING") && (
                    <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  {doc.status === "FAILED" && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.status === "COMPLETED" && "Click to view & download"}
                    {doc.status === "GENERATING" && "Generating content..."}
                    {doc.status === "PENDING" && "Waiting to generate..."}
                    {doc.status === "FAILED" && (
                      <>
                        Failed{doc.retryCount ? ` (${doc.retryCount} retries)` : ""}
                        {doc.lastError && (
                          <span className="block text-xs text-red-600 mt-1 truncate">
                            {doc.lastError}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-1">
                  {doc.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-slate-100"
                      title="Download HTML"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {doc.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(doc.id);
                      }}
                      disabled={retrying === doc.id}
                      className="text-orange-600 hover:text-orange-700 hover:bg-slate-100"
                    >
                      <RefreshCw className={`h-4 w-4 ${retrying === doc.id ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
