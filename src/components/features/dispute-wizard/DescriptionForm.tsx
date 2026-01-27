"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface DescriptionFormProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function DescriptionForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: DescriptionFormProps) {
  const charCount = description.length;
  const minChars = 100;
  const maxChars = 5000;
  const isValid = charCount >= minChars && charCount <= maxChars;
  const titleValid = title.length >= 5;

  const titleError =
    title.length > 0 && !titleValid
      ? "Title must be at least 5 characters"
      : undefined;

  const descriptionError =
    description.length > 0 && charCount < minChars
      ? `Please provide at least ${minChars - charCount} more characters`
      : charCount > maxChars
        ? `Please reduce by ${charCount - maxChars} characters`
        : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Describe your dispute</h2>
        <p className="text-muted-foreground">
          Provide as much detail as possible for a better analysis
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" required>
          Brief Title
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Unfair parking fine on High Street"
          error={titleError}
          maxLength={200}
        />
        {titleValid && (
          <p className="text-xs text-green-600">✓ Title looks good</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" required>
          Full Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What happened? When did it occur? Who was involved? What evidence do you have?"
          rows={8}
          error={descriptionError}
          maxLength={maxChars}
          className="resize-none"
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={
              charCount < minChars
                ? "text-muted-foreground"
                : isValid
                  ? "font-medium text-green-600"
                  : "text-muted-foreground"
            }
          >
            {isValid ? (
              <>✓ {charCount} characters</>
            ) : (
              <>
                {charCount} / {minChars} minimum
              </>
            )}
          </span>
          <span className="text-muted-foreground">
            {maxChars - charCount} remaining
          </span>
        </div>
      </div>

      {/* Helpful Tips */}
      <Card className="border-primary/20 bg-primary/5 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span className="text-lg">💡</span>
          Tips for a better analysis
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Include specific dates, times, and locations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Mention any communication with the other party</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Describe what evidence you have</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Explain why you believe the decision was wrong</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
