"use client";

import { FileText, CheckCircle, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
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
}

export function DocumentsPreview({ 
  forum, 
  legalRelationship, 
  counterparty,
  documents 
}: DocumentsPreviewProps) {
  
  const forumDisplayNames: Record<string, string> = {
    employment_tribunal: "Employment Tribunal",
    county_court_money: "County Court (Money Claims)",
    county_court_small_claims: "County Court (Small Claims)",
    high_court: "High Court",
    immigration_tribunal: "Immigration Tribunal",
    housing_tribunal: "Housing Tribunal"
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-6 ml-32">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-2">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Your Legal Documents Are Being Prepared
          </h1>
          <p className="text-base text-slate-300">
            We're generating professional legal documents tailored to your {legalRelationship} case against {counterparty}
          </p>
        </div>

        {/* Legal Route Card */}
        <div className="glass-strong rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">Legal Route</h3>
              <p className="text-sm text-slate-300">
                {forumDisplayNames[forum] || forum}
              </p>
            </div>
          </div>
        </div>

        {/* Documents You'll Receive */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Documents You'll Receive
          </h2>
          
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div 
                key={index}
                className="glass rounded-lg p-3 border border-slate-700 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-white">{doc.name}</h3>
                    <p className="text-xs text-slate-400">{doc.description}</p>
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-700/50">
                      <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300">{doc.whatItDoes}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use Your Documents */}
        <div className="glass-strong rounded-xl p-4 border border-slate-700 space-y-3">
          <h2 className="text-lg font-bold text-white">How to Use Your Documents</h2>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                1
              </div>
              <p className="text-sm text-slate-300">Review each document carefully and ensure all information is accurate</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                2
              </div>
              <p className="text-sm text-slate-300">Download the documents from the sidebar when they're ready</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                3
              </div>
              <p className="text-sm text-slate-300">Submit your documents to {forumDisplayNames[forum] || "the relevant authority"} following their filing procedures</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                4
              </div>
              <p className="text-sm text-slate-300">Keep copies of everything for your records</p>
            </div>
          </div>
        </div>

        {/* Need Help? */}
        <div className="glass rounded-xl p-4 border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-white">Need Help or Want to Edit?</h3>
              <p className="text-sm text-slate-300">
                If you notice any issues with your documents or need to make changes, our AI Case Worker can help you make quick edits and adjustments.
              </p>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Go to AI Case Worker
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Note */}
        <div className="text-center text-xs text-slate-400 py-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Documents are being generated using advanced AI. This may take a few moments.
          </div>
        </div>

      </div>
    </div>
  );
}
