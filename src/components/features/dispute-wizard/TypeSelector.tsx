"use client";

import { DISPUTE_TYPES } from "@/lib/validations/dispute";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What type of dispute is this?</h2>
        <p className="text-muted-foreground">
          Select the category that best matches your situation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {DISPUTE_TYPES.map((type, index) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`group relative flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 text-center transition-all hover:scale-105 hover:border-primary hover:shadow-md active:scale-95 ${
              value === type.value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:bg-accent/50"
            }`}
            style={{
              animationDelay: `${index * 30}ms`,
            }}
            aria-pressed={value === type.value}
            aria-label={`Select ${type.label}`}
          >
            <span className="text-4xl transition-transform group-hover:scale-110">
              {type.icon}
            </span>
            <span className="text-sm font-medium leading-tight">
              {type.label}
            </span>
            {value === type.value && (
              <div className="absolute -right-1 -top-1">
                <Badge variant="success" className="h-6 w-6 rounded-full p-0">
                  ✓
                </Badge>
              </div>
            )}
          </button>
        ))}
      </div>

      {value && (
        <Card className="animate-slide-in-bottom border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {DISPUTE_TYPES.find((t) => t.value === value)?.icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {DISPUTE_TYPES.find((t) => t.value === value)?.label} selected
              </p>
              <p className="text-xs text-muted-foreground">
                We'll tailor the analysis for this type of dispute
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
