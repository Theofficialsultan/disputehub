"use client";

import { FileText, CheckCircle, ArrowRight, HelpCircle, Sparkles, Mail, Send } from "lucide-react";
import Link from "next/link";

interface DocumentPreview {
  name: string;
  description: string;
  whatItDoes: string;
}

interface DocumentsPreviewProps {
  forum: string;
  legalRelationship: string;
  counterparty: string;
  documents: DocumentPreview[];
  phase?: string; // "ROUTING" | "GENERATING" | "COMPLETED"
}

export function DocumentsPreview({ 
  forum, 
  legalRelationship, 
  counterparty,
  documents,
  phase = "GENERATING"
}: DocumentsPreviewProps) {
  
  const forumDisplayNames: Record<string, string> = {
    employment_tribunal: "Employment Tribunal",
    county_court_money: "County Court (Money Claims)",
    county_court_small_claims: "County Court (Small Claims)",
    high_court: "High Court",
    immigration_tribunal: "Immigration Tribunal",
    housing_tribunal: "Housing Tribunal"
  };
  
  // Dynamic titles and messages based on phase
  const phaseContent = {
    ROUTING: {
      title: "Analyzing Your Legal Route",
      subtitle: "We're determining the best legal pathway and which documents you'll need",
      progressMessage: "Analyzing jurisdiction and legal requirements..."
    },
    GENERATING: {
      title: "Your Legal Documents Are Being Prepared",
      subtitle: `We're generating professional legal documents tailored to your ${legalRelationship} case against ${counterparty}`,
      progressMessage: "Documents are being generated using advanced AI. This may take a few moments."
    },
    COMPLETED: {
      title: "Your Documents Are Ready!",
      subtitle: `All documents for your ${legalRelationship} case against ${counterparty} have been completed`,
      progressMessage: "Download your documents from the sidebar on the right."
    }
  };
  
  const content = phaseContent[phase as keyof typeof phaseContent] || phaseContent.GENERATING;

  return (
    <div className="h-full overflow-y-auto px-3 sm:px-6 py-6 sm:py-8 bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6 lg:ml-32">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-2 shadow-sm">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {content.title}
          </h1>
          <p className="text-base text-slate-600">
            {content.subtitle}
          </p>
        </div>

        {/* Legal Route Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Legal Route</h3>
              <p className="text-sm text-slate-600">
                {forumDisplayNames[forum] || forum}
              </p>
            </div>
          </div>
        </div>

        {/* Documents You'll Receive */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Documents You'll Receive
          </h2>
          
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">{doc.name}</h3>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                      <ArrowRight className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600">{doc.whatItDoes}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use Your Documents */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-slate-900">How to Use Your Documents</h2>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
                1
              </div>
              <p className="text-sm text-slate-600">Review each document carefully and ensure all information is accurate</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
                2
              </div>
              <p className="text-sm text-slate-600">Download the documents from the sidebar when they're ready</p>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                3
              </div>
              <p className="text-sm text-slate-600">Review and send the AI-drafted email from your <Link href="/email" className="text-blue-600 font-medium underline">Email page</Link> — the other party will be notified</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
                4
              </div>
              <p className="text-sm text-slate-600">Submit your documents to {forumDisplayNames[forum] || "the relevant authority"} following their filing procedures</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
                5
              </div>
              <p className="text-sm text-slate-600">Keep copies of everything for your records</p>
            </div>
          </div>
        </div>

        {/* Email Draft Ready */}
        {phase === "COMPLETED" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-slate-900">Email Draft Ready for Review</h3>
                <p className="text-sm text-slate-600">
                  AI has drafted an email to accompany your legal documents. Review it, make any changes, then send it directly from DisputeHub when you're ready.
                </p>
                <div className="flex items-center gap-2">
                  <Link 
                    href="/email"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Review Email Draft
                  </Link>
                  <span className="text-xs text-slate-500">Nothing is sent without your approval</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Need Help? */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-slate-900">Need Help or Want to Edit?</h3>
              <p className="text-sm text-slate-600">
                If you notice any issues with your documents or need to make changes, our AI Case Worker can help you make quick edits and adjustments.
              </p>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Go to AI Case Worker
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Note */}
        <div className="text-center text-xs text-slate-500 py-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {content.progressMessage}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 text-center leading-relaxed">
            <strong>⚠️ Disclaimer:</strong> These documents are generated by AI for informational purposes only. 
            DisputeHub does not provide legal advice. Please review all documents carefully before use and 
            consider consulting a qualified solicitor for complex matters.
          </p>
        </div>

      </div>
    </div>
  );
}
