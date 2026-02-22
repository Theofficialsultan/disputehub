"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentFeedbackProps {
  documentId: string;
  existingFeedback?: {
    rating: number;
    comment?: string;
    hasErrors?: boolean;
  };
  onFeedbackSubmit?: () => void;
}

export function DocumentFeedback({ 
  documentId, 
  existingFeedback,
  onFeedbackSubmit 
}: DocumentFeedbackProps) {
  const [rating, setRating] = useState<number | null>(existingFeedback?.rating || null);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [hasErrors, setHasErrors] = useState(existingFeedback?.hasErrors || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please rate the document first");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment || null,
          hasErrors,
          errorTypes: hasErrors ? ["user_reported"] : [],
        }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      toast.success("Thanks for your feedback!");
      setShowForm(false);
      onFeedbackSubmit?.();
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingFeedback && !showForm) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>You rated this document</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowForm(true)}
          className="text-xs"
        >
          Update
        </Button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Rate this document:</span>
        <div className="flex gap-2">
          <Button
            variant={rating === 5 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setRating(5);
              setShowForm(true);
            }}
            className="gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            Good
          </Button>
          <Button
            variant={rating === 1 ? "destructive" : "outline"}
            size="sm"
            onClick={() => {
              setRating(1);
              setShowForm(true);
            }}
            className="gap-1"
          >
            <ThumbsDown className="h-4 w-4" />
            Issues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Your rating:</span>
        <div className="flex gap-2">
          <Button
            variant={rating === 5 ? "default" : "outline"}
            size="sm"
            onClick={() => setRating(5)}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant={rating === 1 ? "destructive" : "outline"}
            size="sm"
            onClick={() => setRating(1)}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasErrors"
          checked={hasErrors}
          onChange={(e) => setHasErrors(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="hasErrors" className="text-sm flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          This document has errors or inaccuracies
        </label>
      </div>

      <Textarea
        placeholder="Any comments or suggestions? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting || !rating}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
        <Button variant="ghost" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
