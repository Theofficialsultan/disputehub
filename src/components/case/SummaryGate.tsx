/**
 * SUMMARY GATE - HARD-BLOCKING EDITABLE CONFIRMATION
 * 
 * This is the CRITICAL GATE between fact-gathering and routing.
 * NO ROUTING, NO DOCUMENTS, NO ASSUMPTIONS until user confirms.
 * 
 * Philosophy: Give user full control - they can edit any extracted fact.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Edit2, FileText, Calendar, DollarSign, User } from "lucide-react";
import type { ExtractedFacts } from "@/lib/ai/system-b-extractor";

interface SummaryGateProps {
  caseId: string;
  extractedFacts: ExtractedFacts;
  caseSummaryText: string;
  onConfirm: (edits?: Partial<ExtractedFacts>) => Promise<void>;
  onReject: () => Promise<void>;
}

export function SummaryGate({
  caseId,
  extractedFacts,
  caseSummaryText,
  onConfirm,
  onReject,
}: SummaryGateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Partial<ExtractedFacts>>(extractedFacts);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(isEditing ? edits : undefined);
    } catch (error) {
      console.error("Error confirming summary:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const readinessColor =
    extractedFacts.readinessScore >= 80
      ? "text-green-500"
      : extractedFacts.readinessScore >= 60
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Header */}
          <div className="p-8 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-slate-900">Confirm Your Case Summary</h1>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Readiness Score</div>
                  <div className={`text-2xl font-bold ${readinessColor}`}>
                    {extractedFacts.readinessScore}%
                  </div>
                </div>
              </div>
            </div>
            <p className="text-slate-600 text-lg">
              I've summarized what you've told me. Please review carefully and confirm it's accurate before I
              proceed with routing and document generation.
            </p>
          </div>

          {/* Summary Content */}
          <div className="p-8 space-y-6">
            {/* Dispute Type */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-start space-x-4">
                <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Dispute Type</h3>
                  {isEditing ? (
                    <input
                      type="text"
                      value={edits.disputeType || ""}
                      onChange={(e) => setEdits({ ...edits, disputeType: e.target.value })}
                      className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., employment, housing, consumer"
                    />
                  ) : (
                    <p className="text-slate-600 text-lg capitalize">
                      {extractedFacts.disputeType || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-start space-x-4">
                <User className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Parties Involved</h3>
                  <div>
                    <label className="text-sm text-slate-500 block mb-1">Your Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={edits.parties?.user || ""}
                        onChange={(e) =>
                          setEdits({ ...edits, parties: { ...edits.parties!, user: e.target.value } })
                        }
                        className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-slate-600">{extractedFacts.parties.user || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 block mb-1">Other Party</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={edits.parties?.counterparty || ""}
                        onChange={(e) =>
                          setEdits({ ...edits, parties: { ...edits.parties!, counterparty: e.target.value } })
                        }
                        className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-slate-600">{extractedFacts.parties.counterparty || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 block mb-1">Your Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={edits.parties?.relationship || ""}
                        onChange={(e) =>
                          setEdits({ ...edits, parties: { ...edits.parties!, relationship: e.target.value } })
                        }
                        className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., employee, tenant, consumer"
                      />
                    ) : (
                      <p className="text-slate-600 capitalize">
                        {extractedFacts.parties.relationship || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              {extractedFacts.incidentDate && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Incident Date</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={edits.incidentDate || ""}
                          onChange={(e) => setEdits({ ...edits, incidentDate: e.target.value })}
                          className="w-full bg-white text-slate-900 px-3 py-1 rounded border border-slate-200 text-sm"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">{extractedFacts.incidentDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              {extractedFacts.financialAmount && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1">Amount Claimed</p>
                      {isEditing ? (
                        <input
                          type="number"
                          value={edits.financialAmount || ""}
                          onChange={(e) => setEdits({ ...edits, financialAmount: Number(e.target.value) })}
                          className="w-full bg-white text-slate-900 px-3 py-1 rounded border border-slate-200 text-sm"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium text-lg">
                          £{extractedFacts.financialAmount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Status */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Evidence Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600">
                    <strong>{extractedFacts.evidenceProvided.length}</strong> evidence items mentioned/uploaded
                  </span>
                </div>
                {extractedFacts.evidenceProvided.length === 0 && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-slate-500 text-sm">No evidence mentioned yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Text */}
            <div className="bg-blue-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Summary of Your Case</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{caseSummaryText}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={onReject}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                ✏️ Something's Wrong - Go Back
              </Button>

              <div className="flex items-center space-x-4">
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                )}

                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEdits(extractedFacts);
                    }}
                    className="border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Cancel Edits
                  </Button>
                )}

                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isEditing ? "Save & Confirm" : "✅ Yes, This is Correct"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
