"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DisputeCardProps {
  dispute: {
    id: string;
    title: string;
    description: string;
    type: string;
    createdAt: Date;
    strengthScore: string | null;
    aiPreview: any;
  };
}

const strengthConfig = {
  weak: { icon: "🔴", variant: "destructive" as const, label: "Weak" },
  moderate: { icon: "🟡", variant: "warning" as const, label: "Moderate" },
  strong: { icon: "🟢", variant: "success" as const, label: "Strong" },
};

export function DisputeCard({ dispute }: DisputeCardProps) {
  const strengthScore = dispute.strengthScore as
    | "weak"
    | "moderate"
    | "strong"
    | null;

  const strength = strengthScore ? strengthConfig[strengthScore] : null;

  return (
    <Link
      href={
        dispute.aiPreview
          ? `/disputes/${dispute.id}/preview`
          : `/disputes/${dispute.id}`
      }
      className="group block"
    >
      <Card className="h-full transition-all hover:border-primary hover:shadow-md">
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-tight group-hover:text-primary">
              {dispute.title}
            </h3>
            {strength && (
              <Badge variant={strength.variant} className="flex-shrink-0">
                {strength.icon} {strength.label}
              </Badge>
            )}
          </div>

          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {dispute.description}
          </p>

          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span className="capitalize">
              {dispute.type.replace(/_/g, " ")}
            </span>
            <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
          </div>

          {dispute.aiPreview && (
            <Badge variant="info" className="mt-3">
              Preview Available
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
