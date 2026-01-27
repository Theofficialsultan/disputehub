"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { WizardProgress } from "@/components/features/dispute-wizard/WizardProgress";
import { TypeSelector } from "@/components/features/dispute-wizard/TypeSelector";
import { DescriptionForm } from "@/components/features/dispute-wizard/DescriptionForm";
import { EvidenceUpload } from "@/components/features/dispute-wizard/EvidenceUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EvidenceFile } from "@/lib/validations/dispute";
import { toast } from "sonner";

export default function DisputeWizardPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);

  const totalSteps = 4;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return type !== "";
      case 2:
        return title.length >= 5 && description.length >= 100;
      case 3:
        return true; // Evidence is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    try {
      // Update the existing dispute
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          evidenceFiles: files,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dispute");
      }

      // Generate AI preview
      const analyzeResponse = await fetch(
        `/api/disputes/${disputeId}/analyze`,
        {
          method: "POST",
        }
      );

      if (!analyzeResponse.ok) {
        throw new Error("Failed to generate preview");
      }

      toast.success("Dispute created successfully! Generating your AI analysis...", {
        duration: 3000,
      });
      router.push(`/disputes/${disputeId}/preview`);
    } catch (error) {
      console.error("Error updating dispute:", error);
      toast.error("Failed to update dispute. Please try again.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />

      <Card className="p-6 shadow-sm md:p-8">
        {/* Step 1: Type Selection */}
        {currentStep === 1 && (
          <TypeSelector value={type} onChange={setType} />
        )}

        {/* Step 2: Description */}
        {currentStep === 2 && (
          <DescriptionForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
          />
        )}

        {/* Step 3: Evidence Upload */}
        {currentStep === 3 && (
          <EvidenceUpload files={files} onFilesChange={setFiles} />
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Review your dispute</h2>
              <p className="text-muted-foreground">
                Check everything is correct before generating your analysis
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Dispute Type
                </h3>
                <p className="font-medium">{type.replace(/_/g, " ")}</p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Title
                </h3>
                <p className="font-medium">{title}</p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="whitespace-pre-wrap text-sm">{description}</p>
              </div>

              {files.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Evidence Files
                  </h3>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm">
                        • {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              loading={isSubmitting}
              size="lg"
            >
              {isSubmitting ? "Creating..." : "Generate Analysis"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
