"use client";

import { CaseLifecycleStatus } from "@prisma/client";
import { Clock, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseStatusHeaderProps {
  lifecycleStatus: CaseLifecycleStatus;
}

export function CaseStatusHeader({ lifecycleStatus }: CaseStatusHeaderProps) {
  const getStatusConfig = (status: CaseLifecycleStatus) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          description: "Your case is being prepared.",
          icon: FileText,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
        };
      case "DOCUMENT_SENT":
        return {
          label: "Document Sent",
          description: "Your document has been sent to the other party.",
          icon: CheckCircle,
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
        };
      case "AWAITING_RESPONSE":
        return {
          label: "Awaiting Response",
          description: "We're waiting for a response from the other party.",
          icon: Clock,
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
        };
      case "RESPONSE_RECEIVED":
        return {
          label: "Response Received",
          description: "The other party has responded to your case.",
          icon: CheckCircle,
          color: "bg-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
        };
      case "DEADLINE_MISSED":
        return {
          label: "Deadline Missed",
          description: "The deadline has passed. We've taken the next step automatically.",
          icon: AlertTriangle,
          color: "bg-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
        };
      case "CLOSED":
        return {
          label: "Closed",
          description: "This case has been closed.",
          icon: XCircle,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
        };
      default:
        return {
          label: status,
          description: "Case status",
          icon: FileText,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
        };
    }
  };

  const config = getStatusConfig(lifecycleStatus);
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 md:p-6`}
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-full ${config.color} p-2 md:p-3`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={config.color}>
              {config.label}
            </Badge>
          </div>
          <p className={`text-sm md:text-base ${config.textColor}`}>
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
