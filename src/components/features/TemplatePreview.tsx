"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplatePlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
  required: boolean;
  source: "user" | "case" | "evidence" | "computed";
}

interface TemplatePreviewData {
  templateId: string;
  templateName: string;
  templateDescription: string;
  placeholders: TemplatePlaceholder[];
  sampleOutput: string;
  estimatedLength: string;
  documentType: "letter" | "form" | "notice";
  requiredFields: string[];
  optionalFields: string[];
}

interface TemplatePreviewProps {
  templateId?: string;
  onSelect?: (templateId: string) => void;
  showSelector?: boolean;
}

export function TemplatePreview({
  templateId,
  onSelect,
  showSelector = true,
}: TemplatePreviewProps) {
  const [templates, setTemplates] = useState<TemplatePreviewData[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplatePreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find((t) => t.templateId === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templateId, templates]);

  const fetchTemplates = async () => {
    try {
      // This would call your template preview API
      // For now, using mock data structure
      const mockTemplates: TemplatePreviewData[] = [
        {
          templateId: "UK-LBA-GENERAL",
          templateName: "Letter Before Action (General)",
          templateDescription:
            "A formal pre-court letter giving the recipient a final opportunity to resolve the dispute before legal proceedings are issued.",
          placeholders: [
            {
              key: "sender_name",
              label: "Your Full Name",
              description: "Your legal name as it will appear on the letter",
              example: "John Smith",
              required: true,
              source: "user",
            },
            {
              key: "claim_amount",
              label: "Claim Amount",
              description: "The total amount you are claiming",
              example: "£2,500.00",
              required: true,
              source: "case",
            },
          ],
          sampleOutput: `[Your Name]
[Your Address]

[Date]

[Recipient Name]
[Recipient Address]

LETTER BEFORE ACTION

Dear Sir/Madam,

RE: Formal Notice of Intended Legal Proceedings
Claim Amount: [£X,XXX.XX]

I write to notify you that unless the matter set out below is resolved within 14 days of the date of this letter, I intend to issue court proceedings against you without further notice.

[Case details will appear here...]

Yours faithfully,
[Your Name]`,
          estimatedLength: "1-2 pages",
          documentType: "letter",
          requiredFields: ["sender_name", "claim_amount"],
          optionalFields: ["evidence_list"],
        },
        {
          templateId: "UK-COMPLAINT-LETTER-GENERAL",
          templateName: "Formal Complaint Letter",
          templateDescription:
            "A structured complaint letter to formally raise an issue with a company or organisation.",
          placeholders: [
            {
              key: "sender_name",
              label: "Your Full Name",
              description: "Your legal name",
              example: "Jane Doe",
              required: true,
              source: "user",
            },
          ],
          sampleOutput: `[Your Name]
[Your Address]

[Date]

[Company Name]
[Company Address]

FORMAL COMPLAINT

Dear Sir/Madam,

I am writing to formally complain about [issue].

[Complaint details will appear here...]

Yours faithfully,
[Your Name]`,
          estimatedLength: "1 page",
          documentType: "letter",
          requiredFields: ["sender_name"],
          optionalFields: ["account_reference"],
        },
      ];

      setTemplates(mockTemplates);
      if (!templateId && mockTemplates.length > 0) {
        setSelectedTemplate(mockTemplates[0]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: TemplatePreviewData) => {
    setSelectedTemplate(template);
    onSelect?.(template.templateId);
  };

  const getSourceBadge = (source: string) => {
    const styles = {
      user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      case: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      evidence: "bg-green-500/20 text-green-400 border-green-500/30",
      computed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return styles[source as keyof typeof styles] || styles.user;
  };

  if (loading) {
    return (
      <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-32 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      {showSelector && (
        <div className="rounded-2xl glass-strong border border-indigo-500/20 p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-3">
            Select Document Template
          </h4>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.templateId}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedTemplate?.templateId === template.templateId
                    ? "bg-indigo-500/20 border border-indigo-500/30"
                    : "bg-slate-800/30 border border-transparent hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText
                      className={`h-5 w-5 ${
                        selectedTemplate?.templateId === template.templateId
                          ? "text-indigo-400"
                          : "text-slate-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {template.templateName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {template.estimatedLength}
                      </p>
                    </div>
                  </div>
                  {selectedTemplate?.templateId === template.templateId && (
                    <Check className="h-5 w-5 text-indigo-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template Details */}
      {selectedTemplate && (
        <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedTemplate.templateName}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {selectedTemplate.templateDescription}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-indigo-500/30 text-white hover:bg-indigo-500/20"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {/* Document Info */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded bg-slate-800 text-slate-400 capitalize">
                {selectedTemplate.documentType}
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="h-4 w-4" />
              {selectedTemplate.estimatedLength}
            </div>
          </div>

          {/* Required Fields */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Required Information ({selectedTemplate.requiredFields.length})
            </h4>
            <div className="space-y-2">
              {selectedTemplate.placeholders
                .filter((p) => p.required)
                .map((placeholder) => (
                  <div
                    key={placeholder.key}
                    className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {placeholder.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${getSourceBadge(
                          placeholder.source
                        )}`}
                      >
                        {placeholder.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {placeholder.description}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Example: {placeholder.example}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-indigo-400" />
                <span className="text-xs text-slate-400">
                  Sample Output Preview
                </span>
              </div>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                {selectedTemplate.sampleOutput}
              </pre>
            </div>
          )}

          {/* Select Button */}
          {onSelect && (
            <Button
              onClick={() => onSelect(selectedTemplate.templateId)}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Use This Template
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
