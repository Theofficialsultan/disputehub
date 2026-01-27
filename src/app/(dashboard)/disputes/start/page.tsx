"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, MessageSquare, ArrowRight } from "lucide-react";

type DisputeMode = "QUICK" | "GUIDED";

export default function StartDisputePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<DisputeMode | null>(null);

  const handleModeSelect = async (mode: DisputeMode) => {
    setSelectedMode(mode);
    setIsCreating(true);

    try {
      const response = await fetch("/api/disputes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error("Failed to create dispute");
      }

      const data = await response.json();

      // Redirect based on mode
      if (mode === "QUICK") {
        router.push(`/disputes/${data.id}/wizard`);
      } else {
        router.push(`/disputes/${data.id}/case`);
      }
    } catch (error) {
      console.error("Error creating dispute:", error);
      toast.error("Failed to create dispute. Please try again.");
      setIsCreating(false);
      setSelectedMode(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">
          How would you like to proceed?
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose the best approach for your dispute
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Letter Card */}
        <Card
          className={`group relative cursor-pointer overflow-hidden border-2 p-6 transition-all hover:border-primary hover:shadow-lg ${
            selectedMode === "QUICK" && isCreating
              ? "border-primary bg-primary/5"
              : ""
          }`}
          onClick={() => !isCreating && handleModeSelect("QUICK")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110">
              <Zap className="h-8 w-8" />
            </div>

            <h2 className="mb-2 text-2xl font-bold">Quick Letter</h2>
            
            <p className="mb-4 text-muted-foreground">
              Get an AI-generated dispute letter in 3 simple steps
            </p>

            <ul className="mb-6 space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Select your dispute type</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Describe your situation</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Get your formatted letter</span>
              </li>
            </ul>

            <Button
              className="w-full"
              disabled={isCreating}
              loading={selectedMode === "QUICK" && isCreating}
            >
              {selectedMode === "QUICK" && isCreating
                ? "Starting..."
                : "Start Quick Letter"}
            </Button>

            <div className="mt-3 text-xs text-muted-foreground">
              Best for straightforward cases
            </div>
          </div>
        </Card>

        {/* Guided Case Card */}
        <Card
          className={`group relative cursor-pointer overflow-hidden border-2 p-6 transition-all hover:border-primary hover:shadow-lg ${
            selectedMode === "GUIDED" && isCreating
              ? "border-primary bg-primary/5"
              : ""
          }`}
          onClick={() => !isCreating && handleModeSelect("GUIDED")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110">
              <MessageSquare className="h-8 w-8" />
            </div>

            <h2 className="mb-2 text-2xl font-bold">Guided Case</h2>
            
            <p className="mb-4 text-muted-foreground">
              Work with our AI assistant to build your case step-by-step
            </p>

            <ul className="mb-6 space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Chat with AI about your case</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Get personalized guidance</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Build stronger arguments</span>
              </li>
            </ul>

            <Button
              className="w-full"
              disabled={isCreating}
              loading={selectedMode === "GUIDED" && isCreating}
            >
              {selectedMode === "GUIDED" && isCreating
                ? "Starting..."
                : "Start Guided Case"}
            </Button>

            <div className="mt-3 text-xs text-muted-foreground">
              Best for complex situations
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Not sure which to choose? Start with Guided Case for personalized help.
      </div>
    </div>
  );
}
